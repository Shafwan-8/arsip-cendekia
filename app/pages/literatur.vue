<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { ArchiveItem } from '~/types/archive'

useHead({
  title: 'Pencarian Literatur - Arsip Cendekia'
})

const route = useRoute()

// State Form Pencarian & Filter
const searchQuery = ref('')
const selectedCategory = ref((route.query.cat as string) || 'Semua')
const selectedYear = ref('Semua')
const startYear = ref('')
const endYear = ref('')

// Sinkronisasi kategori dari query parameter
watch(() => route.query.cat, (newCat) => {
  if (newCat && typeof newCat === 'string') {
    selectedCategory.value = newCat
  }
})

// Riwayat Pencarian Cepat
const searchHistory = ref([
  'Kurikulum Merdeka',
  'Manajemen Repositori',
  'Metodologi Penelitian',
  'Kearsipan Elektronik'
])

// Data Literatur Sementara (Siap dihubungkan ke API)
const literaturData: ArchiveItem[] = [
  {
    title: 'Pedoman Kurikulum Merdeka Terintegrasi 2026/2027',
    category: 'Buku',
    code: 'AC-BKO-2026-004',
    date: '08 Mar 2026',
    size: '3.4 MB',
    type: 'PDF'
  },
  {
    title: 'Transformasi Digital Manajemen Repositori Kampus',
    category: 'Jurnal',
    code: 'AC-JRN-2026-018',
    date: '05 Mar 2026',
    size: '2.1 MB',
    type: 'PDF'
  },
  {
    title: 'Analisis Efektivitas Tata Kelola Kearsipan Elektronik',
    category: 'Artikel',
    code: 'AC-ART-2026-009',
    date: '01 Mar 2026',
    size: '1.5 MB',
    type: 'PDF'
  },
  {
    title: 'Metodologi Penelitian Kearsipan Modern Edisi Revisi',
    category: 'Buku',
    code: 'AC-BKO-2026-012',
    date: '26 Feb 2026',
    size: '5.2 MB',
    type: 'PDF'
  },
  {
    title: 'Preservasi Dokumen Digital Jangka Panjang di Institusi Riset',
    category: 'Jurnal',
    code: 'AC-JRN-2025-042',
    date: '15 Des 2025',
    size: '1.8 MB',
    type: 'PDF'
  },
  {
    title: 'Standar Keamanan dan Integritas Dokumen Arsip Nasional',
    category: 'Artikel',
    code: 'AC-ART-2024-031',
    date: '10 Nov 2024',
    size: '2.7 MB',
    type: 'PDF'
  }
]

// Filter Dokumen Reaktif
const filteredResults = computed(() => {
  return literaturData.filter((item) => {
    // 1. Filter Pencarian Teks
    const matchQuery = searchQuery.value.trim() === '' || 
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.value.toLowerCase())

    // 2. Filter Kategori (Radio Button)
    const matchCategory = selectedCategory.value === 'Semua' || 
      item.category.toLowerCase() === selectedCategory.value.toLowerCase()

    // 3. Filter Tahun (Dropdown / Custom Range)
    let matchYear = true
    const docYear = parseInt(item.date.match(/\d{4}/)?.[0] || '0', 10)

    if (selectedYear.value === 'custom') {
      const s = startYear.value ? parseInt(startYear.value, 10) : null
      const e = endYear.value ? parseInt(endYear.value, 10) : null

      if (s && e) {
        matchYear = docYear >= s && docYear <= e
      } else if (s) {
        matchYear = docYear >= s
      } else if (e) {
        matchYear = docYear <= e
      }
    } else if (selectedYear.value !== 'Semua') {
      matchYear = item.date.includes(selectedYear.value)
    }

    return matchQuery && matchCategory && matchYear
  })
})

const handleSearch = () => {
  // Handler pencarian siap dihubungkan ke API
  console.log('Fetch API Literatur:', {
    query: searchQuery.value,
    category: selectedCategory.value,
    year: selectedYear.value,
    startYear: startYear.value,
    endYear: endYear.value
  })
}

