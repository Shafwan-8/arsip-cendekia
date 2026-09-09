<script setup lang="ts">
useHead({
  title: 'Pendidikan - Arsip Cendekia'
})

const programs = [
  {
    icon: '📚',
    title: 'Literasi Kearsipan Digital',
    desc: 'Pelatihan dasar pengelolaan dokumen dan arsip elektronik bagi civitas akademika.'
  },
  {
    icon: '💻',
    title: 'Workshop Digitalisasi Dokumen',
    desc: 'Bimbingan teknis alih media dari dokumen fisik ke format digital berstandar.'
  },
  {
    icon: '🛡️',
    title: 'Keamanan & Autentikasi Arsip',
    desc: 'Pemahaman mengenai integritas data, tanda tangan digital, dan preservasi jangka panjang.'
  }
]
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header -->
    <div class="text-center space-y-3">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400">
        <span>Edukasi & Pelatihan</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Pendidikan Kearsipan</h1>
      <p class="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
        Program literasi, modul pembelajaran, dan workshop untuk meningkatkan kesadaran pentingnya tertib arsip.
      </p>
    </div>

    <!-- Programs Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="(program, idx) in programs"
        :key="idx"
        class="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
      >
        <div class="text-2xl">{{ program.icon }}</div>
        <h3 class="text-base font-bold text-white">{{ program.title }}</h3>
        <p class="text-slate-400 text-sm leading-relaxed">{{ program.desc }}</p>
      </div>
    </div>
  </div>
</template>
