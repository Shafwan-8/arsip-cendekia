<script setup lang="ts">
import type { DocumentCategoryTheme } from '~/types/document'

defineProps<{
  title: string
  count: number
  description: string
  uploadBtnText: string
  theme: DocumentCategoryTheme
}>()

defineEmits<{
  (e: 'upload'): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center space-x-2">
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {{ title }}
        </h2>
        <span
          class="px-2.5 py-0.5 rounded-full border text-xs font-semibold"
          :class="[theme.badgeBg, theme.badgeBorder, theme.badgeText]"
        >
          {{ count }} Dokumen
        </span>
      </div>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        {{ description }}
      </p>
    </div>

    <div>
      <button
        type="button"
        @click="$emit('upload')"
        class="px-5 py-2.5 rounded-xl active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 flex-shrink-0 cursor-pointer"
        :class="theme.primaryBtn"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>{{ uploadBtnText }}</span>
      </button>
    </div>
  </div>
</template>