const resetFilter = () => {
  searchQuery.value = ''
  selectedCategory.value = 'Semua'
  selectedYear.value = 'Semua'
  startYear.value = ''
  endYear.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Halaman -->
    <div>
      <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Pencarian Literatur
      </h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Cari dan filter buku referensi, artikel jurnal ilmiah, dan berkas arsip melalui repositori digital.
      </p>
    </div>

    <!-- Container Form Pencarian & Filter -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-4">
      <form @submit.prevent="handleSearch" class="space-y-4">
        <!-- 1. Kolom Pencarian: Satu Baris Penuh -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari judul buku, jurnal, artikel ilmiah, atau nama penulis..."
              class="w-full pl-10 pr-4 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            >
          </div>

          <!-- Tombol Aksi Cari -->
          <button
            type="submit"
            class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm flex items-center space-x-1.5 flex-shrink-0"
          >
            <span>Cari</span>
          </button>
        </div>

        <!-- 2. Baris Filter: Radio Button Kategori & Dropdown Tahun -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
          <!-- Filter Kategori (Styling Radio Button Modern) -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Kategori
            </span>

            <div class="flex flex-wrap items-center gap-2">
              <label
                v-for="cat in [
                  { value: 'Semua', label: 'Semua' },
                  { value: 'Buku', label: 'Buku' },
                  { value: 'Jurnal', label: 'Jurnal' },
                  { value: 'Artikel', label: 'Artikel' }
                ]"
                :key="cat.value"
                :class="[
                  'group flex items-center px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none',
                  selectedCategory === cat.value
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/10'
                    : 'bg-[#090b0e] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                ]"
              >
                <input
                  v-model="selectedCategory"
                  type="radio"
                  :value="cat.value"
                  name="category"
                  class="sr-only"
                >
                <span>{{ cat.label }}</span>
              </label>
            </div>
          </div>

          <!-- Filter Tahun (Dropdown + Custom Range) -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tahun
            </span>

            <div class="flex flex-wrap items-center gap-2">
              <!-- Styled Dropdown with Calendar & Chevron Icons -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <select
                  v-model="selectedYear"
                  class="appearance-none pl-8 pr-8 py-2 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs font-medium text-slate-200 focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="Semua">Semua Tahun</option>
                  <option value="2026">Tahun 2026</option>
                  <option value="2025">Tahun 2025</option>
                  <option value="2024">Tahun 2024</option>
                  <option value="custom">Custom</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Input Tahun Awal & Akhir (Card Kompak) -->
              <div
                v-if="selectedYear === 'custom'"
                class="flex items-center gap-1.5 px-2 py-1 bg-[#090b0e] border border-rose-500/40 rounded-xl shadow-sm transition-all animate-fadeIn"
              >
                <input
                  v-model="startYear"
                  type="number"
                  placeholder="Mulai"
                  class="w-20 px-2.5 py-1 bg-slate-900/90 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none text-center"
                >
                <span class="text-slate-500 text-xs font-medium">s/d</span>
                <input
                  v-model="endYear"
                  type="number"
                  placeholder="Akhir"
                  class="w-20 px-2.5 py-1 bg-slate-900/90 border border-slate-800 focus:border-rose-500 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none text-center"
                >
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Riwayat Pencarian & Tombol Reset -->
      <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <span class="text-slate-500 font-medium">Riwayat:</span>
        <button
          v-for="item in searchHistory"
          :key="item"
          type="button"
          @click="searchQuery = item"
          class="px-2.5 py-1 rounded-lg bg-[#090b0e] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 transition-colors"
        >
          {{ item }}
        </button>

        <button
          v-if="searchQuery || selectedCategory !== 'Semua' || selectedYear !== 'Semua' || startYear || endYear"
          type="button"
          @click="resetFilter"
          class="ml-auto text-rose-400 hover:text-rose-300 font-medium transition-colors"
        >
          Reset Filter
        </button>
      </div>
    </div>

    <!-- Hasil Pencarian Dokumen -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div class="flex items-center space-x-2">
          <h3 class="text-sm font-bold text-white tracking-tight">Daftar Dokumen Literatur</h3>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {{ filteredResults.length }} Dokumen Ditemukan
          </span>
        </div>
      </div>

      <!-- Tabel Hasil Dokumen -->
      <div v-if="filteredResults.length > 0" class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-500 border-b border-slate-800/80 uppercase tracking-wider font-semibold">
              <th class="py-3 px-4">Judul Dokumen</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Format</th>
              <th class="py-3 px-4">Ukuran</th>
              <th class="py-3 px-4">Tanggal Rilis</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="(doc, idx) in filteredResults"
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
                    doc.category.toLowerCase() === 'buku' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : '',
                    doc.category.toLowerCase() === 'jurnal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : '',
                    doc.category.toLowerCase() === 'artikel' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : ''
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
                <button
                  type="button"
                  class="inline-flex items-center space-x-1 text-rose-400 hover:text-rose-300 font-semibold"
                >
                  <span>Unduh</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 space-y-2">
        <p class="text-2xl">🔍</p>
        <p class="text-sm font-semibold text-slate-300">Dokumen tidak ditemukan</p>
        <p class="text-xs text-slate-500">Coba ganti kata kunci atau atur ulang kategori dan rentang tahun pencarian.</p>
        <div class="pt-2">
          <button
            type="button"
            @click="resetFilter"
            class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Reset Pencarian
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
