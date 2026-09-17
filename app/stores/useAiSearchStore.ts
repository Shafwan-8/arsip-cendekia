import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { LiteratureReference, ChatMessage, AiSearchError, LiteratureAnalysis } from '~/types/aiSearch'

export const useAiSearchStore = defineStore('aiSearch', () => {
  const isOpen = ref(false)
  const isStreaming = ref(false)
  const chatHistory = ref<ChatMessage[]>([])
  const currentReferences = ref<LiteratureReference[]>([])
  const activeCitation = ref<number | null>(null)
  const currentResponse = ref('')
  const error = ref<AiSearchError | null>(null)

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    activeCitation.value = null
  }

  function toggle() {
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }

  function startSearch(query: string) {
    isStreaming.value = true
    error.value = null
    currentResponse.value = ''
    currentReferences.value = []
    activeCitation.value = null

    // Tambahkan pesan user ke histori
    chatHistory.value.push({
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: query,
      createdAt: Date.now()
    })
  }

  function appendToken(text: string) {
    currentResponse.value += text
  }

  function setReferences(references: LiteratureReference[]) {
    currentReferences.value = references
  }

  function updateAnalysis(analyses: LiteratureAnalysis[]) {
    const analysisMap = new Map(analyses.map(a => [a.index, a]))
    currentReferences.value = currentReferences.value.map(ref => {
      const match = analysisMap.get(ref.index)
      if (match) {
        return {
          ...ref,
          aiSummary: match.summary,
          aiInsight: match.insight
        }
      }
      return ref
    })
  }

  function setActiveCitation(citation: number | null) {
    activeCitation.value = citation
  }

  function finishSearch() {
    isStreaming.value = false

    // Simpan pesan asisten ke histori
    if (currentResponse.value.trim() || currentReferences.value.length > 0) {
      chatHistory.value.push({
        id: `asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: currentResponse.value,
        references: [...currentReferences.value],
        createdAt: Date.now()
      })
    }
    currentResponse.value = ''
  }

  function setError(err: AiSearchError | null) {
    error.value = err
    isStreaming.value = false
    // Jika ada respon parsial sebelum error, simpan juga ke history
    if (currentResponse.value.trim()) {
      chatHistory.value.push({
        id: `asst-err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'assistant',
        content: currentResponse.value,
        references: [...currentReferences.value],
        createdAt: Date.now()
      })
      currentResponse.value = ''
    }
  }

  function setActiveReferences(refs: LiteratureReference[]) {
    if (refs && refs.length > 0) {
      currentReferences.value = refs
    }
  }

  function clearCurrentSearch() {
    currentResponse.value = ''
    currentReferences.value = []
    activeCitation.value = null
    error.value = null
  }

  function clearHistory() {
    chatHistory.value = []
    clearCurrentSearch()
  }

  return {
    isOpen,
    isStreaming,
    chatHistory,
    currentReferences,
    activeCitation,
    currentResponse,
    error,
    open,
    close,
    toggle,
    startSearch,
    appendToken,
    setReferences,
    updateAnalysis,
    setActiveCitation,
    finishSearch,
    setError,
    setActiveReferences,
    clearCurrentSearch,
    clearHistory
  }
})
