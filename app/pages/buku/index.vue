<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: 'Koleksi Buku Literatur - Arsip Cendekia'
})

// Definisi Tipe Data Buku untuk Supabase
export interface BukuItem {
  id: string
  title: string
  author: string
  publisher: string
  category: string
  year: number | string
  file_name: string
  file_size: string
  file_url: string
  pages: number
  uploaded_at: string
  status: 'Pribadi' | 'Publik'
}

// Data sementara (Mock Data) yang disiapkan untuk integrasi Supabase Storage & Database
const books = ref<BukuItem[]>([
  {
    id: 'bk-001',
    title: 'Metodologi Penelitian Kearsipan & Dokumentasi Digital',
    author: 'Prof. Dr. Ir. H. Ahmad Dahlan, M.Sc.',
    publisher: 'Cendekia Pustaka Utama',
    category: 'Pendidikan',
    year: 2024,
    file_name: 'metodologi-penelitian-kearsipan.pdf',
    file_size: '4.8 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 284,
    uploaded_at: '10 Mar 2026',
    status: 'Pribadi'
  },
  {
    id: 'bk-002',
    title: 'Arsitektur Sistem Terdistribusi dan Komputasi Awan Modern',
    author: 'Dr. Raden Mas Sudirman, S.T., M.Kom.',
    publisher: 'Informatika Press',
    category: 'Teknologi',
    year: 2025,
    file_name: 'arsitektur-komputasi-awan.pdf',
    file_size: '6.2 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 352,
    uploaded_at: '08 Mar 2026',
    status: 'Pribadi'
  },
  {
    id: 'bk-003',
    title: 'Manajemen Tata Kelola Rekam Medis & Arsip Rumah Sakit',
    author: 'dr. Siti Rahmawati, Sp.A., M.Kes.',
    publisher: 'Penerbit Salemba Medika',
    category: 'Sains',
    year: 2023,
    file_name: 'tata-kelola-rekam-medis.pdf',
    file_size: '3.5 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 198,
    uploaded_at: '05 Mar 2026',
    status: 'Pribadi'
  },
  {
    id: 'bk-004',
    title: 'Hukum Hak Cipta dan Kekayaan Intelektual di Era AI',
    author: 'Bambang Hartono, S.H., LL.M.',
    publisher: 'Genta Presindo',
    category: 'Hukum',
    year: 2025,
    file_name: 'hukum-kekayaan-intelektual-ai.pdf',
    file_size: '2.9 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 240,
    uploaded_at: '01 Mar 2026',
    status: 'Pribadi'
  },
  {
    id: 'bk-005',
    title: 'Kecerdasan Buatan dan Penerapan Natural Language Processing',
    author: 'Ahmad Fauzi, Ph.D. & Tim Riset AI',
    publisher: 'Andi Publisher',
    category: 'Teknologi',
    year: 2026,
    file_name: 'nlp-indonesia-dan-deep-learning.pdf',
    file_size: '7.1 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 410,
    uploaded_at: '25 Feb 2026',
    status: 'Pribadi'
  },
  {
    id: 'bk-006',
    title: 'Strategi Pengelolaan Keuangan Publik dan Kebijakan Fiskal',
    author: 'Sri Mulyani Nurul, S.E., M.Ec.',
    publisher: 'Erlangga Akademik',
    category: 'Ekonomi',
    year: 2024,
    file_name: 'kebijakan-fiskal-publik.pdf',
    file_size: '5.4 MB',
    file_url: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
    pages: 318,
    uploaded_at: '18 Feb 2026',
    status: 'Pribadi'
  }
])

// Filter & Pencarian
const searchQuery = ref('')
const selectedCategory = ref('Semua')
const sortBy = ref<'latest' | 'oldest' | 'title' | 'size'>('latest')

// Paginasi
const currentPage = ref(1)
const itemsPerPage = ref(5)

// Modal Hapus State
const isDeleteModalOpen = ref(false)
const selectedBookToDelete = ref<BukuItem | null>(null)

// Toast Alert State
const toastMessage = ref('')
const showToast = ref(false)

const triggerToast = (msg: string) => {
  toastMessage.value = msg
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// Kategori unik yang tersedia
const categories = computed(() => {
  const cats = new Set<string>()
  books.value.forEach(b => cats.add(b.category))
  return ['Semua', ...Array.from(cats)]
})

// Filter Data
const filteredBooks = computed(() => {
  return books.value.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.publisher.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      book.file_name.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory =
      selectedCategory.value === 'Semua' || book.category === selectedCategory.value

    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    if (sortBy.value === 'title') {
      return a.title.localeCompare(b.title)
    }
    if (sortBy.value === 'size') {
      return parseFloat(b.file_size) - parseFloat(a.file_size)
    }
    if (sortBy.value === 'oldest') {
      return a.id.localeCompare(b.id)
    }
    // Default: latest
    return b.id.localeCompare(a.id)
  })
})

