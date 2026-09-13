import { ref, computed } from 'vue'
import type { PdfEditorElement, PdfTool } from '~/types/pdf-editor'

export const usePdfEditor = () => {
  const elements = ref<PdfEditorElement[]>([])
  const selectedElementId = ref<string | null>(null)
  const selectedTool = ref<PdfTool>('select')
  const currentPage = ref(1)
  const totalPages = ref(1)
  const zoom = ref(1.2)
  const isFitWidth = ref(false)

  // History stack untuk Undo / Redo
  const historyStack = ref<PdfEditorElement[][]>([[]])
  const historyIndex = ref(0)
  const maxHistory = 30

  const pushHistory = (newElements: PdfEditorElement[]) => {
    // Potong cabang redo jika ada snapshot baru setelah undo
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }

    // Buat deep copy
    const snapshot = JSON.parse(JSON.stringify(newElements))
    historyStack.value.push(snapshot)

    if (historyStack.value.length > maxHistory) {
      historyStack.value.shift()
    } else {
      historyIndex.value++
    }
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  const undo = () => {
    if (!canUndo.value) return
    historyIndex.value--
    const prevSnapshot = historyStack.value[historyIndex.value]
    elements.value = JSON.parse(JSON.stringify(prevSnapshot))
    // Jika elemen yang terseleksi tidak ada di snapshot, batalkan seleksi
    if (selectedElementId.value && !elements.value.some(e => e.id === selectedElementId.value)) {
      selectedElementId.value = null
    }
  }

  const redo = () => {
    if (!canRedo.value) return
    historyIndex.value++
    const nextSnapshot = historyStack.value[historyIndex.value]
    elements.value = JSON.parse(JSON.stringify(nextSnapshot))
  }

  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null
    return elements.value.find(e => e.id === selectedElementId.value) || null
  })

  // Elemen-elemen yang ada di halaman aktif saat ini
  const currentPageElements = computed(() => {
    return elements.value.filter(e => e.page === currentPage.value)
  })

  const hasUnsavedChanges = computed(() => {
    return elements.value.length > 0
  })

  // Operasi elemen
  const addElement = (element: PdfEditorElement) => {
    elements.value.push(element)
    selectedElementId.value = element.id
    pushHistory(elements.value)
  }

  const updateElement = (id: string, updates: Partial<PdfEditorElement>) => {
    const idx = elements.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      elements.value[idx] = { ...elements.value[idx], ...updates } as PdfEditorElement
      pushHistory(elements.value)
    }
  }

  const deleteElement = (id?: string) => {
    const targetId = id || selectedElementId.value
    if (!targetId) return

    elements.value = elements.value.filter(e => e.id !== targetId)
    if (selectedElementId.value === targetId) {
      selectedElementId.value = null
    }
    pushHistory(elements.value)
  }

  const selectElement = (id: string | null) => {
    selectedElementId.value = id
    if (id) {
      selectedTool.value = 'select'
    }
  }

  const setTool = (tool: PdfTool) => {
    selectedTool.value = tool
    if (tool !== 'select') {
      selectedElementId.value = null
    }
  }

  // Navigasi Halaman
  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      selectedElementId.value = null
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      setPage(currentPage.value - 1)
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      setPage(currentPage.value + 1)
    }
  }

  // Kontrol Zoom
  const zoomIn = () => {
    isFitWidth.value = false
    if (zoom.value < 3.0) {
      zoom.value = Number(Math.min(3.0, zoom.value + 0.2).toFixed(2))
    }
  }

  const zoomOut = () => {
    isFitWidth.value = false
    if (zoom.value > 0.6) {
      zoom.value = Number(Math.max(0.6, zoom.value - 0.2).toFixed(2))
    }
  }

  const toggleFitWidth = () => {
    isFitWidth.value = !isFitWidth.value
  }

  return {
    elements,
    currentPageElements,
    selectedElementId,
    selectedElement,
    selectedTool,
    currentPage,
    totalPages,
    zoom,
    isFitWidth,
    canUndo,
    canRedo,
    hasUnsavedChanges,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    setTool,
    setPage,
    prevPage,
    nextPage,
    zoomIn,
    zoomOut,
    toggleFitWidth,
    undo,
    redo
  }
}
