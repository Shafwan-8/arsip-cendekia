import { ref } from 'vue'
import type { AiGenerationStatus, GenerationChapterProgress } from '~/types/documentContentBlock'

/**
 * Composable lokal untuk mengelola alur SSE streaming pembuatan literatur AI (Buku, Jurnal, Skripsi).
 */
export function useBookGenerator() {
  const status = ref<AiGenerationStatus>('pending')
  const chapters = ref<GenerationChapterProgress[]>([])
  const currentChapterText = ref('')
  const currentChapterIndex = ref<number | null>(null)
  const currentActivity = ref('')
  const documentId = ref<string | number | null>(null)
  const errorMessage = ref('')
  const abortController = ref<AbortController | null>(null)

  /**
   * Reset semua state ke kondisi awal
   */
  const resetState = () => {
    status.value = 'pending'
    chapters.value = []
    currentChapterText.value = ''
    currentChapterIndex.value = null
    currentActivity.value = ''
    documentId.value = null
    errorMessage.value = ''
  }

  /**
   * Menghentikan proses streaming jika sedang berjalan
   */
  const abortGeneration = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      status.value = 'failed'
      errorMessage.value = 'Pembuatan literatur dihentikan oleh pengguna.'
    }
  }

  /**
   * Helper membaca SSE stream dan mengekstrak token secara real-time
   */
  const readSseStream = async (
    response: Response,
    onToken: (text: string) => void,
    onDone?: (data: any) => void
  ) => {
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
   * Memulai proses generate buku/literatur melalui endpoint modular step-by-step
   */
  const generateBook = async (
    title: string,
    category: 'buku' | 'jurnal' | 'skripsi',
    meta?: { userId?: string | null; author?: string | null }
  ) => {
    resetState()
    status.value = 'generating'
    currentActivity.value = 'Menyiapkan dokumen dan outline literatur...'

    abortController.value = new AbortController()
    const signal = abortController.value.signal

    try {
      // 1. OUTLINE
      const outlineRes = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category }),
        signal
      })

      if (!outlineRes.ok) {
        const errJson = await outlineRes.json().catch(() => ({}))
        throw new Error(errJson?.statusMessage || 'Gagal merancang outline literatur.')
      }

      const outlineData = await outlineRes.json()
      const rawChapters: string[] = Array.isArray(outlineData.chapters) ? outlineData.chapters : []

      chapters.value = rawChapters.map((ch: string, idx: number) => ({
        index: idx,
        title: ch,
        status: 'pending'
      }))
      // Tambahkan bab kesimpulan
      chapters.value.push({
        index: rawChapters.length,
        title: 'Kesimpulan dan Rekomendasi',
        status: 'pending'
      })

      if (signal.aborted) return

      // 2. PER-BAB STREAMING
      const summaries: string[] = []
      for (let i = 0; i < rawChapters.length; i++) {
        if (signal.aborted) return

        const chTitle = rawChapters[i]
        currentChapterIndex.value = i
        currentChapterText.value = ''
        currentActivity.value = `Menulis ${chTitle}...`
        const chItem = chapters.value.find(c => c.index === i)
        if (chItem) chItem.status = 'writing'

        const prevSummary = summaries.length > 0 ? summaries.slice(-2).join('\n') : null

        const chapterRes = await fetch('/api/ai/chapter-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            chapterTitle: chTitle,
            prevSummary
          }),
          signal
        })

        if (!chapterRes.ok) {
          const errJson = await chapterRes.json().catch(() => ({}))
          throw new Error(errJson?.statusMessage || `Gagal menulis bab "${chTitle}".`)
        }

        let accumulated = ''
        await readSseStream(
          chapterRes,
          (token) => {
            accumulated += token
            currentChapterText.value = accumulated
          },
          (doneData) => {
            if (doneData.text) accumulated = doneData.text
          }
        )

        if (chItem) chItem.status = 'done'
        summaries.push(`- ${chTitle}: Membahas aspek fundamental topik tersebut.`)
      }

      if (signal.aborted) return

      // 3. KESIMPULAN
      const conclusionIdx = rawChapters.length
      currentChapterIndex.value = conclusionIdx
      currentChapterText.value = ''
      currentActivity.value = 'Menulis Kesimpulan dan Rekomendasi...'
      const conclusionItem = chapters.value.find(c => c.index === conclusionIdx)
      if (conclusionItem) conclusionItem.status = 'writing'

      const conclusionRes = await fetch('/api/ai/conclusion-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summaries: summaries.join('\n')
        }),
        signal
      })

      if (!conclusionRes.ok) {
        const errJson = await conclusionRes.json().catch(() => ({}))
        throw new Error(errJson?.statusMessage || 'Gagal menulis bab kesimpulan.')
      }

      let conclusionAcc = ''
      await readSseStream(
        conclusionRes,
        (token) => {
          conclusionAcc += token
          currentChapterText.value = conclusionAcc
        },
        (doneData) => {
          if (doneData.text) conclusionAcc = doneData.text
        }
      )

      if (conclusionItem) conclusionItem.status = 'done'

      if (signal.aborted) return

      // 4. REFERENSI
      currentActivity.value = 'Menyusun grounding Daftar Pustaka dari OpenAlex...'
      try {
        await fetch('/api/ai/references', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
          signal
        })
      } catch (refErr) {
        console.warn('Gagal fetch referensi OpenAlex:', refErr)
      }

      if (signal.aborted) return

      // 5. SELESAI
      status.value = 'completed'
      currentActivity.value = 'Literatur berhasil disusun sepenuhnya!'
    } catch (err: any) {
      if (err.name === 'AbortError' || signal.aborted) return
      console.error('Error saat generate literatur:', err)
      status.value = 'failed'
      errorMessage.value = err?.message || 'Terjadi gangguan pada koneksi ke server.'
    } finally {
      abortController.value = null
    }
  }

  return {
    status,
    chapters,
    currentChapterText,
    currentChapterIndex,
    currentActivity,
    documentId,
    errorMessage,
    generateBook,
    abortGeneration,
    resetState
  }
}
