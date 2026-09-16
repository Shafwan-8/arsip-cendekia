<script setup lang="ts">
import { ref } from 'vue'
import { useChatSearchStore } from '~/stores/chatSearch'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'submit', query: string): void
  (e: 'update:modelValue', val: string): void
}>()

const chatStore = useChatSearchStore()
const inputText = ref('')

// Expose fungsi untuk mengisi input dari parent jika user klik suggestion
function setInput(val: string) {
  inputText.value = val
}

defineExpose({
  setInput
})

const handleSubmit = () => {
  const query = inputText.value.trim()
  if (!query || chatStore.isLoading) return
  emit('submit', query)
  inputText.value = ''
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="shrink-0 border-t border-slate-800/80 bg-[#0d1016]/90 p-3 sm:p-4">
    <form @submit.prevent="handleSubmit" class="relative flex items-center gap-2">
      <!-- Input Box -->
      <div class="relative flex-1">
        <textarea
          v-model="inputText"
          rows="1"
          maxlength="1000"
          :disabled="chatStore.isLoading"
          placeholder="Cari literatur, artikel ilmiah, topik penelitian... (Tekan Enter untuk mencari)"
          class="w-full bg-[#161a22] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed max-h-32"
          @keydown="handleKeydown"
          aria-label="Pertanyaan pencarian literatur"
        ></textarea>
      </div>

      <!-- Send Button -->
      <button
        type="submit"
        :disabled="!inputText.trim() || chatStore.isLoading"
        class="h-11 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-rose-950/30 transition-all shrink-0 cursor-pointer"
        aria-label="Kirim Pencarian"
      >
        <span class="hidden sm:inline">Kirim</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </form>
    
    <!-- Micro footer notice -->
    <div class="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
      <span>AI menganalisis judul & abstrak metadata OpenAlex</span>
      <span v-if="inputText.length > 500" :class="inputText.length > 900 ? 'text-rose-400' : 'text-slate-500'">
        {{ inputText.length }}/1000
      </span>
    </div>
  </div>
</template>
