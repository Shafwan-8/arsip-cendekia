import { ref, computed, type Ref } from 'vue'
import type { DocumentItem } from '~/types/document'

export const useDocumentPagination = (items: Ref<DocumentItem[]>, defaultPerPage: number = 5) => {
  const currentPage = ref(1)
  const itemsPerPage = ref(defaultPerPage)

  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(items.value.length / itemsPerPage.value))
  })

  const paginatedDocuments = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    return items.value.slice(start, start + itemsPerPage.value)
  })

  const startItemIndex = computed(() => {
    if (items.value.length === 0) return 0
    return (currentPage.value - 1) * itemsPerPage.value + 1
  })

  const endItemIndex = computed(() => {
    return Math.min(currentPage.value * itemsPerPage.value, items.value.length)
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedDocuments,
    startItemIndex,
    endItemIndex,
    goToPage,
    resetPage
  }
}
