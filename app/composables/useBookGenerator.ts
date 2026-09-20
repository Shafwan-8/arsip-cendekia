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
   * Memulai proses generate buku/literatur melalui endpoint SSE
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

    try {
      const response = await fetch('/api/ai-generate-book-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          category,
          user_id: meta?.userId || null,
          author: meta?.author || null
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
              case 'created':
                documentId.value = data.documentId
                currentActivity.value = 'Merancang outline bab komprehensif...'
                break

              case 'outline':
                if (Array.isArray(data.chapters)) {
                  chapters.value = data.chapters.map((ch: string, idx: number) => ({
                    index: idx,
                    title: ch,
                    status: 'pending'
                  }))
                  // Tambahkan bab kesimpulan
                  chapters.value.push({
                    index: data.chapters.length,
                    title: 'Kesimpulan dan Rekomendasi',
                    status: 'pending'
                  })
                }
                break

              case 'chapter_start': {
                const idx = data.index
                currentChapterIndex.value = idx
                currentChapterText.value = ''
                currentActivity.value = `Menulis ${data.title}...`
                const ch = chapters.value.find(c => c.index === idx)
                if (ch) ch.status = 'writing'
                break
              }

              case 'chapter_token':
                currentChapterText.value += data.text
                break

              case 'chapter_done': {
                const idx = data.index
                const ch = chapters.value.find(c => c.index === idx)
                if (ch) ch.status = 'done'
                break
              }

              case 'references_start':
                currentActivity.value = 'Menyusun grounding Daftar Pustaka dari OpenAlex...'
                break

              case 'references_done':
                currentActivity.value = 'Menyelesaikan penyusunan karya...'
                break

              case 'done':
                status.value = 'completed'
                currentActivity.value = 'Literatur berhasil disusun sepenuhnya!'
                if (data.documentId) {
                  documentId.value = data.documentId
                }
                break

              case 'error':
                status.value = 'failed'
                errorMessage.value = data.message || 'Terjadi kesalahan pada AI generator.'
                break
            }
          } catch (jsonErr) {
            console.warn('Gagal parse SSE data chunk:', jsonErr)
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
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
