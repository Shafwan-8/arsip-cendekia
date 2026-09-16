import { useChatSearchStore } from '~/stores/chatSearch'
import type { SearchChatResponse } from '~/types/literature'

export function useChatSearch() {
  const store = useChatSearchStore()

  async function searchLiterature(rawQuery: string): Promise<boolean> {
    const query = rawQuery.trim()
    if (!query || store.isLoading) {
      return false
    }

    // 1. Reset error sebelumnya & catat pesan user di store
    store.setError(null)
    store.addUserMessage(query)
    store.setLoading(true)

    try {
      const response = await $fetch<SearchChatResponse>('/api/search-chat', {
        method: 'POST',
        body: { message: query }
      })

      if (!response.success) {
        const errorMsg = response.message || 'Terjadi kendala saat mencari literatur.'
        store.setError(errorMsg)
        store.addAssistantMessage(errorMsg)
        return false
      }

      const results = response.results || []
      if (results.length === 0) {
        store.addAssistantMessage('Tidak ditemukan literatur yang sesuai dengan kriteria pencarian Anda. Coba gunakan kata kunci yang lebih umum atau periksa rentang tahun.')
      } else {
        const pluralText = results.length === 1 ? '1 literatur' : `${results.length} literatur`
        store.addAssistantMessage(`Saya menemukan ${pluralText} yang relevan dengan topik Anda:`, results)
      }

      return true
    } catch (err: any) {
      console.error('Error useChatSearch:', err)
      let message = 'Gagal menghubungi server AI. Silakan periksa koneksi internet Anda.'

      if (err?.data?.statusMessage) {
        message = err.data.statusMessage
      } else if (err?.data?.message) {
        message = err.data.message
      } else if (err?.message) {
        message = err.message
      }

      store.setError(message)
      store.addAssistantMessage(message)
      return false
    } finally {
      store.setLoading(false)
    }
  }

  return {
    store,
    searchLiterature
  }
}