// Total Halaman
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredBooks.value.length / itemsPerPage.value))
})

// Data Halaman Aktif
const paginatedBooks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredBooks.value.slice(start, start + itemsPerPage.value)
})

// Range index item
const startItemIndex = computed(() => {
  if (filteredBooks.value.length === 0) return 0
  return (currentPage.value - 1) * itemsPerPage.value + 1
})

const endItemIndex = computed(() => {
  return Math.min(currentPage.value * itemsPerPage.value, filteredBooks.value.length)
})

// Navigasi Paginasi
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reset page ketika search/filter berubah
const handleFilterChange = () => {
  currentPage.value = 1
}


// Aksi Read: Menuju ke halaman read yang akan menampilkan PDF viewer
const handleRead = (book: BukuItem) => {
  navigateTo({
    path: '/buku/read',
    query: {
      id: book.id,
      title: book.title,
      file: book.file_url,
      fileName: book.file_name
    }
  })
}

// Aksi Update/Edit: Menuju ke halaman edit dokumen
const handleEdit = (book: BukuItem) => {
  navigateTo({
    path: '/buku/edit',
    query: {
      id: book.id
    }
  })
}

// Aksi Delete: Buka dialog konfirmasi
const openDeleteModal = (book: BukuItem) => {
  selectedBookToDelete.value = book
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false
  selectedBookToDelete.value = null
}

