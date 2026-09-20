<script setup lang="ts">
defineProps<{
  isOpen: boolean
  message?: string
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
  >
    <div class="w-full max-w-md bg-[#0e1117] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
      <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div class="text-center space-y-1">
        <h3 class="text-base font-bold text-white">Perubahan Belum Disimpan</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          {{ message || 'Anda belum menyimpan literatur ini ke arsip. Jika Anda melanjutkan, draft dan perubahan yang belum disimpan akan hilang. Yakin ingin melanjutkan?' }}
        </p>
      </div>

      <div class="flex items-center space-x-3 pt-2">
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          @click="$emit('confirm')"
          class="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-sm shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <span>Ya, Lanjutkan</span>
        </button>
      </div>
    </div>
  </div>
</template>
