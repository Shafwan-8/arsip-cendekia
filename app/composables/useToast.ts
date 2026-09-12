import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export const useToast = () => {
  const toastMessage = ref('')
  const toastType = ref<ToastType>('success')
  const showToast = ref(false)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  const triggerToast = (msg: string, type: ToastType = 'success', duration: number = 3500) => {
    if (toastTimer) clearTimeout(toastTimer)
    toastMessage.value = msg
    toastType.value = type
    showToast.value = true
    toastTimer = setTimeout(() => {
      showToast.value = false
    }, duration)
  }

  const hideToast = () => {
    if (toastTimer) clearTimeout(toastTimer)
    showToast.value = false
  }

  return {
    toastMessage,
    toastType,
    showToast,
    triggerToast,
    hideToast
  }
}
