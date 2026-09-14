<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentChapter, ExtractionStatus } from '~/types/documentChapter'
import type { DocumentCategoryConfig } from '~/types/document'
import PdfChapterItem from './PdfChapterItem.vue'

const props = withDefaults(
  defineProps<{
    chapters: DocumentChapter[]
    activeChapter?: DocumentChapter | null
    currentPage?: number
    isLoading?: boolean
    isExtracting?: boolean
    extractionStatus?: ExtractionStatus
    errorMessage?: string
    isOpen: boolean
    config?: DocumentCategoryConfig
  }>(),
  {
    chapters: () => [],
    activeChapter: null,
    currentPage: 1,
    isLoading: false,
    isExtracting: false,
    extractionStatus: 'pending',
    errorMessage: '',
    isOpen: true
  }
)

const emit = defineEmits<{
  (e: 'selectChapter', chapter: DocumentChapter): void
  (e: 'close'): void
  (e: 'retry'): void
}>()

// Helper mengecek apakah suatu chapter aktif
const isChapterActive = (chapter: DocumentChapter): boolean => {
  if (props.activeChapter?.id && props.activeChapter.id === chapter.id) {
    return true
  }

  // Fallback berdasarkan halaman aktif
  if (props.currentPage && props.chapters.length > 0) {
    const list = props.chapters
    const idx = list.findIndex(c => c.id === chapter.id)
    if (idx !== -1) {
      const current = list[idx]
      const next = list[idx + 1]
      return props.currentPage >= current.nomor_halaman && (!next || props.currentPage < next.nomor_halaman)
    }
  }

  return false
}
</script>

<template>
  <aside
    v-show="isOpen"
    class="w-72 sm:w-80 flex-shrink-0 bg-[#0e121a] border-r border-slate-800 flex flex-col transition-all duration-200 z-20 select-none max-h-[calc(100vh-14rem)] sm:max-h-[78vh]"
  >
    <!-- Header Sidebar -->
    <div class="p-3.5 border-b border-slate-800/90 flex items-center justify-between bg-[#0b0e14]">
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <h3 class="text-xs font-bold text-white tracking-wide uppercase">Daftar BAB</h3>
        <span
          v-if="chapters.length > 0"
          class="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 font-semibold"
        >
          {{ chapters.length }}
        </span>
      </div>

      <div class="flex items-center space-x-1">
        <!-- Tombol Ekstrak Ulang jika selesai -->
        <button
          v-if="!isExtracting && !isLoading"
          type="button"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Analisis Ulang Struktur PDF"
          @click="$emit('retry')"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- Tombol Tutup Sidebar -->
        <button
          type="button"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Sembunyikan Sidebar BAB"
          @click="$emit('close')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Konten List BAB / Status State -->
    <div class="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
      <!-- 1. State Loading / Menganalisis Struktur Dokumen -->
      <div
        v-if="isExtracting || (isLoading && chapters.length === 0)"
        class="py-10 px-3 flex flex-col items-center justify-center text-center space-y-3"
      >
        <div class="relative w-9 h-9">
          <div class="w-9 h-9 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" />
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold text-white">Menganalisis struktur dokumen...</p>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            AI sedang mendeteksi heading dan halaman BAB.
          </p>
          <p class="text-[11px] text-slate-400 leading-snug">
            Ini mungkin memakan waktu beberapa saat tergantung ukuran dokumen.
          </p>
        </div>
      </div>

      <!-- 2. State Error saat Ekstraksi -->
      <div
        v-else-if="extractionStatus === 'failed' || errorMessage"
        class="py-8 px-3 text-center space-y-3 bg-rose-950/20 border border-rose-900/30 rounded-xl my-2"
      >
        <div class="w-8 h-8 mx-auto rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-bold text-rose-300">Daftar BAB belum dapat dibuat</p>
          <p class="text-[11px] text-slate-400 leading-snug line-clamp-3">
            {{ errorMessage || 'Terjadi gangguan saat memproses struktur dokumen.' }}
          </p>
        </div>
        <button
          type="button"
          class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
          @click="$emit('retry')"
        >
          Coba Lagi
        </button>
      </div>

      <!-- 3. State Empty: Dokumen tidak memiliki heading BAB -->
      <div
        v-else-if="chapters.length === 0"
        class="py-10 px-3 text-center space-y-2.5"
      >
        <div class="w-8 h-8 mx-auto rounded-lg bg-slate-800/80 text-slate-400 flex items-center justify-center">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-xs font-medium text-slate-300">Tidak ada struktur BAB</p>
        <p class="text-[11px] text-slate-500 leading-relaxed">
          Tidak ditemukan heading BAB atau struktur daftar isi yang dapat dikenali pada dokumen ini.
        </p>
        <button
          type="button"
          class="mt-2 text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
          @click="$emit('retry')"
        >
          Coba Ekstrak Ulang
        </button>
      </div>

      <!-- 4. Daftar BAB (Chapter Items) -->
      <template v-else>
        <PdfChapterItem
          v-for="chapter in chapters"
          :key="chapter.id"
          :chapter="chapter"
          :is-active="isChapterActive(chapter)"
          :config="config"
          @select="$emit('selectChapter', chapter)"
        />
      </template>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style>