const confirmDelete = () => {
  if (selectedBookToDelete.value) {
    const bookTitle = selectedBookToDelete.value.title
    books.value = books.value.filter(b => b.id !== selectedBookToDelete.value?.id)
    closeDeleteModal()
    triggerToast(`Buku "${bookTitle}" berhasil dihapus dari arsip`)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Buku Literatur
          </h2>
          <span class="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {{ books.length }} Dokumen
          </span>
        </div>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Daftar buku literatur yang telah Anda upload secara pribadi ke dalam repositori sistem.
        </p>
      </div>

      <div>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-rose-500/20 flex items-center space-x-2 flex-shrink-0 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Buku Baru</span>
        </button>
      </div>
    </div>

    <!-- Filter & Toolbar Bar -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Input Pencarian -->
        <div class="relative flex-1">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari judul buku, penulis, penerbit, atau nama file..."
            @input="handleFilterChange"
            class="w-full pl-10 pr-4 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        <!-- Filter Kategori & Sorting -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Kategori Dropdown -->
          <div class="relative">
            <select
              v-model="selectedCategory"
              @change="handleFilterChange"
              class="appearance-none pl-3.5 pr-8 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs font-medium text-slate-200 focus:outline-none transition-colors cursor-pointer"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat === 'Semua' ? 'Semua Kategori' : cat }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Urutan Dropdown -->
          <div class="relative">
            <select
              v-model="sortBy"
              class="appearance-none pl-3.5 pr-8 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs font-medium text-slate-200 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="latest">Terbaru Diupload</option>
              <option value="oldest">Terlama Diupload</option>
              <option value="title">Judul (A - Z)</option>
              <option value="size">Ukuran Terbesar</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Datatable Section -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-400 border-b border-slate-800/90 bg-[#0d1015] uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-4 w-12 text-center">No</th>
              <th class="py-3.5 px-4">Informasi Buku</th>
              <th class="py-3.5 px-4">Tahun & Halaman</th>
              <th class="py-3.5 px-4">Berkas PDF</th>
              <th class="py-3.5 px-4">Waktu Upload</th>
              <th class="py-3.5 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <!-- Empty State -->
            <tr v-if="filteredBooks.length === 0">
              <td colspan="6" class="py-12 text-center">
                <div class="max-w-sm mx-auto space-y-2">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-white">Tidak ada buku ditemukan</p>
                  <p class="text-xs text-slate-400">
                    Coba sesuaikan kata kunci pencarian atau ganti filter kategori Anda.
                  </p>
                </div>
              </td>
            </tr>

            <!-- Baris Data Buku -->
            <tr
              v-for="(book, index) in paginatedBooks"
              :key="book.id"
              class="hover:bg-slate-900/40 transition-colors group"
            >
              <!-- Nomor Urut -->
              <td class="py-4 px-4 text-center font-mono text-slate-500 text-[11px]">
                {{ (currentPage - 1) * itemsPerPage + index + 1 }}
              </td>

              <!-- Detail Buku (Judul, Penulis, Penerbit) -->
              <td class="py-4 px-4 max-w-sm">
                <div class="flex items-start space-x-3">
                  <!-- Cover Thumbnail / Icon Badge -->
                  <div class="w-9 h-11 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center text-rose-400 shadow-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-white line-clamp-1 group-hover:text-rose-400 transition-colors" :title="book.title">
                      {{ book.title }}
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                      ✍️ {{ book.author }}
                    </div>
                    <div class="text-[10px] text-slate-500 truncate">
                      🏢 {{ book.publisher }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Tahun & Jumlah Halaman -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="text-slate-200 font-medium">{{ book.year }}</div>
                <div class="text-[11px] text-slate-500">{{ book.pages }} Halaman</div>
              </td>

              <!-- Berkas PDF & Ukuran -->
              <td class="py-4 px-4 whitespace-nowrap">
                <div class="flex items-center space-x-1.5 text-slate-300">
                  <span class="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold font-mono">
                    PDF
                  </span>
                  <span class="text-xs font-medium">{{ book.file_size }}</span>
                </div>
                <div class="text-[10px] text-slate-500 truncate max-w-[160px]" :title="book.file_name">
                  {{ book.file_name }}
                </div>
              </td>

              <!-- Waktu Upload -->
              <td class="py-4 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                {{ book.uploaded_at }}
              </td>

              <!-- Tombol Aksi (Icon Saja: Read, Update/Edit, Delete) -->
              <td class="py-4 px-4 text-center whitespace-nowrap">
                <div class="inline-flex items-center justify-center space-x-1.5">
                  <!-- 1. Tombol Read (Icon Saja) -->
                  <button
                    type="button"
                    @click="handleRead(book)"
                    title="Baca Buku (PDF Viewer)"
                    aria-label="Baca Buku"
                    class="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <!-- Eye Icon -->
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- 2. Tombol Delete (Icon Saja) -->
                  <button
                    type="button"
                    @click="openDeleteModal(book)"
                    title="Hapus Buku dari Arsip"
                    aria-label="Hapus Buku"
                    class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <!-- Trash Icon -->
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800/90 text-xs text-slate-400 bg-[#0c0e12]">
        <div>
          Menampilkan <span class="text-white font-medium">{{ startItemIndex }} - {{ endItemIndex }}</span> dari <span class="text-white font-medium">{{ filteredBooks.length }}</span> buku
        </div>

        <div class="flex items-center space-x-2">
          <!-- Tombol Prev -->
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
            class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Sebelumnya</span>
          </button>

          <!-- Nomor Halaman -->
          <div class="flex items-center space-x-1">
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              @click="goToPage(page)"
              :class="[
                'w-8 h-8 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                currentPage === page
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                  : 'bg-[#090b0e] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              ]"
            >
              {{ page }}
            </button>
          </div>

          <!-- Tombol Next -->
          <button
            type="button"
            :disabled="currentPage === totalPages || totalPages === 0"
            @click="goToPage(currentPage + 1)"
            class="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>Berikutnya</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Konfirmasi Hapus Buku -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity"
    >
      <div class="w-full max-w-md bg-[#0e1117] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div class="text-center space-y-1">
          <h3 class="text-base font-bold text-white">Hapus Buku Literatur?</h3>
          <p class="text-xs text-slate-400">
            Apakah Anda yakin ingin menghapus buku <strong class="text-white">"{{ selectedBookToDelete?.title }}"</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div class="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
          <div class="flex justify-between">
            <span>Penulis:</span>
            <span class="text-slate-300 font-medium">{{ selectedBookToDelete?.author }}</span>
          </div>
          <div class="flex justify-between">
            <span>Berkas:</span>
            <span class="text-rose-400 font-mono">{{ selectedBookToDelete?.file_name }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-3 pt-2">
          <button
            type="button"
            @click="closeDeleteModal"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-[#090b0e] text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="confirmDelete"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors shadow-sm shadow-rose-500/20 cursor-pointer"
          >
            Ya, Hapus Buku
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div
      v-if="showToast"
      class="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-xl text-xs"
    >
      <span class="text-emerald-400">✓</span>
      <span>{{ toastMessage }}</span>
    </div>
  </div>
</template>