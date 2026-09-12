<script setup lang="ts">
import type { DocumentItem, DocumentCategoryConfig } from '~/types/document'

defineProps<{
  isOpen: boolean
  isDeleting: boolean
  document: DocumentItem | null
  config: DocumentCategoryConfig
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
  >
    <div class="w-full max-w-md bg-[#0e1117] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
      <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>

      <div class="text-center space-y-1">
        <h3 class="text-base font-bold text-white">{{ config.deleteModalTitle }}</h3>
        <p class="text-xs text-slate-400">
          Apakah Anda yakin ingin menghapus {{ config.label.toLowerCase() }} <strong class="text-white">"{{ document?.title }}"</strong> dari database? Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>

      <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
        <div class="flex justify-between">
          <span>Penulis:</span>
          <span class="text-slate-300 font-medium">{{ document?.author }}</span>
        </div>
        <div class="flex justify-between">
          <span>Berkas:</span>
          <span class="font-mono text-rose-400">{{ document?.file_name }}</span>
        </div>
      </div>

      <div class="flex items-center space-x-3 pt-2">
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="isDeleting"
          @click="$emit('confirm')"
          class="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm shadow-rose-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <svg v-if="isDeleting" class="animate-spin -ml-0.5 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>{{ isDeleting ? 'Menghapus...' : `Ya, Hapus ${config.label}` }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
