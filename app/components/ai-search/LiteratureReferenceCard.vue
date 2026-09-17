<script setup lang="ts">
import { computed } from 'vue'
import { useAiSearchStore } from '~/stores/useAiSearchStore'
import type { LiteratureReference } from '~/types/aiSearch'
import LiteratureAnalysis from './LiteratureAnalysis.vue'

const props = defineProps<{
  reference: LiteratureReference
}>()

const store = useAiSearchStore()

const formattedAuthors = computed(() => {
  if (!props.reference.authors || props.reference.authors.length === 0) {
    return 'Penulis tidak tertera'
  }
  if (props.reference.authors.length <= 2) {
    return props.reference.authors.join(', ')
  }
  return `${props.reference.authors.slice(0, 2).join(', ')} et al.`
})

const publicationMeta = computed(() => {
  const parts: string[] = []
  if (props.reference.journal) parts.push(props.reference.journal)
  if (props.reference.year) parts.push(String(props.reference.year))
  return parts.length > 0 ? parts.join(' • ') : 'Informasi publikasi tidak tersedia'
})

const isHighlighted = computed(() => store.activeCitation === props.reference.index)
</script>

<template>
  <article
    :id="`literature-reference-${reference.index}`"
    :data-reference-index="reference.index"
    :class="[
      'rounded-2xl p-4 sm:p-5 transition-all duration-300 border text-slate-100 space-y-3.5',
      isHighlighted
        ? 'bg-[#1a1f2c] border-rose-500/80 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/50 scale-[1.01]'
        : 'bg-[#151921] hover:bg-[#181d27] border-slate-800/80 hover:border-slate-700/80'
    ]"
  >
    <!-- Top Row: Reference Number & Title -->
    <div class="flex items-start gap-3">
      <!-- Badge Nomor Referensi -->
      <div
        :class="[
          'w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors',
          isHighlighted
            ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
        ]"
      >
        [{{ reference.index }}]
      </div>

      <!-- Title & Authors -->
      <div class="flex-1 space-y-1 min-w-0">
        <h4 class="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-2">
          {{ reference.title }}
        </h4>
        <p class="text-[11px] text-slate-400 font-medium truncate">
          {{ formattedAuthors }}
        </p>
        <p class="text-[10px] text-slate-500 flex items-center gap-1.5">
          <svg class="w-3 h-3 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="truncate">{{ publicationMeta }}</span>
        </p>
      </div>
    </div>

    <!-- AI Analysis (Summary & Insight) -->
    <LiteratureAnalysis :reference="reference" />

    <!-- Action Links: [Open PDF] [DOI] [Landing Page] -->
    <div class="pt-1 flex flex-wrap items-center gap-2">
      <!-- PDF Button -->
      <a
        v-if="reference.pdfUrl"
        :href="reference.pdfUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-400 transition-all duration-150"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span>Open PDF</span>
      </a>

      <!-- DOI Button -->
      <a
        v-if="reference.doi"
        :href="reference.doi"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all duration-150"
      >
        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span>DOI</span>
      </a>

      <!-- Sumber / Landing Page Link -->
      <a
        v-else-if="reference.landingPageUrl"
        :href="reference.landingPageUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all duration-150"
      >
        <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        <span>Buka Sumber</span>
      </a>
    </div>
  </article>
</template>
