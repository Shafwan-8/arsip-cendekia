<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

useHead({
  title: 'Cari Literatur - Arsip Cendekia'
})

const route = useRoute()

// Search & Filter State
const searchQuery = ref('')
const selectedCategory = ref((route.query.cat as string) || 'Buku')
const selectedYear = ref('Semua Tahun')

watch(() => route.query.cat, (newCat) => {
  if (newCat && typeof newCat === 'string') {
    selectedCategory.value = newCat
  }
})

// Riwayat Pencarian
const searchHistory = ref([
  'Sejarah Sistem Pendidikan Indonesia',
  'Pengantar Sistem Pendidikan Indonesia',
  'Filsafat Pendidikan'
])  


// Dropdown Toggle State
const isCategoryOpen = ref(false)
const isYearOpen = ref(false)

const categories = ['Buku', 'Jurnal', 'Artikel']
const years = ['Semua Tahun', '2026', '2025']

const selectCategory = (cat: string) => {
  selectedCategory.value = cat
  isCategoryOpen.value = false
}

const selectYear = (yr: string) => {
  selectedYear.value = yr
  isYearOpen.value = false
}


// Temporary form submission without direction/action
const handleSearch = () => {
  // Hanya form tanpa arah untuk sementara sesuai permintaan
  console.log('Searching literature:', {
    query: searchQuery.value,
    category: selectedCategory.value,
    year: selectedYear.value
  })
}

// Close dropdowns when clicking outside
const closeDropdowns = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown-category-container')) {
    isCategoryOpen.value = false
  }
  if (!target.closest('.dropdown-year-container')) {
    isYearOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8">
    <!-- Header Section -->
    <div class="text-center space-y-4">
      <h1 class="text-3xl sm:text-4xl font-bold text-white tracking-normal">
        Cari Literatur
      </h1>

      <!-- Dashed Decorative Divider -->
      <div class="w-72 sm:w-96 mx-auto border-t-2 border-dashed border-slate-400/60 my-3"></div>

      <p class="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Eksplorasi Buku Referensi, Artikel Jurnal Ilmiah, dan Skripsi dalam Satu Antarmuka yang Rapi dan Terstruktur.
      </p>
    </div>

    <!-- Search Form (Tanpa Arah / Self-Contained) -->
    <form class="space-y-4" @submit.prevent="handleSearch">
      <!-- Main Search Bar -->
      <div class="relative flex items-center bg-slate-900/90 border border-slate-800 rounded-full px-4 py-2.5 shadow-xl shadow-black/40 focus-within:border-brand-400/80 focus-within:ring-1 focus-within:ring-brand-400/30 transition-all">
        <!-- Search Icon -->
        <span class="text-slate-400 pl-2 pr-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>

        <!-- Input Field -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari judul buku, topik riset, atau nama penulis..."
          class="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none pr-3"
        >

        <!-- Search Button (Accent) -->
        <button
          type="submit"
          class="flex-shrink-0 px-6 py-2 rounded-full bg-brand-400 hover:bg-brand-300 text-slate-950 font-bold text-sm transition-colors shadow-md shadow-brand-400/20"
        >
          Cari
        </button>
      </div>

      <!-- Filters Container (Kategori & Tahun) -->
      <div class="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
        <!-- Kategori Filter -->
        <div class="dropdown-category-container relative flex items-center gap-3 w-full sm:w-auto">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            KATEGORI:
          </span>

          <div class="relative w-full sm:w-56">
            <button
              type="button"
              @click.stop="isCategoryOpen = !isCategoryOpen; isYearOpen = false"
              class="w-full flex items-center justify-between px-4 py-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none transition-colors"
            >
              <span>{{ selectedCategory }}</span>
              <svg
                :class="['w-4 h-4 text-slate-400 transition-transform', isCategoryOpen ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Kategori Dropdown Menu -->
            <div
              v-if="isCategoryOpen"
              class="absolute left-0 top-full mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden"
            >
              <button
                v-for="cat in categories"
                :key="cat"
                type="button"
                @click="selectCategory(cat)"
                class="w-full flex items-center px-4 py-2 text-sm text-left hover:bg-slate-800/80 transition-colors"
                :class="selectedCategory === cat ? 'text-brand-400 font-semibold' : 'text-slate-300'"
              >
                <span class="w-5 text-brand-400 font-bold text-xs">
                  <span v-if="selectedCategory === cat">✓</span>
                </span>
                <span>{{ cat }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tahun Filter -->
        <div class="dropdown-year-container relative flex items-center gap-3 w-full sm:w-auto">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
            TAHUN:
          </span>

          <div class="relative w-full sm:w-56">
            <button
              type="button"
              @click.stop="isYearOpen = !isYearOpen; isCategoryOpen = false"
              class="w-full flex items-center justify-between px-4 py-2 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl text-sm font-medium text-slate-200 focus:outline-none transition-colors"
            >
              <span>{{ selectedYear }}</span>
              <svg
                :class="['w-4 h-4 text-slate-400 transition-transform', isYearOpen ? 'rotate-180' : '']"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Tahun Dropdown Menu -->
            <div
              v-if="isYearOpen"
              class="absolute left-0 top-full mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 py-1.5 max-h-56 overflow-y-auto"
            >
              <button
                v-for="yr in years"
                :key="yr"
                type="button"
                @click="selectYear(yr)"
                class="w-full flex items-center px-4 py-2 text-sm text-left hover:bg-slate-800/80 transition-colors"
                :class="selectedYear === yr ? 'text-brand-400 font-semibold' : 'text-slate-300'"
              >
                <span class="w-5 text-brand-400 font-bold text-xs">
                  <span v-if="selectedYear === yr">✓</span>
                </span>
                <span>{{ yr }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

       <!-- Trending / Popular Topics -->
      <div class="pt-2 flex flex-wrap items-center gap-2 text-xs">
        <span class="text-slate-500 font-semibold uppercase tracking-wider mr-1">
          Riwayat Pencarian:
        </span>
        <button
          v-for="topic in searchHistory"
          :key="topic"
          type="button"
          @click="searchQuery = topic"
          class="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
        >
          {{ topic }}
        </button>
      </div>

    </form>
  </div>
</template>
