<script setup lang="ts">
const isBookmarked = defineModel<boolean>('isBookmarked', { default: false })
</script>

<template>
  <section class="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
    <div class="space-y-2 text-center md:text-left">
      <div class="inline-flex items-center space-x-2 text-xs font-semibold text-brand-400">
        <span class="w-2 h-2 rounded-full bg-brand-400"></span>
        <span>Semua Dependensi Terinstal</span>
      </div>
      <h4 class="text-xl font-bold text-white">Siap Melanjutkan Pembuatan Modul Arsip</h4>
      <p class="text-sm text-slate-400 max-w-xl">
        Anda dapat langsung membuat halaman baru di folder <code class="text-brand-300 font-mono">pages/</code>, komponen di <code class="text-brand-300 font-mono">components/</code>, atau endpoint API di <code class="text-brand-300 font-mono">server/api/</code>.
      </p>
    </div>
    <div class="flex items-center space-x-3">
      <button
        type="button"
        @click="isBookmarked = !isBookmarked"
        :class="[
          'px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center space-x-2 active:scale-95',
          isBookmarked
            ? 'bg-brand-500 text-slate-950 font-bold'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        ]"
      >
        <span>{{ isBookmarked ? '⭐ Tersimpan' : '☆ Tandai Proyek' }}</span>
      </button>
    </div>
  </section>
</template>
