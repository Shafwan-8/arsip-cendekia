<script setup lang="ts">
import type { DocumentContentBlock } from '~/types/documentContentBlock'

const props = defineProps<{
  blocks: DocumentContentBlock[]
  activeBlockId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', blockId: string): void
}>()

const getSectionBadge = (type: string) => {
  switch (type) {
    case 'daftar_isi':
      return { label: 'Outline', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    case 'bab':
      return { label: 'Bab', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'kesimpulan':
      return { label: 'Penutup', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    case 'daftar_pustaka':
      return { label: 'Pustaka', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    default:
      return { label: 'Bagian', color: 'bg-slate-800 text-slate-400 border-slate-700' }
  }
}
</script>

<template>
  <aside class="w-full lg:w-72 bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 flex flex-col space-y-3 flex-shrink-0 shadow-lg">
    <!-- Header Sidebar -->
    <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-200">
          Struktur Konten
        </span>
      </div>
      <span class="text-[11px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
        {{ blocks.length }} Bagian
      </span>
    </div>

    <!-- Section Navigation List -->
    <div class="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
      <button
        v-for="block in blocks"
        :key="block.id"
        type="button"
        @click="emit('select', block.id)"
        :class="[
          'w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer',
          activeBlockId === block.id
            ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-sm ring-1 ring-rose-500/30'
            : 'bg-[#090b0e] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900/50'
        ]"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <span
            :class="[
              'text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0',
              getSectionBadge(block.section_type).color
            ]"
          >
            {{ getSectionBadge(block.section_type).label }}
          </span>

          <span class="truncate font-medium" :title="block.title">
            {{ block.title }}
          </span>
        </div>

        <svg
          v-if="activeBlockId === block.id"
          class="w-3.5 h-3.5 text-rose-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </aside>
</template>
