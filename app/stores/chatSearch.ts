import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ChatMessage } from '~/types/chat'
import type { LiteratureResult } from '~/types/literature'

export const useChatSearchStore = defineStore('chatSearch', () => {
  const isOpen = ref(false)
  const chatHistory = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function clearHistory() {
    chatHistory.value = []
    error.value = null
  }

  function addUserMessage(content: string): string {
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    chatHistory.value.push({
      id,
      role: 'user',
      content,
      createdAt: Date.now()
    })
    return id
  }

  function addAssistantMessage(content?: string, results?: LiteratureResult[]): string {
    const id = `assistant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    chatHistory.value.push({
      id,
      role: 'assistant',
      content,
      results,
      createdAt: Date.now()
    })
    return id
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  return {
    isOpen,
    chatHistory,
    isLoading,
    error,
    toggle,
    open,
    close,
    clearHistory,
    addUserMessage,
    addAssistantMessage,
    setLoading,
    setError
  }
})
