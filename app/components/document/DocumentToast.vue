<script setup lang="ts">
import type { ToastType } from '~/composables/useToast'

defineProps<{
  show: boolean
  message: string
  type: ToastType
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-3 opacity-0 sm:translate-y-0 sm:translate-x-3"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium max-w-sm"
      :class="[
        type === 'success' ? 'bg-[#0d1017]/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' : '',
        type === 'error' ? 'bg-[#0d1017]/95 border-rose-500/40 text-rose-300 shadow-rose-500/10' : '',
        type === 'info' ? 'bg-[#0d1017]/95 border-slate-700 text-slate-200' : ''
      ]"
    >
      <div
        class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        :class="type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'"
      >
        <svg v-if="type === 'success'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span class="leading-relaxed flex-1">{{ message }}</span>
      <button
        type="button"
        @click="$emit('close')"
        class="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>
