<script setup lang="ts">
import type { LiteratureReference } from '~/types/aiSearch'
import LiteratureReferenceCard from './LiteratureReferenceCard.vue'

defineProps<{
  references: LiteratureReference[]
}>()
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-[#0e1117]/60 rounded-2xl border border-slate-800/80">
    <!-- Header Rujukan -->
    <div class="px-4 py-3 border-b border-slate-800/80 bg-[#12161f]/80 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-300">
          Literatur Rujukan
        </span>
      </div>

      <span
        v-if="references.length > 0"
        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30"
      >
        {{ references.length }} Karya
      </span>
    </div>

    <!-- Scrollable Cards Container -->
    <div class="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 chat-scrollbar">
      <div v-if="references.length === 0" class="py-12 text-center text-xs text-slate-500 space-y-2">
        <svg class="w-8 h-8 text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p>Belum ada rujukan literatur yang dimuat.</p>
      </div>

      <LiteratureReferenceCard
        v-for="ref in references"
        :key="ref.index"
        :reference="ref"
      />
    </div>
  </div>
</template>
