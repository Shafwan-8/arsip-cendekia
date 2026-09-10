<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ArchiveItem } from '~/types/archive'

definePageMeta({
  alias: ['/']
})

useHead({
  title: 'Dashboard Admin - Arsip Cendekia'
})

// Time Range Filter
const selectedTime = ref('30h')
const timeOptions = [
  { id: '7h', label: '7 Hari' },
  { id: '30h', label: '30 Hari' },
  { id: '90h', label: '90 Hari' },
  { id: 'all', label: 'Semua Waktu' }
]

// 4 Kartu Metrik Kontekstual Arsip Cendekia (Emulasi Visual Template)
const metrics = [
  {
    title: 'Total Koleksi Arsip',
    value: '1,284',
    trend: '+14.2%',
    isPositive: true,
    color: 'rose',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    title: 'Buku Referensi',
    value: '486',
    trend: '+8.5%',
    isPositive: true,
    color: 'cyan',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  {
    title: 'Jurnal & Artikel Ilmiah',
    value: '642',
    trend: '+12.1%',
    isPositive: true,
    color: 'emerald',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
  },
  {
    title: 'Total Akses & Unduhan',
    value: '3,840',
    trend: '+18.4%',
    isPositive: true,
    color: 'purple',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
  }
]

// Data Arsip Dokumen Terbaru
const recentArchives: ArchiveItem[] = [
  {
    title: 'Pedoman Kurikulum Merdeka Terintegrasi 2026/2027',
    category: 'buku',
    code: 'AC-BKO-2026-004',
    date: '08 Mar 2026',
    size: '3.4 MB',
    type: 'PDF'
  },
  {
    title: 'Transformasi Digital Manajemen Repositori Kampus',
    category: 'jurnal',
    code: 'AC-JRN-2026-018',
    date: '05 Mar 2026',
    size: '2.1 MB',
    type: 'PDF'
  },
  {
    title: 'Analisis Efektivitas Tata Kelola Kearsipan Elektronik',
    category: 'artikel',
    code: 'AC-ART-2026-009',
    date: '01 Mar 2026',
    size: '1.5 MB',
    type: 'PDF'
  },
  {
    title: 'Metodologi Penelitian Kearsipan Modern Edisi Revisi',
    category: 'buku',
    code: 'AC-BKO-2026-012',
    date: '26 Feb 2026',
    size: '5.2 MB',
    type: 'PDF'
  }
]

const activeCategoryFilter = ref('semua')

const filteredDocuments = computed(() => {
  if (activeCategoryFilter.value === 'semua') return recentArchives
  return recentArchives.filter(item => item.category === activeCategoryFilter.value)
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header Section (Meniru Gaya Template) -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ringkasan Arsip Cendekia
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau ketersediaan dokumen, statistik repositori, dan data kearsipan terkini.
        </p>
      </div>

      <!-- Time Filter & Date Pill -->
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="inline-flex rounded-xl bg-[#0d0f14] border border-slate-800 p-1">
          <button
            v-for="opt in timeOptions"
            :key="opt.id"
            type="button"
            @click="selectedTime = opt.id"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              selectedTime === opt.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0d0f14] border border-slate-800 text-xs text-slate-400">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>12 Jun 2026 – 10 Sep 2026</span>
        </div>
      </div>
    </div>

    <!-- 4 Kartu Metrik (Tampilan Sesuai Template, Konten Sesuai Proyek) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in metrics"
        :key="idx"
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden transition-all hover:border-slate-700"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400">
            {{ card.title }}
          </span>
          <div :class="['w-9 h-9 rounded-xl border flex items-center justify-center', card.iconBg]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.icon" />
            </svg>
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {{ card.value }}
          </h3>
        </div>
      </div>
    </div>

    <!-- Tabel Dokumen Terkini (Tanpa Chart/Grafik Sesuai Permintaan) -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 class="text-base font-bold text-white tracking-tight">
            Dokumen & Berkas Terkini
          </h3>
          <p class="text-xs text-slate-400">
            Daftar penambahan arsip terbaru yang tersimpan dalam sistem
          </p>
        </div>

        <!-- Filter Kategori Tabs -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="cat in ['semua', 'buku', 'jurnal', 'artikel']"
            :key="cat"
            type="button"
            @click="activeCategoryFilter = cat"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors',
              activeCategoryFilter === cat
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-500 border-b border-slate-800/80 uppercase tracking-wider font-semibold">
              <th class="py-3 px-4">Judul Dokumen</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Format</th>
              <th class="py-3 px-4">Ukuran</th>
              <th class="py-3 px-4">Terakhir Diubah</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="(doc, idx) in filteredDocuments"
              :key="idx"
              class="hover:bg-slate-900/40 transition-colors"
            >
              <td class="py-3.5 px-4 font-medium text-white max-w-xs sm:max-w-md">
                <div class="truncate">{{ doc.title }}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">{{ doc.code }}</div>
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold capitalize',
                    doc.category === 'buku' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : '',
                    doc.category === 'jurnal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : '',
                    doc.category === 'artikel' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : ''
                  ]"
                >
                  {{ doc.category }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                  {{ doc.type }}
                </span>
              </td>
              <td class="py-3.5 px-4 text-slate-400">{{ doc.size }}</td>
              <td class="py-3.5 px-4 text-slate-400">{{ doc.date }}</td>
              <td class="py-3.5 px-4 text-right">
                <NuxtLink
                  to="/literatur"
                  class="inline-flex items-center space-x-1 text-rose-400 hover:text-rose-300 font-semibold"
                >
                  <span>Buka</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
