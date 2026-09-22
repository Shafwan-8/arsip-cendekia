import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DocumentContentBlock } from '~/types/documentContentBlock'

export const useBookGeneratorStore = defineStore('bookGenerator', () => {
  const { client, user } = useSupabase()

  const title = ref('')
  const category = ref<'buku' | 'jurnal' | 'skripsi'>('buku')
  const status = ref<'idle' | 'generating' | 'draft_ready' | 'saving' | 'saved' | 'failed'>('idle')
  const chapters = ref<DocumentContentBlock[]>([])
  const activeBlockId = ref<string | null>(null)
  const currentStreamingIndex = ref<number | null>(null)
  const currentStreamingText = ref('')
  const currentActivity = ref('')
  const errorMessage = ref('')
  const savedDocumentId = ref<string | number | null>(null)
  const abortController = ref<AbortController | null>(null)

  // Menandai apakah ada konten draft yang belum disimpan ke database Supabase
  const hasUnsavedChanges = computed(() => {
    return status.value === 'draft_ready' && savedDocumentId.value === null
  })

  // Blok aktif yang sedang diedit di TipTap editor
  const activeBlock = computed(() => {
    if (!activeBlockId.value) return chapters.value[0] || null
    return chapters.value.find(b => b.id === activeBlockId.value) || chapters.value[0] || null
  })

  // Daftar outline judul bab untuk tampilan progress
  const outlineChapters = computed(() => {
    return chapters.value
      .filter(ch => ch.section_type === 'bab' || ch.section_type === 'kesimpulan')
      .map((ch, idx) => ({
        index: idx,
        title: ch.title,
        status: ch.content && Object.keys(ch.content).length > 0 && (ch.content.raw_markdown || ch.content.html)
          ? ('done' as const)
          : currentStreamingIndex.value === idx
            ? ('writing' as const)
            : ('pending' as const)
      }))
  })

  /**
   * Reset seluruh state draft ke kondisi awal
   */
  function resetDraft() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    title.value = ''
    category.value = 'buku'
    status.value = 'idle'
    chapters.value = []
    activeBlockId.value = null
    currentStreamingIndex.value = null
    currentStreamingText.value = ''
    currentActivity.value = ''
    errorMessage.value = ''
    savedDocumentId.value = null
  }

  /**
   * Menghentikan proses pembuatan literatur jika sedang berlangsung
   */
  function abortGeneration() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      status.value = 'failed'
      errorMessage.value = 'Pembuatan literatur dihentikan oleh pengguna.'
    }
  }

  /**
   * Mendapatkan user ID dan display name pengguna yang sedang login
   */
  async function getActiveUserInfo(): Promise<{ userId: string | null; authorName: string }> {
    let foundId: string | null = null
    let foundName: string | null = null

    if (client) {
      try {
        const { data: sessionData } = await client.auth.getSession()
        const sessionUser: any = sessionData?.session?.user
        if (sessionUser) {
          foundId = sessionUser.id || sessionUser.sub || null
          const meta = sessionUser.user_metadata
          foundName = meta?.display_name || meta?.full_name || meta?.name || sessionUser.email?.split('@')[0] || null
        }
      } catch (e) {
        console.warn('[useBookGeneratorStore] Gagal getSession:', e)
      }

      if (!foundId) {
        try {
          const { data: userData } = await client.auth.getUser()
          const u: any = userData?.user
          if (u) {
            foundId = u.id || u.sub || null
            const meta = u.user_metadata
            foundName = foundName || meta?.display_name || meta?.full_name || meta?.name || u.email?.split('@')[0] || null
          }
        } catch (e) {
          console.warn('[useBookGeneratorStore] Gagal getUser:', e)
        }
      }
    }

    if (!foundId && user.value) {
      const u: any = user.value
      foundId = u.id || u.sub || null
      const meta = u.user_metadata
      foundName = foundName || meta?.display_name || meta?.full_name || meta?.name || u.display_name || u.name || u.email?.split('@')[0] || null
    }

    return {
      userId: foundId,
      authorName: foundName || 'Penulis Cendekia'
    }
  }

  /**
   * Helper membaca SSE stream dan mengekstrak token secara real-time
   */
  async function readSseStream(
    response: Response,
    onToken: (text: string) => void,
    onDone?: (data: any) => void
  ) {
    if (!response.body) return
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const evt of events) {
        if (!evt.trim()) continue
        let eventType = 'message'
        let eventData = ''
        const lines = evt.split('\n')
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim()
          } else if (line.startsWith('data:')) {
            eventData = line.replace('data:', '').trim()
          }
        }
        if (!eventData) continue
        try {
          const parsed = JSON.parse(eventData)
          if (eventType === 'token' && parsed.text) {
            onToken(parsed.text)
          } else if (eventType === 'done') {
            if (onDone) onDone(parsed)
          } else if (eventType === 'error') {
            throw new Error(parsed.message || 'Terjadi kesalahan saat memproses streaming AI.')
          }
        } catch (e: any) {
          if (eventType === 'error') throw e
          console.warn('Gagal membaca event SSE:', e)
        }
      }
    }
  }

  /**
   * Memulai alur generate AI per-bab (step-by-step modular)
   * Setiap bab diproses dalam request independen (~10-15s), kebal dari timeout 60 detik Vercel Hobby.
   */
  async function generate(newTitle: string, newCategory: typeof category.value) {
    resetDraft()
    title.value = newTitle.trim()
    category.value = newCategory
    status.value = 'generating'
    currentActivity.value = 'Merancang outline literatur komprehensif...'

    abortController.value = new AbortController()
    const signal = abortController.value.signal

    try {
      // 1. TAHAP OUTLINE: Mendapatkan struktur bab dan daftar isi (~4-8 detik)
      const outlineRes = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.value,
          category: category.value
        }),
        signal
      })

      if (!outlineRes.ok) {
        const errJson = await outlineRes.json().catch(() => ({}))
        throw new Error(errJson?.statusMessage || 'Gagal merancang outline literatur.')
      }

      const outlineData = await outlineRes.json()
      const rawChaptersList: string[] = Array.isArray(outlineData.chapters) ? outlineData.chapters : []

      if (rawChaptersList.length === 0) {
        throw new Error('Daftar isi/outline tidak memiliki bab yang valid.')
      }

      // Siapkan kerangka dokumen in-memory
      const newBlocks: DocumentContentBlock[] = []
      let order = 1

      // 1. Daftar Isi
      newBlocks.push({
        id: 'temp-daftar-isi',
        document_id: '',
        block_order: order++,
        section_type: 'daftar_isi',
        title: 'Daftar Isi',
        content: { raw_markdown: outlineData.daftarIsiMarkdown || '# Daftar Isi' }
      })

      // 2. Kerangka Bab-bab
      rawChaptersList.forEach((chTitle, idx) => {
        newBlocks.push({
          id: `temp-bab-${idx}`,
          document_id: '',
          block_order: order++,
          section_type: 'bab',
          title: chTitle,
          content: { raw_markdown: '' }
        })
      })

      // 3. Bab Kesimpulan
      newBlocks.push({
        id: 'temp-kesimpulan',
        document_id: '',
        block_order: order++,
        section_type: 'kesimpulan',
        title: 'Kesimpulan dan Rekomendasi',
        content: { raw_markdown: '' }
      })

      // 4. Bab Daftar Pustaka
      newBlocks.push({
        id: 'temp-daftar-pustaka',
        document_id: '',
        block_order: order++,
        section_type: 'daftar_pustaka',
        title: 'Daftar Pustaka',
        content: { raw_markdown: '' }
      })

      chapters.value = newBlocks
      activeBlockId.value = newBlocks[0]?.id || null

      if (signal.aborted) return

      // 2. TAHAP LOOP PENULISAN BAB (Streaming per bab, ~10-15s per request)
      const chapterSummaries: string[] = []

      for (let i = 0; i < rawChaptersList.length; i++) {
        if (signal.aborted) return

        const chapterTitle = rawChaptersList[i]
        currentStreamingIndex.value = i
        currentStreamingText.value = ''
        currentActivity.value = `Menulis ${chapterTitle}...`

        const prevSummary = chapterSummaries.length > 0 ? chapterSummaries.slice(-2).join('\n') : null

        const chapterRes = await fetch('/api/ai/chapter-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.value,
            chapterTitle,
            prevSummary
          }),
          signal
        })

        if (!chapterRes.ok) {
          const errJson = await chapterRes.json().catch(() => ({}))
          throw new Error(errJson?.statusMessage || `Gagal menulis bab "${chapterTitle}".`)
        }

        let chapterAccumulated = ''
        await readSseStream(
          chapterRes,
          (token) => {
            chapterAccumulated += token
            currentStreamingText.value = chapterAccumulated
          },
          (doneData) => {
            if (doneData.text) {
              chapterAccumulated = doneData.text
            }
          }
        )

        if (signal.aborted) return

        // Simpan hasil bab ke state
        const babBlock = chapters.value.find(c => c.id === `temp-bab-${i}`)
        if (babBlock) {
          babBlock.content = { raw_markdown: chapterAccumulated }
        }

        chapterSummaries.push(`- ${chapterTitle}: Membahas aspek fundamental dan analisis mendalam topik ini.`)
      }

      if (signal.aborted) return

      // 3. TAHAP PENULISAN BAB KESIMPULAN (Streaming ~8-12 detik)
      const conclusionIndex = rawChaptersList.length
      currentStreamingIndex.value = conclusionIndex
      currentStreamingText.value = ''
      currentActivity.value = 'Menulis Kesimpulan dan Rekomendasi...'

      const conclusionRes = await fetch('/api/ai/conclusion-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.value,
          summaries: chapterSummaries.join('\n')
        }),
        signal
      })

      if (!conclusionRes.ok) {
        const errJson = await conclusionRes.json().catch(() => ({}))
        throw new Error(errJson?.statusMessage || 'Gagal menulis bab kesimpulan.')
      }

      let conclusionAccumulated = ''
      await readSseStream(
        conclusionRes,
        (token) => {
          conclusionAccumulated += token
          currentStreamingText.value = conclusionAccumulated
        },
        (doneData) => {
          if (doneData.text) {
            conclusionAccumulated = doneData.text
          }
        }
      )

      if (signal.aborted) return

      const kesimpulanBlock = chapters.value.find(c => c.section_type === 'kesimpulan')
      if (kesimpulanBlock) {
        kesimpulanBlock.content = { raw_markdown: conclusionAccumulated }
      }

      // 4. TAHAP DAFTAR PUSTAKA: Grounding OpenAlex (~2-4 detik)
      currentActivity.value = 'Menyusun grounding Daftar Pustaka dari OpenAlex...'

      try {
        const referencesRes = await fetch('/api/ai/references', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.value
          }),
          signal
        })

        if (referencesRes.ok) {
          const refData = await referencesRes.json()
          const pustakaBlock = chapters.value.find(c => c.section_type === 'daftar_pustaka')
          if (pustakaBlock) {
            pustakaBlock.content = { raw_markdown: refData.markdown }
          }
        }
      } catch (refErr) {
        console.warn('[useBookGeneratorStore] Pencarian referensi gagal, melanjutkan tanpa grounding luar:', refErr)
      }

      if (signal.aborted) return

      // 5. PENYELESAIAN
      status.value = 'draft_ready'
      currentActivity.value = 'Literatur berhasil disusun sepenuhnya!'
      currentStreamingIndex.value = null
      currentStreamingText.value = ''
      if (chapters.value.length > 0 && !activeBlockId.value) {
        activeBlockId.value = chapters.value[0].id
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || signal.aborted) return
      console.error('Error saat proses pembuatan literatur:', err)
      status.value = 'failed'
      errorMessage.value = err?.message || 'Terjadi gangguan koneksi ke server.'
    } finally {
      abortController.value = null
    }
  }

  /**
   * Update isi konten blok aktif di memori browser
   */
  function updateBlockContent(blockId: string, newContent: Record<string, any>) {
    const target = chapters.value.find(b => b.id === blockId)
    if (target) {
      target.content = newContent
      // Jika sebelumnya sudah berstatus saved lalu diedit, kembalikan ke draft_ready
      if (status.value === 'saved') {
        savedDocumentId.value = null
        status.value = 'draft_ready'
      }
    }
  }

  /**
   * Memilih blok aktif untuk editor TipTap
   */
  function selectBlock(blockId: string) {
    activeBlockId.value = blockId
  }

  /**
   * Menyimpan draft literatur dari Pinia store ke database Supabase
   * HANYA dipanggil saat user menekan tombol "Simpan"
   */
  async function saveDraftToSupabase(): Promise<boolean> {
    if (!client) {
      errorMessage.value = 'Koneksi Supabase tidak tersedia.'
      return false
    }

    if (chapters.value.length === 0) {
      errorMessage.value = 'Belum ada bagian literatur untuk disimpan.'
      return false
    }

    status.value = 'saving'
    errorMessage.value = ''

    const { userId, authorName } = await getActiveUserInfo()

    try {
      const slugFileName = title.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 50) + '.pdf'

      // 1. Buat record dokumen baru di tabel `documents`
      const { data: newDoc, error: docError } = await client
        .from('documents')
        .insert([
          {
            title: title.value,
            category: category.value,
            user_id: userId,
            author: authorName,
            publisher: 'Arsip Cendekia',
            year: new Date().getFullYear(),
            pages: 0,
            file_name: slugFileName,
            file_size: '-',
            file_url: '',
            status: 'Pribadi',
            source: 'ai_generated',
            ai_generation_status: 'completed',
            ai_generation_completed_at: new Date().toISOString(),
            pdf_cache_stale: true,
            uploaded_at: new Date().toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          }
        ])
        .select('id')
        .single()

      if (docError || !newDoc) {
        throw new Error(`Gagal menyimpan data dokumen: ${docError?.message || 'Dokumen gagal dibuat'}`)
      }

      const createdDocId = newDoc.id

      // 2. Simpan seluruh blok bab ke tabel `document_content_blocks`
      const blockRows = chapters.value.map(ch => ({
        document_id: createdDocId,
        block_order: ch.block_order,
        section_type: ch.section_type,
        title: ch.title,
        content: ch.content
      }))

      const { data: insertedBlocks, error: blocksError } = await client
        .from('document_content_blocks')
        .insert(blockRows)
        .select('id, block_order')

      if (blocksError) {
        // Rollback dokumen jika insert blok gagal
        await client.from('documents').delete().eq('id', createdDocId)
        throw new Error(`Gagal menyimpan bagian literatur: ${blocksError.message}`)
      }

      // Update ID blok di memory dengan ID dari DB jika ada
      if (insertedBlocks && insertedBlocks.length > 0) {
        insertedBlocks.forEach(ib => {
          const matchingChapter = chapters.value.find(c => c.block_order === ib.block_order)
          if (matchingChapter) {
            matchingChapter.id = ib.id
            matchingChapter.document_id = createdDocId
          }
        })
      }

      savedDocumentId.value = createdDocId
      status.value = 'saved'
      return true
    } catch (err: any) {
      console.error('[useBookGeneratorStore] Gagal menyimpan draft:', err)
      errorMessage.value = err?.message || 'Gagal menyimpan karya ke arsip.'
      status.value = 'draft_ready'
      return false
    }
  }

  return {
    title,
    category,
    status,
    chapters,
    activeBlockId,
    activeBlock,
    outlineChapters,
    currentStreamingIndex,
    currentStreamingText,
    currentActivity,
    errorMessage,
    savedDocumentId,
    hasUnsavedChanges,
    resetDraft,
    abortGeneration,
    generate,
    updateBlockContent,
    selectBlock,
    saveDraftToSupabase
  }
})
