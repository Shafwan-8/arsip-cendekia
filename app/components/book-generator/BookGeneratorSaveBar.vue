<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  hasUnsavedChanges: boolean
  isSaving: boolean
  isRenderingPdf: boolean
  category?: 'buku' | 'jurnal' | 'skripsi'
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'viewPdf'): void
  (e: 'downloadPdf'): void
  (e: 'newGeneration'): void
}>()

const categoryLabel = computed(() => {
  if (props.category === 'jurnal') return 'Jurnal'
  if (props.category === 'skripsi') return 'Skripsi'
  return 'Buku'
})

const archivePath = computed(() => {
  return `/${props.category || 'buku'}`
})
</script>

<template>
  <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
    <!-- Status Tersimpan & Tautan Arsip -->
    <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
      <div class="flex items-center gap-2">
        <span
          :class="[
            'w-2.5 h-2.5 rounded-full',
            hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          ]"
        ></span>
        <span class="text-xs font-semibold text-slate-300">
          {{ hasUnsavedChanges ? 'Ada perubahan belum disimpan' : 'Semua perubahan tersimpan' }}
        </span>
      </div>

      <div class="flex items-center gap-3 text-xs">
        <NuxtLink
          :to="archivePath"
          class="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Ke Arsip {{ categoryLabel }}</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </NuxtLink>

        <span class="text-slate-700">•</span>

        <button
          type="button"
          @click="emit('newGeneration')"
          class="text-slate-400 hover:text-white underline cursor-pointer"
        >
          Buat Baru
        </button>
      </div>
    </div>

    <!-- Tombol Aksi -->
    <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
      <!-- Tombol Simpan -->
      <button
        type="button"
        :disabled="isSaving || !hasUnsavedChanges"
        @click="emit('save')"
        class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
      >
        <svg v-if="isSaving" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        <span>{{ isSaving ? 'Menyimpan...' : 'Simpan' }}</span>
      </button>

      <!-- Tombol Lihat PDF -->
      <button
        type="button"
        :disabled="isRenderingPdf"
        @click="emit('viewPdf')"
        class="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <svg v-if="isRenderingPdf" class="animate-spin w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>{{ isRenderingPdf ? 'Memproses PDF...' : 'Lihat PDF' }}</span>
      </button>

      <!-- Tombol Unduh PDF -->
      <button
        type="button"
        :disabled="isRenderingPdf"
        @click="emit('downloadPdf')"
        class="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Unduh PDF</span>
      </button>
    </div>
  </div>
</template>
