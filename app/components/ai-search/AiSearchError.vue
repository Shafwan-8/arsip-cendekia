<script setup lang="ts">
import type { AiSearchError } from '~/types/aiSearch'

defineProps<{
  error: AiSearchError
}>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div class="mx-4 sm:mx-6 my-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 text-xs">
    <svg class="w-5 h-5 text-rose-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>

    <div class="flex-1 space-y-0.5">
      <p class="font-bold text-rose-200">
        {{ error.code === 'RATE_LIMIT' ? 'Layanan Sibuk' : 'Pemberitahuan Pencarian' }}
      </p>
      <p class="text-slate-300 leading-relaxed">
        {{ error.message }}
      </p>
    </div>

    <button
      type="button"
      @click="emit('dismiss')"
      class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
      title="Tutup pesan"
      aria-label="Tutup pesan error"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
