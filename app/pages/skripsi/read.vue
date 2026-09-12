<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const skripsiTitle = (route.query.title as string)
const skripsiId = (route.query.id as string)
const fileName = (route.query.fileName as string)
const fileUrl = (route.query.file as string)

useHead({
  title: `${skripsiTitle} - Pembaca PDF Arsip Cendekia`
})
</script>

<template>
  <div class="space-y-4">
    <!-- Top Bar Navigasi & Info Berkas -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center space-x-3">
        <!-- Tombol Kembali -->
        <NuxtLink
          to="/skripsi"
          class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title="Kembali ke Daftar Skripsi"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>

        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
              {{ skripsiTitle }}
            </h2>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              PDF
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Berkas: <span class="text-slate-300 font-mono">{{ fileName }}</span>
          </p>
        </div>
      </div>

      <!-- Action Buttons in Reader -->
      <div class="flex items-center space-x-2">
        <NuxtLink
          :to="`/skripsi/edit?id=${skripsiId}`"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
        >
          <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit Metadata</span>
        </NuxtLink>

        <a
          v-if="fileUrl"
          :href="fileUrl"
          target="_blank"
          download
          class="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 shadow-sm shadow-rose-500/20"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Unduh Berkas</span>
        </a>
      </div>
    </div>

    <!-- PDF.js Container Placeholder -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-6 min-h-[70vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
      <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400 shadow-md">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <div class="max-w-md space-y-1">
        <h3 class="text-base font-bold text-white">Area Viewer PDF (pdf.js)</h3>
        <p class="text-xs text-slate-400 leading-relaxed">
          Halaman ini siap dihubungkan dengan library <span class="text-rose-400 font-semibold font-mono">pdf.js</span> atau komponen canvas reader untuk membaca berkas dari Supabase Storage.
        </p>
      </div>

      <div class="p-3 bg-[#090b0e] border border-slate-800/80 rounded-xl text-xs text-slate-400 font-mono text-left max-w-sm w-full space-y-1">
        <div class="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Parameter Terhubung:</div>
        <div class="truncate text-slate-300">ID: {{ skripsiId }}</div>
        <div class="truncate text-slate-300">File: {{ fileName }}</div>
        <div class="truncate text-slate-400 text-[10px]">URL: {{ fileUrl }}</div>
      </div>
    </div>
  </div>
</template>
