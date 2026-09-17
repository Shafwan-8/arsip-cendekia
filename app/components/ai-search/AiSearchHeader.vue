<script setup lang="ts">
import { useAiSearchStore } from '~/stores/useAiSearchStore'

const store = useAiSearchStore()
</script>

<template>
  <div class="h-16 border-b border-slate-800/80 bg-[#0f1218]/90 px-4 sm:px-6 flex items-center justify-between shrink-0">
    <!-- Left: Title & Subtitle -->
    <div class="flex items-center space-x-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500/20 to-rose-400/30 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>

      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">
            Search With AI
          </h2>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Research Assistant
          </span>
        </div>
        <p class="text-[11px] text-slate-400 hidden sm:block">
          Explore academic literature with AI & RAG synthesis
        </p>
      </div>
    </div>

    <!-- Right: Actions (Clear History & Close) -->
    <div class="flex items-center space-x-2">
      <!-- Clear History Button -->
      <button
        v-if="store.chatHistory.length > 0 || store.currentResponse || store.currentReferences.length > 0"
        type="button"
        @click="store.clearHistory"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none cursor-pointer"
        title="Bersihkan Riwayat"
        aria-label="Bersihkan Riwayat Percakapan"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      <!-- Close Button [X] -->
      <button
        type="button"
        @click="store.close"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/10 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
        aria-label="Tutup Panel AI"
        title="Tutup Panel AI (Esc)"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>
