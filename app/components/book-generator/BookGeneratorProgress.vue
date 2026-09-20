<script setup lang="ts">
import { computed } from 'vue'
import type { GenerationChapterProgress } from '~/types/documentContentBlock'

const props = defineProps<{
  title: string
  currentActivity: string
  chapters: GenerationChapterProgress[]
  currentChapterIndex: number | null
  currentChapterText: string
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'abort'): void
}>()

const completedCount = computed(() => {
  return props.chapters.filter(c => c.status === 'done').length
})

const totalChapters = computed(() => {
  return props.chapters.length || 1
})

const progressPercentage = computed(() => {
  if (props.chapters.length === 0) return 10
  return Math.round((completedCount.value / totalChapters.value) * 100)
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 py-4">
    <!-- Header Status Card -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-rose-400">
              Proses Pembuatan Literatur AI Sedang Berjalan
            </span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-white line-clamp-1" :title="title">
            {{ title }}
          </h2>
        </div>

        <button
          type="button"
          @click="emit('abort')"
          class="self-start sm:self-center px-3.5 py-1.5 rounded-xl border border-slate-700 bg-[#141720] hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
        >
          Hentikan
        </button>
      </div>

      <!-- Activity & Progress Bar -->
      <div class="space-y-2 pt-2 border-t border-slate-800/60">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-300 font-medium">
            {{ currentActivity || 'Sedang memproses...' }}
          </span>
          <span class="text-slate-400 font-semibold">
            {{ progressPercentage }}% ({{ completedCount }}/{{ totalChapters }} Selesai)
          </span>
        </div>

        <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            class="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-300 rounded-full"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Error message if any -->
      <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        ⚠️ {{ errorMessage }}
      </div>
    </div>

    <!-- Grid: Chapter Checklist (Kiri) & Live Typing Preview (Kanan) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Daftar Bab (Status Stepper) -->
      <div class="lg:col-span-5 bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 space-y-3 shadow-lg">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-2">
          Struktur Bagian Literatur
        </h3>

        <div v-if="chapters.length === 0" class="py-8 text-center text-xs text-slate-500">
          <div class="animate-spin w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <span>Sedang merumuskan outline bab...</span>
        </div>

        <div v-else class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          <div
            v-for="ch in chapters"
            :key="ch.index"
            :class="[
              'p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all duration-200',
              ch.status === 'writing'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 shadow-sm'
                : ch.status === 'done'
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                  : 'bg-slate-900/20 border-slate-800/40 text-slate-500'
            ]"
          >
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <!-- Icon status -->
              <div class="flex-shrink-0">
                <svg v-if="ch.status === 'done'" class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div v-else-if="ch.status === 'writing'" class="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <div v-else class="w-3.5 h-3.5 rounded-full border border-slate-700"></div>
              </div>

              <span class="truncate font-medium" :title="ch.title">
                {{ ch.title }}
              </span>
            </div>

            <span
              :class="[
                'text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0',
                ch.status === 'done'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : ch.status === 'writing'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-500'
              ]"
            >
              {{ ch.status === 'done' ? 'Selesai' : ch.status === 'writing' ? 'Menulis...' : 'Menunggu' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Live Typing Stream Preview (Kanan) -->
      <div class="lg:col-span-7 bg-[#090b0e] border border-slate-800/90 rounded-2xl p-5 flex flex-col shadow-lg">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pratinjau AI Mengetik
            </span>
          </div>
          <span class="text-[11px] text-slate-500">Real-time Stream</span>
        </div>

        <div class="flex-1 min-h-[300px] max-h-[380px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed p-3 bg-[#0d0f14] rounded-xl border border-slate-800/60 whitespace-pre-wrap select-text">
          <template v-if="currentChapterText">
            {{ currentChapterText }}<span class="inline-block w-1.5 h-3.5 bg-rose-500 ml-0.5 animate-pulse"></span>
          </template>
          <div v-else class="h-full flex items-center justify-center text-slate-500 italic py-12">
            AI sedang menyusun ide dan kalimat untuk bagian ini...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
