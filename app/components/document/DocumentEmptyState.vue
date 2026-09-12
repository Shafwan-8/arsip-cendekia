<script setup lang="ts">
import type { DocumentCategoryTheme } from '~/types/document'

defineProps<{
  title?: string
  description?: string
  uploadBtnText?: string
  theme: DocumentCategoryTheme
}>()

defineEmits<{
  (e: 'upload'): void
}>()
</script>

<template>
  <div class="max-w-sm mx-auto space-y-3 text-center py-4">
    <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    <div>
      <p class="text-sm font-semibold text-white">
        {{ title || 'Belum ada dokumen di Supabase' }}
      </p>
      <p class="text-xs text-slate-400 mt-0.5">
        {{ description || 'Belum ada data dokumen. Klik tombol di bawah untuk mengunggah dokumen pertama Anda.' }}
      </p>
    </div>
    <button
      type="button"
      @click="$emit('upload')"
      class="px-4 py-2 rounded-xl font-semibold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5 border"
      :class="[theme.badgeBg, theme.badgeBorder, theme.badgeText, 'hover:opacity-90']"
    >
      <span>+ {{ uploadBtnText || 'Upload Dokumen Baru' }}</span>
    </button>
  </div>
</template>
