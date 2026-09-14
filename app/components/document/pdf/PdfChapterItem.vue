<script setup lang="ts">
import type { DocumentChapter } from '~/types/documentChapter'
import type { DocumentCategoryConfig } from '~/types/document'

const props = defineProps<{
  chapter: DocumentChapter
  isActive?: boolean
  config?: DocumentCategoryConfig
}>()

defineEmits<{
  (e: 'select', chapter: DocumentChapter): void
}>()
</script>

<template>
  <button
    type="button"
    class="w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group cursor-pointer border"
    :class="[
      isActive
        ? 'bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm'
        : 'bg-[#090b0e] border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-slate-700'
    ]"
    :title="`Buka ${chapter.judul_bab} (Halaman ${chapter.nomor_halaman})`"
    @click="$emit('select', chapter)"
  >
    <div class="flex items-center space-x-2.5 min-w-0 pr-2">
      <!-- Active bullet / indicator -->
      <span
        class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
        :class="isActive ? 'bg-blue-400 ring-4 ring-blue-400/20' : 'bg-slate-600 group-hover:bg-slate-400'"
      />
      
      <!-- Chapter Title -->
      <span class="truncate font-medium leading-relaxed" :class="{ 'font-bold text-white': isActive }">
        {{ chapter.judul_bab }}
      </span>
    </div>

    <!-- Page Number Badge -->
    <span
      class="flex-shrink-0 px-2 py-0.5 rounded-md font-mono text-[10px] border transition-colors"
      :class="[
        isActive
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:text-slate-300 group-hover:border-slate-700'
      ]"
    >
      Hal {{ chapter.nomor_halaman }}
    </span>
  </button>
</template>
