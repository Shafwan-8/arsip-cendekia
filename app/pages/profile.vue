<script setup lang="ts">
useHead({
  title: 'Profil - Arsip Cendekia'
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header -->
    <div class="text-center space-y-3">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400">
        <span>Tentang Lembaga</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Profil Arsip Cendekia</h1>
      <p class="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
        Unit kearsipan modern yang berdedikasi menjaga integritas, keamanan, dan aksesibilitas dokumen akademis dan institusional.
      </p>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-3">
        <div class="text-2xl">🎯</div>
        <h3 class="text-lg font-bold text-white">Visi</h3>
        <p class="text-slate-400 text-sm leading-relaxed">
          Menjadi pusat repositori arsip digital unggul yang terpercaya, transparan, dan terintegrasi untuk mendukung kemajuan pendidikan dan riset.
        </p>
      </div>

      <div class="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-3">
        <div class="text-2xl">🚀</div>
        <h3 class="text-lg font-bold text-white">Misi</h3>
        <ul class="text-slate-400 text-sm space-y-2 list-disc list-inside leading-relaxed">
          <li>Digitalisasi dan pelestarian dokumen sejarah & akademika secara berkelanjutan.</li>
          <li>Menyediakan akses informasi arsip yang cepat, mudah, dan aman.</li>
          <li>Meningkatkan standar tata kelola kearsipan sesuai regulasi nasional.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
