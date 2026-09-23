<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DocumentContentBlock, DocumentSubsection } from '~/types/documentContentBlock'

const props = defineProps<{
  blocks: DocumentContentBlock[]
  activeBlockId: string | null
  activeSubsectionId?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', blockId: string): void
  (e: 'select-subsection', blockId: string, subsectionId: string): void
}>()

// Set untuk melacak bab mana yang sedang di-expand
const expandedBlockIds = ref<Set<string>>(new Set())

// Buka otomatis bab yang sedang aktif
watch(
  () => props.activeBlockId,
  (newId) => {
    if (newId) {
      expandedBlockIds.value.add(newId)
    }
  },
  { immediate: true }
)

const toggleExpand = (blockId: string, e?: Event) => {
  if (e) e.stopPropagation()
  if (expandedBlockIds.value.has(blockId)) {
    expandedBlockIds.value.delete(blockId)
  } else {
    expandedBlockIds.value.add(blockId)
  }
}

const isExpanded = (blockId: string) => {
  return expandedBlockIds.value.has(blockId)
}

const getSubsections = (block: DocumentContentBlock): DocumentSubsection[] => {
  const content = block.content as any
  if (content && Array.isArray(content.subsections)) {
    return content.subsections
  }
  return []
}

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
        {{ blocks.length }} Bab
      </span>
    </div>

    <!-- Section Navigation List -->
    <div class="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
      <div
        v-for="block in blocks"
        :key="block.id"
        class="space-y-1"
      >
        <!-- Tombol Bab Utama -->
        <button
          type="button"
          @click="emit('select', block.id)"
          :class="[
            'w-full text-left p-3 rounded-xl border text-xs transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer',
            activeBlockId === block.id && !activeSubsectionId
              ? 'bg-rose-500/10 border-rose-500/40 text-white shadow-sm ring-1 ring-rose-500/30'
              : activeBlockId === block.id
                ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                : 'bg-[#090b0e] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900/50'
          ]"
        >
          <div class="flex items-center gap-2 min-w-0">
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

          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Indikator Expand jika memiliki Sub-bab -->
            <button
              v-if="getSubsections(block).length > 0"
              type="button"
              @click.stop="toggleExpand(block.id, $event)"
              class="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              :title="isExpanded(block.id) ? 'Tutup Sub-bab' : 'Buka Sub-bab'"
            >
              <svg
                class="w-3.5 h-3.5 transition-transform duration-200"
                :class="isExpanded(block.id) ? 'rotate-90 text-rose-400' : ''"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <svg
              v-else-if="activeBlockId === block.id"
              class="w-3.5 h-3.5 text-rose-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <!-- Daftar Sub-bab (Hierarkis / Indented) -->
        <div
          v-if="isExpanded(block.id) && getSubsections(block).length > 0"
          class="pl-3 pr-1 py-1 space-y-1 border-l-2 border-slate-800 ml-3"
        >
          <button
            v-for="sub in getSubsections(block)"
            :key="sub.id"
            type="button"
            @click="emit('select-subsection', block.id, sub.id)"
            :class="[
              'w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex items-center justify-between gap-1.5 cursor-pointer',
              activeBlockId === block.id && activeSubsectionId === sub.id
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            ]"
            :title="`${sub.code}. ${sub.title}`"
          >
            <span class="truncate">
              <span class="font-mono text-slate-500 mr-1">{{ sub.code }}.</span>
              {{ sub.title }}
            </span>

            <span
              v-if="activeBlockId === block.id && activeSubsectionId === sub.id"
              class="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 animate-pulse"
            />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
