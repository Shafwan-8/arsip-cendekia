<script setup lang="ts">
import { computed } from 'vue'
import type { LiteratureResult } from '~/types/literature'

const props = defineProps<{
  literature: LiteratureResult
}>()

const formattedAuthors = computed(() => {
  if (!props.literature.authors || props.literature.authors.length === 0) {
    return 'Penulis tidak tertera'
  }
  if (props.literature.authors.length <= 3) {
    return props.literature.authors.join(', ')
  }
  return `${props.literature.authors.slice(0, 3).join(', ')} et al.`
})

const publicationMeta = computed(() => {
  const parts: string[] = []
  if (props.literature.journal) parts.push(props.literature.journal)
  if (props.literature.publicationYear) parts.push(String(props.literature.publicationYear))
  return parts.length > 0 ? parts.join(' • ') : 'Informasi publikasi tidak tersedia'
})

const hasAbstract = computed(() => Boolean(props.literature.abstract))

const targetUrl = computed(() => {
  if (props.literature.url) return props.literature.url
  if (props.literature.doi) {
    return props.literature.doi.startsWith('http')
      ? props.literature.doi
      : `https://doi.org/${props.literature.doi}`
  }
  return props.literature.id
})
</script>

<template>
  <div class="bg-[#151921] hover:bg-[#181d26] border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm space-y-3.5">
    <!-- Header: Title & Citations -->
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 flex-1">
        <h4 class="text-sm sm:text-base font-bold text-white tracking-tight leading-snug line-clamp-2">
          <a
            :href="targetUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-rose-400 transition-colors focus:outline-none"
            :title="literature.title"
          >
            {{ literature.title }}
          </a>
        </h4>
        <p class="text-xs text-slate-400 font-medium line-clamp-1">
          {{ formattedAuthors }}
        </p>
        <p class="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span class="truncate">{{ publicationMeta }}</span>
        </p>
      </div>

      <!-- Citation Badge -->
      <span
        v-if="literature.citedByCount > 0"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0"
        :title="`${literature.citedByCount} sitasi terindeks`"
      >
        <svg class="w-3 h-3 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span>{{ literature.citedByCount }} Sitasi</span>
      </span>
    </div>

    <!-- AI Analysis Section -->
    <div class="border-t border-slate-800/60 pt-3 space-y-2.5">
      <!-- AI Summary -->
      <div class="space-y-1">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Summary
          </span>
          <span class="text-[10px] text-slate-500">
            • {{ hasAbstract ? 'Berdasarkan abstrak & metadata' : 'Berdasarkan metadata' }}
          </span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed pl-0.5">
          {{ literature.analysis?.summary || 'Ringkasan AI belum tersedia untuk literatur ini.' }}
        </p>
      </div>

      <!-- Why it is relevant -->
      <div v-if="literature.analysis?.relevance" class="space-y-1">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Kenapa Relevan
          </span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed pl-0.5">
          {{ literature.analysis.relevance }}
        </p>
      </div>

      <!-- AI Insight -->
      <div v-if="literature.analysis?.insight" class="space-y-1">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Insight
          </span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed pl-0.5">
          {{ literature.analysis.insight }}
        </p>
      </div>
    </div>

    <!-- Action Button -->
    <div class="pt-1 flex items-center justify-end">
      <a
        :href="targetUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-rose-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-rose-500 transition-all duration-150 group"
      >
        <span>Lihat Literatur</span>
        <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  </div>
</template>
