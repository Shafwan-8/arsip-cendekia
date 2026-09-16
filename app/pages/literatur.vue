<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import type { OpenAlexWork } from '~/types/openalex'

useHead({
  title: 'Pencarian Literatur - Arsip Cendekia'
})

const route = useRoute()
const config = useRuntimeConfig()

// State Form Pencarian & Filter
const searchQuery = ref('')
const selectedCategory = ref((route.query.cat as string) || 'Semua')
const selectedYear = ref('Semua')
const startYear = ref('')
const endYear = ref('')

// State Data OpenAlex API & Pagination
const works = ref<OpenAlexWork[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const totalCount = ref(0)
const hasSearched = ref(false)
const currentPage = ref(1)
const itemsPerPage = 10 // Pagination: 10 data per halaman tabel

// Data yang ditampilkan di halaman aktif (10 per tabel)
const paginatedWorks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return works.value.slice(start, start + itemsPerPage)
})

// Total halaman berdasarkan 50 data hasil API (maksimal 5 halaman)
const totalPages = computed(() => {
  if (!works.value.length) return 0
  return Math.ceil(works.value.length / itemsPerPage)
})

// Rentang data yang sedang ditampilkan
const startItem = computed(() => {
  if (works.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage + 1
})

const endItem = computed(() => {
  return Math.min(currentPage.value * itemsPerPage, works.value.length)
})

// Generator tombol nomor halaman
const visiblePages = computed(() => {
  const pages: number[] = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

// Sinkronisasi kategori dari query parameter (misal klik dari sidebar)
watch(() => route.query.cat, (newCat) => {
  if (newCat && typeof newCat === 'string') {
    selectedCategory.value = newCat
  }
})

// Helper: Format Kategori Teks dari OpenAlex Work Type
const formatCategory = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'book':
      return { label: 'Buku', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    case 'journal-article':
    case 'article':
      return { label: 'Jurnal', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    case 'dissertation':
    case 'thesis':
      return { label: 'Skripsi', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' }
    default:
      return { label: type || 'Publikasi', badge: 'bg-slate-800 text-slate-300 border-slate-700' }
  }
}

// Fungsi Fetch Data dari OpenAlex API (Dibatasi 50 hasil)
const fetchLiterature = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    errorMessage.value = 'Silakan ketik judul atau topik yang ingin dicari terlebih dahulu.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  hasSearched.value = true
  currentPage.value = 1 // Reset ke halaman 1 setiap pencarian baru

  try {
    const params: Record<string, string | number> = {
      'search': query,
      'per-page': 50, // Batasi hasil dari API sebanyak 50
    }

    // Gunakan OpenAlex API Key jika sudah diisi di .env, atau fallback ke Polite Pool mailto
    const apiKey = config.public.openalexApiKey
    if (apiKey) {
      params.api_key = apiKey
    } else {
      params.mailto = 'admin@cendekia.ac.id' // OpenAlex Polite Pool
    }

    // Filter OpenAlex
    const filterTokens: string[] = []

    // 1. Filter Kategori / Type
    if (selectedCategory.value === 'Buku') {
      filterTokens.push('type:book')
    } else if (selectedCategory.value === 'Jurnal') {
      filterTokens.push('type:article')
    } else if (selectedCategory.value === 'Skripsi') {
      filterTokens.push('type:dissertation')
    }

    // 2. Filter Tahun
    if (selectedYear.value === 'custom') {
      if (startYear.value && endYear.value) {
        filterTokens.push(`publication_year:${startYear.value}-${endYear.value}`)
      } else if (startYear.value) {
        filterTokens.push(`publication_year:>${parseInt(startYear.value) - 1}`)
      } else if (endYear.value) {
        filterTokens.push(`publication_year:<${parseInt(endYear.value) + 1}`)
      }
    } else if (selectedYear.value !== 'Semua') {
      filterTokens.push(`publication_year:${selectedYear.value}`)
    }

    if (filterTokens.length > 0) {
      params.filter = filterTokens.join(',')
    }

    const response = await axios.get('https://api.openalex.org/works', { params })

    works.value = response.data.results || []
    totalCount.value = response.data.meta?.count || 0
  } catch (error: any) {
    console.error('Error fetching OpenAlex:', error)
    errorMessage.value = error.response?.data?.message || 'Gagal memuat data dari OpenAlex API. Periksa koneksi internet Anda.'
    works.value = []
  } finally {
    isLoading.value = false
  }
}

// Handler saat tombol Cari ditekan
const handleSearch = () => {
  fetchLiterature()
}

// Handler navigasi pagination tabel (10 data per halaman)
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page

  const resultsSection = document.getElementById('hasil-literatur')
  if (resultsSection) {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const resetFilter = () => {
  searchQuery.value = ''
  selectedCategory.value = 'Semua'
  selectedYear.value = 'Semua'
  startYear.value = ''
  endYear.value = ''
  works.value = []
  totalCount.value = 0
  currentPage.value = 1
  hasSearched.value = false
  errorMessage.value = ''
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
        Cari buku referensi, artikel jurnal ilmiah, dan literatur riset langsung melalui basis data <strong>OpenAlex</strong>.
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
              placeholder="Ketik judul buku, topik riset, atau nama penulis lalu tekan Cari..."
              class="w-full pl-10 pr-4 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            >
          </div>

          <!-- Tombol Aksi Cari -->
          <button
            type="submit"
            :disabled="isLoading"
            class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm flex items-center space-x-1.5 flex-shrink-0 cursor-pointer"
          >
            <svg v-if="isLoading" class="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isLoading ? 'Mencari...' : 'Cari' }}</span>
          </button>
        </div>

        <!-- 2. Baris Filter: Radio Button Kategori & Dropdown Tahun -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-800/40">
          <!-- Filter Kategori (Radio Button Modern) -->
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
                  { value: 'Skripsi', label: 'Skripsi' },
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
    </div>

    <!-- Error Banner -->
    <div v-if="errorMessage" class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
      <span>⚠️ {{ errorMessage }}</span>
      <button
        v-if="searchQuery.trim()"
        @click="fetchLiterature"
        class="font-bold underline ml-2 hover:text-white cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Hasil Pencarian Dokumen Asli OpenAlex -->
    <div id="hasil-literatur" class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div class="flex items-center space-x-2">
          <h3 class="text-sm font-bold text-white tracking-tight">Hasil Literatur OpenAlex</h3>
          <span v-if="hasSearched && !isLoading" class="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {{ works.length }} Dimuat (Maks. 50 dari {{ totalCount.toLocaleString() }} total OpenAlex)
          </span>
        </div>
      </div>

      <!-- Initial State (Sebelum user melakukan pencarian) -->
      <div v-if="!hasSearched && !isLoading" class="text-center py-16 px-4 space-y-3">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h4 class="text-sm font-bold text-white">Mulai Pencarian Literatur</h4>
        <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Ketik judul buku, artikel ilmiah, atau topik riset yang ingin Anda cari pada kolom di atas, lalu klik tombol <span class="text-rose-400 font-semibold">Cari</span>.
        </p>
      </div>

      <!-- Loading State Skeleton -->
      <div v-else-if="isLoading" class="py-8 space-y-3">
        <div v-for="i in 5" :key="i" class="animate-pulse flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div class="space-y-2 flex-1 mr-4">
            <div class="h-3.5 bg-slate-800 rounded w-3/4"></div>
            <div class="h-2.5 bg-slate-800/60 rounded w-1/2"></div>
          </div>
          <div class="h-6 w-16 bg-slate-800 rounded-md"></div>
        </div>
      </div>

      <!-- Tabel Hasil Dokumen OpenAlex (10 data per halaman tabel) -->
      <div v-else-if="works.length > 0" class="space-y-4">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="text-slate-500 border-b border-slate-800/80 uppercase tracking-wider font-semibold">
                <th class="py-3 px-4">Judul Karya & Penulis</th>
                <th class="py-3 px-4">Kategori</th>
                <th class="py-3 px-4">Tahun</th>
                <th class="py-3 px-4">Sumber / Jurnal</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              <tr
                v-for="work in paginatedWorks"
                :key="work.id"
                class="hover:bg-slate-900/40 transition-colors"
              >
                <!-- Judul & Penulis -->
                <td class="py-3.5 px-4 max-w-sm sm:max-w-md">
                  <div class="font-medium text-white line-clamp-2" :title="work.display_name || work.title">
                    {{ work.display_name || work.title || 'Tanpa Judul' }}
                  </div>
                  <div class="text-[10px] text-slate-500 mt-1 truncate">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-3 inline mr-1">
                      <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                    </svg>
                    {{ work.authorships?.map(a => a.author.display_name).slice(0, 3).join(', ') || 'Penulis Anonim' }}
                  </div>
                </td>

                <!-- Kategori / Type Badge -->
                <td class="py-3.5 px-4 whitespace-nowrap">
                  <span
                    :class="[
                      'inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border capitalize',
                      formatCategory(work.type).badge
                    ]"
                  >
                    {{ formatCategory(work.type).label }}
                  </span>
                </td>

                <!-- Tahun Publikasi -->
                <td class="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                  {{ work.publication_year || '-' }}
                </td>

                <!-- Sumber Jurnal / Penerbit -->
                <td class="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                  {{ work.primary_location?.source?.display_name || 'OpenAlex Repository' }}
                </td>

                <!-- Tombol Aksi Buka / Unduh -->
                <td class="py-3.5 px-4 text-right whitespace-nowrap">
                  <a
                    :href="work.primary_location?.pdf_url || work.open_access?.oa_url || work.doi || work.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-semibold transition-colors text-[11px]"
                  >
                    <span>{{ work.open_access?.is_oa || work.primary_location?.pdf_url ? 'Akses PDF' : 'Buka' }}</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls (10 data per halaman tabel) -->
        <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <div>
            Menampilkan <span class="text-white font-medium">{{ startItem }} - {{ endItem }}</span> dari <span class="text-white font-medium">{{ works.length }}</span> data (10 per tabel)
          </div>

          <div class="flex items-center space-x-1.5">
            <!-- Tombol Halaman Sebelumnya -->
            <button
              type="button"
              :disabled="currentPage === 1 || isLoading"
              @click="goToPage(currentPage - 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span class="hidden sm:inline">Sebelumnya</span>
            </button>

            <!-- Nomor Halaman -->
            <template v-for="p in visiblePages" :key="p">
              <button
                type="button"
                :disabled="isLoading"
                @click="goToPage(p)"
                :class="[
                  'min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center border cursor-pointer',
                  currentPage === p
                    ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/20'
                    : 'border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700'
                ]"
              >
                {{ p }}
              </button>
            </template>

            <!-- Tombol Halaman Selanjutnya -->
            <button
              type="button"
              :disabled="currentPage >= totalPages || isLoading"
              @click="goToPage(currentPage + 1)"
              class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <span class="hidden sm:inline">Selanjutnya</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State (Hasil tidak ditemukan setelah user mencari) -->
      <div v-else class="text-center py-12 space-y-2">
        <p class="text-sm font-semibold text-slate-300">Dokumen tidak ditemukan</p>
        <p class="text-xs text-slate-500">Tidak ada literatur yang cocok dengan kata kunci "{{ searchQuery }}". Coba ganti kata kunci atau sesuaikan filter.</p>
        <div class="pt-2">
          <button
            type="button"
            @click="resetFilter"
            class="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Reset Pencarian
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
