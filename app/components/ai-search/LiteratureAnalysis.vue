<script setup lang="ts">
import type { LiteratureReference } from '~/types/aiSearch'

defineProps<{
  reference: LiteratureReference
}>()
</script>

<template>
  <div class="space-y-2.5 pt-2 border-t border-slate-800/70 text-xs">
    <!-- AI Summary -->
    <div class="space-y-1">
      <div class="flex items-center gap-1.5">
        <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Summary
        </span>
      </div>

      <!-- Jika sudah ada summary -->
      <p v-if="reference.aiSummary" class="text-slate-300 leading-relaxed pl-0.5">
        {{ reference.aiSummary }}
      </p>

      <!-- Skeleton Loading jika analisis sedang berjalan -->
      <div v-else class="space-y-1.5 py-1">
        <div class="h-2.5 bg-slate-800 rounded animate-pulse w-full"></div>
        <div class="h-2.5 bg-slate-800 rounded animate-pulse w-4/5"></div>
      </div>
    </div>

    <!-- AI Insight -->
    <div class="space-y-1">
      <div class="flex items-center gap-1.5">
        <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Insight
        </span>
      </div>

      <!-- Jika sudah ada insight -->
      <p v-if="reference.aiInsight" class="text-slate-300 leading-relaxed pl-0.5">
        {{ reference.aiInsight }}
      </p>

      <!-- Skeleton Loading -->
      <div v-else class="space-y-1.5 py-1">
        <div class="h-2.5 bg-slate-800 rounded animate-pulse w-11/12"></div>
      </div>
    </div>
  </div>
</template>
