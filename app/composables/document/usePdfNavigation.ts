import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { DocumentChapter } from '~/types/documentChapter'

export const usePdfNavigation = (chaptersRef?: Ref<DocumentChapter[]> | ComputedRef<DocumentChapter[]>) => {
  const currentPage = ref(1)
  const totalPages = ref(0)
  const scale = ref(1.2)
  const isFitWidth = ref(false)

  // Menentukan BAB aktif berdasarkan nomor halaman saat ini (Section 28)
  const currentChapter = computed<DocumentChapter | null>(() => {
    const list = chaptersRef ? chaptersRef.value : []
    if (!list || list.length === 0) return null

    const page = currentPage.value

    for (let i = 0; i < list.length; i++) {
      const current = list[i]
      const next = list[i + 1]

      if (page >= current.nomor_halaman) {
        if (!next || page < next.nomor_halaman) {
          return current
        }
      }
    }

    return null
  })

  const goToPage = (pageNumber: number) => {
    const target = Math.max(1, Math.min(totalPages.value || 9999, pageNumber))
    currentPage.value = target
  }

  const nextPage = () => {
    if (totalPages.value === 0 || currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const goToChapter = (chapter: DocumentChapter) => {
    if (chapter && chapter.nomor_halaman) {
      goToPage(chapter.nomor_halaman)
    }
  }

  return {
    currentPage,
    totalPages,
    scale,
    isFitWidth,
    currentChapter,
    goToPage,
    nextPage,
    prevPage,
    goToChapter
  }
}
