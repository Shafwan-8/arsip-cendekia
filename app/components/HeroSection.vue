<script setup lang="ts">
const searchKeyword = defineModel<string>({ default: '' })
</script>

<template>
  <section class="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
    <!-- Main Title -->
    <h2 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
      Sistem Pengarsipan Modern <br>
      <span class="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
        Cepat, Aman & Terstruktur
      </span>
    </h2>

    <p class="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
      Selamat datang di fondasi aplikasi <strong>Arsip Cendekia</strong>. Siap dikembangkan untuk manajemen repositori dokumen digital.
    </p>

    <!-- Simulated Search Input -->
    <div class="max-w-xl mx-auto relative pt-2">
      <div class="relative flex items-center">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Cari arsip dokumen, no. surat, atau pedoman..."
          class="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl py-3.5 pl-12 pr-28 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all shadow-xl shadow-black/40"
        />
        <span class="absolute left-4 text-slate-400 text-lg">🔍</span>
        <button
          type="button"
          class="absolute right-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold text-xs rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95"
        >
          Cari Arsip
        </button>
      </div>
      <p v-if="searchKeyword" class="text-xs text-slate-400 mt-2 text-left px-2">
        Mencari: <span class="text-brand-300 font-mono">"{{ searchKeyword }}"</span>
      </p>
    </div>
  </section>
</template>
