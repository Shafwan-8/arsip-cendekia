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
   * Memulai alur generate AI melalui SSE stream
   * TIDAK ADA query ke Supabase selama streaming berjalan (murni draft in-memory)
   */
  async function generate(newTitle: string, newCategory: typeof category.value) {
    resetDraft()
    title.value = newTitle.trim()
    category.value = newCategory
    status.value = 'generating'
    currentActivity.value = 'Merancang outline literatur komprehensif...'

    abortController.value = new AbortController()

    try {
      const response = await fetch('/api/ai-generate-book-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.value,
          category: category.value
        }),
        signal: abortController.value.signal
      })

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson?.statusMessage || 'Gagal memulai koneksi AI generator.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let rawChaptersList: string[] = []

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
            const data = JSON.parse(eventData)

            switch (eventType) {
              case 'outline': {
                rawChaptersList = Array.isArray(data.chapters) ? data.chapters : []
                const newBlocks: DocumentContentBlock[] = []
                let order = 1

                // 1. Daftar Isi
                newBlocks.push({
                  id: 'temp-daftar-isi',
                  document_id: '',
                  block_order: order++,
                  section_type: 'daftar_isi',
                  title: 'Daftar Isi',
                  content: { raw_markdown: data.daftarIsiMarkdown || '# Daftar Isi' }
                })

                // 2. Bab-bab buku
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

                // 4. Daftar Pustaka
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
                break
              }

              case 'chapter_start': {
                currentStreamingIndex.value = data.index
                currentStreamingText.value = ''
                currentActivity.value = `Menulis ${data.title}...`
                break
              }

              case 'chapter_token': {
                currentStreamingText.value += data.text
                break
              }

              case 'chapter_done': {
                const targetIdx = data.index
                if (data.title === 'Kesimpulan dan Rekomendasi') {
                  const kesimpulanBlock = chapters.value.find(c => c.section_type === 'kesimpulan')
                  if (kesimpulanBlock) {
                    kesimpulanBlock.content = { raw_markdown: data.text }
                  }
                } else if (typeof targetIdx === 'number' && rawChaptersList[targetIdx]) {
                  const babBlock = chapters.value.find(c => c.id === `temp-bab-${targetIdx}`)
                  if (babBlock) {
                    babBlock.content = { raw_markdown: data.text }
                  }
                }
                break
              }

              case 'references_start': {
                currentActivity.value = 'Menyusun grounding Daftar Pustaka dari OpenAlex...'
                break
              }

              case 'references_done': {
                const pustakaBlock = chapters.value.find(c => c.section_type === 'daftar_pustaka')
                if (pustakaBlock) {
                  pustakaBlock.content = { raw_markdown: data.markdown }
                }
                currentActivity.value = 'Menyelesaikan penyusunan karya...'
                break
              }

              case 'done': {
                status.value = 'draft_ready'
                currentActivity.value = 'Literatur berhasil disusun sepenuhnya!'
                currentStreamingIndex.value = null
                currentStreamingText.value = ''
                if (chapters.value.length > 0 && !activeBlockId.value) {
                  activeBlockId.value = chapters.value[0].id
                }
                break
              }

              case 'error': {
                status.value = 'failed'
                errorMessage.value = data.message || 'Terjadi kesalahan pada generator AI.'
                break
              }
            }
          } catch (jsonErr) {
            console.warn('Gagal parse chunk data SSE:', jsonErr)
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('Error streaming literatur AI:', err)
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
