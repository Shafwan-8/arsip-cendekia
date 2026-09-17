<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAiSearchStore } from '~/stores/useAiSearchStore'
import { useAiSearch } from '~/composables/useAiSearch'
import AiSearchHeader from './AiSearchHeader.vue'
import AiSearchNarrative from './AiSearchNarrative.vue'
import LiteratureReferenceList from './LiteratureReferenceList.vue'
import AiSearchInput from './AiSearchInput.vue'
import AiSearchError from './AiSearchError.vue'

const route = useRoute()
const store = useAiSearchStore()
const { performSearch, abortSearch } = useAiSearch()

const inputRef = ref<InstanceType<typeof AiSearchInput> | null>(null)
let previousBodyOverflow = ''

const suggestedPrompts = [
  'Carikan penelitian tentang artificial intelligence dalam pendidikan dari tahun 2020 sampai 2024',
  'Apa saja penelitian terbaru mengenai machine learning untuk mendeteksi penyakit?',
  'Saya ingin mengetahui perkembangan sistem rekomendasi perpustakaan digital terkini'
]

// Scroll lock aman dengan menyimpan nilai overflow sebelumnya
const updateBodyScroll = (isOpen: boolean) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
}

watch(
  () => store.isOpen,
  (isOpen) => {
    updateBodyScroll(isOpen)
    if (!isOpen) {
      abortSearch()
    }
  },
  { immediate: true }
)

// Tutup dengan tombol Esc
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.isOpen) {
    store.close()
  }
}

// Batalkan request dan pulihkan body jika user berpindah rute
watch(
  () => route.fullPath,
  () => {
    if (store.isStreaming) {
      abortSearch()
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  updateBodyScroll(false)
  abortSearch()
})

function handleSuggestionClick(prompt: string) {
  if (inputRef.value) {
    inputRef.value.setInput(prompt)
  }
  performSearch(prompt)
}

function handleSearchSubmit(query: string) {
  performSearch(query)
}
</script>

<template>
  <Teleport to="body">
    <!-- Clickable backdrop 30% area kiri (Tanpa backdrop blur sesuai spesifikasi) -->
    <transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="store.isOpen"
        class="fixed inset-0 z-40 bg-black/25"
        @click="store.close"
        aria-hidden="true"
      ></div>
    </transition>

    <!-- Floating Overlay Panel 70vw (Desktop) / Fullwidth (Mobile) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2 lg:translate-y-0 lg:translate-x-4 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 lg:translate-x-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 lg:translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 lg:translate-y-0 lg:translate-x-4 scale-[0.99]"
    >
      <section
        v-if="store.isOpen"
        class="fixed top-20 right-3 sm:right-6 lg:right-8 bottom-5 z-50 h-[calc(100dvh-6.5rem)] w-[calc(100vw-1.5rem)] sm:w-[600px] md:w-[740px] lg:w-[calc(100vw-18.5rem-2rem)] max-w-7xl bg-[#12151c] border border-slate-800/90 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-label="Panel AI Literature Search"
      >
        <!-- Header -->
        <AiSearchHeader />

        <!-- Error Alert jika ada -->
        <AiSearchError
          v-if="store.error"
          :error="store.error"
          @dismiss="store.setError(null)"
        />

        <!-- Main Content Area: Two-pane di desktop, stack di mobile -->
        <div class="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <!-- Left Pane (60-65%): Narasi Jawaban Riset -->
          <div class="flex-1 min-h-0 flex flex-col lg:w-3/5 border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-hidden">
            <!-- Empty State / Rekomendasi Prompt -->
            <div
              v-if="!store.currentResponse && !store.isStreaming && store.chatHistory.length === 0"
              class="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col justify-center max-w-lg mx-auto text-center space-y-5 chat-scrollbar"
            >
              <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-400 mx-auto shadow-lg shadow-rose-950/20">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>

              <div class="space-y-1.5">
                <h3 class="text-base font-bold text-white tracking-tight">
                  AI Literature Search & Synthesis
                </h3>
                <p class="text-xs text-slate-400 leading-relaxed">
                  Ajukan pertanyaan riset Anda. AI akan mencari hingga 5 literatur dari OpenAlex, merekonstruksi abstrak, dan mensintesis jawaban berbasis sitasi secara langsung.
                </p>
              </div>

              <!-- Pill Rekomendasi -->
              <div class="space-y-2 text-left pt-2">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Contoh Pertanyaan
                </p>
                <div class="space-y-1.5">
                  <button
                    v-for="(p, idx) in suggestedPrompts"
                    :key="idx"
                    type="button"
                    @click="handleSuggestionClick(p)"
                    class="w-full text-xs text-slate-300 hover:text-white bg-[#161a23] hover:bg-slate-800/90 border border-slate-800 hover:border-rose-500/40 rounded-xl px-3.5 py-2.5 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <span class="line-clamp-1">{{ p }}</span>
                    <svg class="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 shrink-0 ml-2 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Narasi Aktif -->
            <AiSearchNarrative
              v-else
              :content="store.currentResponse"
              :is-streaming="store.isStreaming"
            />
          </div>

          <!-- Right Pane (35-40%): Daftar Kartu Literatur Rujukan -->
          <div class="h-64 lg:h-auto lg:w-2/5 p-3 sm:p-4 bg-[#0d1016]/50 flex flex-col overflow-hidden">
            <LiteratureReferenceList :references="store.currentReferences" />
          </div>
        </div>

        <!-- Input Bar di Bagian Bawah -->
        <AiSearchInput
          ref="inputRef"
          @submit="handleSearchSubmit"
        />
      </section>
    </transition>
  </Teleport>
</template>

<style scoped>
:deep(.chat-scrollbar)::-webkit-scrollbar,
.chat-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-track,
.chat-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-thumb,
.chat-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.45);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-thumb:hover,
.chat-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(244, 63, 94, 0.65);
}

:deep(.chat-scrollbar),
.chat-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(71, 85, 105, 0.45) transparent;
}
</style>
