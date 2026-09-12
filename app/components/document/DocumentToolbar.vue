<script setup lang="ts">
import type { DocumentSortOption, DocumentCategoryTheme } from '~/types/document'

const props = defineProps<{
  searchQuery: string
  sortBy: DocumentSortOption
  isLoading: boolean
  placeholder?: string
  theme: DocumentCategoryTheme
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:sortBy', value: DocumentSortOption): void
  (e: 'refresh'): void
  (e: 'change'): void
}>()

const handleInput = (event: Event) => {
  const val = (event.target as HTMLInputElement).value
  emit('update:searchQuery', val)
  emit('change')
}

const handleSortChange = (event: Event) => {
  const val = (event.target as HTMLSelectElement).value as DocumentSortOption
  emit('update:sortBy', val)
  emit('change')
}
</script>

<template>
  <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
      <!-- Input Pencarian -->
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          :value="props.searchQuery"
          type="text"
          :placeholder="props.placeholder || 'Cari judul, penulis, penerbit, atau nama file...'"
          @input="handleInput"
          class="w-full pl-10 pr-4 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          :class="theme.focusBorder"
        />
      </div>

      <!-- Sorting Dropdown & Refresh -->
      <div class="flex items-center space-x-2.5">
        <div class="relative">
          <select
            :value="props.sortBy"
            @change="handleSortChange"
            class="appearance-none pl-3.5 pr-8 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 focus:outline-none transition-colors cursor-pointer"
            :class="theme.focusBorder"
          >
            <option value="latest">Terbaru Diupload</option>
            <option value="oldest">Terlama Diupload</option>
            <option value="title">Judul (A - Z)</option>
            <option value="size">Ukuran Terbesar</option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <button
          type="button"
          @click="$emit('refresh')"
          :disabled="props.isLoading"
          class="p-2.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Muat Ulang Data"
        >
          <svg
            class="w-4 h-4"
            :class="[props.isLoading ? `animate-spin ${theme.primaryText}` : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
