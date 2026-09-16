<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useChatSearchStore } from '~/stores/chatSearch'
import ChatMessage from './ChatMessage.vue'

const emit = defineEmits<{
  (e: 'select-suggestion', prompt: string): void
}>()

const chatStore = useChatSearchStore()
const containerRef = ref<HTMLDivElement | null>(null)

const suggestedPrompts = [
  'Carikan penelitian tentang artificial intelligence dalam pendidikan dari tahun 2020 sampai 2024',
  'Saya ingin mencari jurnal tentang machine learning untuk bidang kesehatan',
  'Riset deep learning untuk klasifikasi citra medis',
  'Jurnal sistem rekomendasi perpustakaan digital terkini'
]

const scrollToBottom = async () => {
  await nextTick()
  if (containerRef.value) {
    containerRef.value.scrollTo({
      top: containerRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

watch(
  () => [chatStore.chatHistory.length, chatStore.isLoading],
  () => {
    scrollToBottom()
  }
)
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 chat-scrollbar"
  >
    <!-- Welcome Screen / Empty State -->
    <div
      v-if="chatStore.chatHistory.length === 0 && !chatStore.isLoading"
      class="max-w-xl mx-auto text-center py-10 sm:py-14 space-y-6"
    >
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 shadow-xl shadow-rose-950/20">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-bold text-white tracking-tight">
          Pencarian Literatur Akademik Cerdas
        </h3>
        <p class="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          Ketik topik atau pertanyaan riset Anda dalam bahasa natural. AI akan mengekstrak parameter pencarian, mengambil 5 literatur dari OpenAlex, serta memberikan ringkasan dan insight relevansi.
        </p>
      </div>

      <!-- Suggestion Pills -->
      <div class="space-y-2.5 pt-2">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Contoh Pencarian
        </p>
        <div class="flex flex-col gap-2 text-left">
          <button
            v-for="(prompt, idx) in suggestedPrompts"
            :key="idx"
            type="button"
            @click="emit('select-suggestion', prompt)"
            class="text-xs text-slate-300 hover:text-white bg-[#151921] hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 rounded-xl px-3.5 py-2.5 transition-all text-left flex items-center justify-between group"
          >
            <span class="line-clamp-1">{{ prompt }}</span>
            <svg class="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 shrink-0 ml-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Message History -->
    <template v-else>
      <ChatMessage
        v-for="msg in chatStore.chatHistory"
        :key="msg.id"
        :message="msg"
      />
    </template>

    <!-- AI Loading State -->
    <div
      v-if="chatStore.isLoading"
      class="flex justify-start w-full max-w-md"
    >
      <div class="bg-[#11141b] border border-slate-800/90 rounded-2xl rounded-tl-sm p-4 shadow-xl flex items-center gap-3">
        <!-- Animated Pulse Icon -->
        <div class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>

        <div class="space-y-0.5">
          <p class="text-xs font-semibold text-slate-200">
            Sedang mencari literatur...
          </p>
          <p class="text-[11px] text-slate-500">
            AI sedang menganalisis abstrak & mengidentifikasi relevansi
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.chat-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.chat-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.45);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

.chat-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(244, 63, 94, 0.65);
}

.chat-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(71, 85, 105, 0.45) transparent;
}
</style>
