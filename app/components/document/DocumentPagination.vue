<script setup lang="ts">
import type { DocumentCategoryTheme } from '~/types/document'

defineProps<{
  currentPage: number
  totalPages: number
  startItemIndex: number
  endItemIndex: number
  totalItems: number
  itemLabel?: string
  theme: DocumentCategoryTheme
}>()

defineEmits<{
  (e: 'pageChange', page: number): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800/90 text-xs text-slate-400 bg-[#0c0e12]">
    <div>
      Menampilkan <span class="text-white font-medium">{{ startItemIndex }} - {{ endItemIndex }}</span> dari <span class="text-white font-medium">{{ totalItems }}</span> {{ itemLabel || 'dokumen' }}
    </div>

    <div class="flex items-center space-x-2">
      <button
        type="button"
        :disabled="currentPage === 1"
        @click="$emit('pageChange', currentPage - 1)"
        class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span>Sebelumnya</span>
      </button>

      <div class="flex items-center space-x-1">
        <button
          v-for="page in totalPages"
          :key="page"
          type="button"
          @click="$emit('pageChange', page)"
          :class="[
            'w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
            currentPage === page
              ? theme.activePage
              : 'bg-[#090b0e] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          ]"
        >
          {{ page }}
        </button>
      </div>

      <button
        type="button"
        :disabled="currentPage === totalPages || totalPages === 0"
        @click="$emit('pageChange', currentPage + 1)"
        class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
      >
        <span>Berikutnya</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>
