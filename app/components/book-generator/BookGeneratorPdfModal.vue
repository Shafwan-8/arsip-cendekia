<script setup lang="ts">
import DocumentPdfViewer from '~/components/document/DocumentPdfViewer.vue'

defineProps<{
  isOpen: boolean
  pdfUrl: string | null
  title: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
    <div class="relative w-full max-w-6xl h-[92vh] bg-[#0e1117] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="h-14 px-5 border-b border-slate-800 flex items-center justify-between bg-[#0d0f14] flex-shrink-0">
        <div class="flex items-center gap-3 min-w-0 pr-4">
          <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="min-w-0">
            <h3 class="text-xs sm:text-sm font-bold text-white truncate" :title="title">
              {{ title }}
            </h3>
            <p class="text-[10px] text-slate-400">Pratinjau Hasil Render PDF On-Demand</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a
            v-if="pdfUrl"
            :href="pdfUrl"
            target="_blank"
            download
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span class="hidden sm:inline">Buka Tab Baru</span>
          </a>

          <button
            type="button"
            @click="emit('close')"
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Pratinjau"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Body (PDF Viewer) -->
      <div class="flex-1 overflow-hidden relative bg-[#090b0e]">
        <ClientOnly>
          <DocumentPdfViewer
            v-if="pdfUrl"
            :file-url="pdfUrl"
            :file-name="`${title}.pdf`"
          />
          <div v-else class="h-full flex items-center justify-center text-slate-400 text-xs">
            Memuat pratinjau PDF...
          </div>
          <template #fallback>
            <div class="h-full flex items-center justify-center text-slate-400 text-xs">
              Memuat komponen PDF viewer...
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>
