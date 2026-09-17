import { ref, onBeforeUnmount } from 'vue'
import { useAiSearchStore } from '~/stores/useAiSearchStore'
import type { LiteratureReference, LiteratureAnalysis, AiSearchError } from '~/types/aiSearch'

export function useAiSearch() {
  const store = useAiSearchStore()
  let abortController: AbortController | null = null

  function abortSearch() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    if (store.isStreaming) {
      store.finishSearch()
    }
  }

  async function performSearch(rawQuery: string): Promise<void> {
    const query = rawQuery.trim()
    if (!query || store.isStreaming) return

    // Batalkan search yang sedang berjalan jika ada
    abortSearch()

    store.startSearch(query)
    abortController = new AbortController()

    try {
      const response = await fetch('/api/ai-search-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query }),
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData?.statusMessage || errorData?.message || 'Gagal memulai pencarian.'
        store.setError({
          code: `HTTP_${response.status}`,
          message
        })
        return
      }

      if (!response.body) {
        throw new Error('Response body tidak tersedia untuk streaming.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        // Simpan sisa chunk yang belum lengkap di buffer
        buffer = lines.pop() || ''

        let currentEvent = ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) {
            currentEvent = ''
            continue
          }

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.slice(6).trim()
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim()
            try {
              const data = JSON.parse(dataStr)

              if (currentEvent === 'references' && data.references) {
                store.setReferences(data.references as LiteratureReference[])
              } else if (currentEvent === 'token' && typeof data.text === 'string') {
                store.appendToken(data.text)
              } else if (currentEvent === 'analysis' && data.analyses) {
                store.updateAnalysis(data.analyses as LiteratureAnalysis[])
              } else if (currentEvent === 'error') {
                store.setError({
                  code: data.code || 'STREAM_ERROR',
                  message: data.message || 'Terjadi kesalahan saat memproses jawaban.'
                })
              } else if (currentEvent === 'done') {
                store.finishSearch()
              }
            } catch (parseErr) {
              console.warn('Gagal parsing SSE data payload:', dataStr, parseErr)
            }
          }
        }
      }

      // Pastikan status streaming selesai setelah stream ditutup jika belum di-finish
      if (store.isStreaming) {
        store.finishSearch()
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return
      }
      console.error('Error pada streaming pencarian AI:', err)
      store.setError({
        code: 'NETWORK_ERROR',
        message: 'Koneksi ke server AI terputus. Silakan periksa jaringan Anda.'
      })
    } finally {
      abortController = null
    }
  }

  onBeforeUnmount(() => {
    abortSearch()
  })

  return {
    store,
    performSearch,
    abortSearch
  }
}
