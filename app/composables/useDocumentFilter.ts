import { ref, computed, type Ref } from 'vue'
import type { DocumentItem, DocumentSortOption } from '~/types/document'

export const useDocumentFilter = (documents: Ref<DocumentItem[]>) => {
  const searchQuery = ref('')
  const sortBy = ref<DocumentSortOption>('latest')

  const filteredDocuments = computed(() => {
    return documents.value
      .filter((doc) => {
        const q = searchQuery.value.toLowerCase().trim()
        if (!q) return true

        return (
          (doc.title || '').toLowerCase().includes(q) ||
          (doc.author || '').toLowerCase().includes(q) ||
          (doc.publisher || '').toLowerCase().includes(q) ||
          (doc.file_name || '').toLowerCase().includes(q) ||
          (doc.source || '').toLowerCase().includes(q) ||
          (doc.source === 'ai_generated' && ('ai generate'.includes(q) || 'ai'.includes(q)))
        )
      })
      .sort((a, b) => {
        if (sortBy.value === 'title') {
          return (a.title || '').localeCompare(b.title || '')
        }
        if (sortBy.value === 'size') {
          return parseFloat(b.file_size || '0') - parseFloat(a.file_size || '0')
        }
        if (sortBy.value === 'oldest') {
          return String(a.id).localeCompare(String(b.id))
        }
        // Default: latest (berdasarkan id descending)
        return String(b.id).localeCompare(String(a.id))
      })
  })

  const resetFilter = () => {
    searchQuery.value = ''
    sortBy.value = 'latest'
  }

  return {
    searchQuery,
    sortBy,
    filteredDocuments,
    resetFilter
  }
}
