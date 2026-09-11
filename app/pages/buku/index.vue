<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'Koleksi Buku Literatur - Arsip Cendekia'
})

// Definisi Tipe Data Dokumen Buku dari Supabase
export interface BukuItem {
  id: string | number
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
  status: string
  user_id?: string
}

// Inisialisasi Supabase Composable
const { client, user } = useSupabase()

// Helper memastikan ID pengguna aktif
const getActiveUserId = async (): Promise<string | null> => {
  if (user.value?.id) return user.value.id
  if (client) {
    const { data } = await client.auth.getUser()
    if (data?.user?.id) {
      user.value = data.user
      return data.user.id
    }
  }
  return null
}

// State Data Buku dari Supabase
const books = ref<BukuItem[]>([])
const isLoadingBooks = ref(false)
const fetchError = ref('')

// Filter & Pencarian
const searchQuery = ref('')
const sortBy = ref<'latest' | 'oldest' | 'title' | 'size'>('latest')

// Paginasi
const currentPage = ref(1)
const itemsPerPage = ref(5)

// Modal Hapus State
const isDeleteModalOpen = ref(false)
const selectedBookToDelete = ref<BukuItem | null>(null)
const isDeleting = ref(false)

// Toast Alert State
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')
const showToast = ref(false)
let toastTimer: any = null

const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  if (toastTimer) clearTimeout(toastTimer)
  toastMessage.value = msg
  toastType.value = type
  showToast.value = true
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 3500)
}

// Helper untuk mengekstrak path berkas di bucket storage Supabase
const extractStoragePath = (fileUrl: string): string | null => {
  if (!fileUrl) return null
  const marker = '/arsip_pdf/'
  const idx = fileUrl.indexOf(marker)
  if (idx !== -1) {
    const rawPath = fileUrl.substring(idx + marker.length)
    return decodeURIComponent(rawPath.split('?')[0])
  }
  return null
}

// ==========================================
// FORM & MODAL UPLOAD BUKU KE SUPABASE
// ==========================================
const isUploadModalOpen = ref(false)
const isUploading = ref(false)
const uploadErrorMessage = ref('')
const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form Data (Kategori otomatis 'buku', status otomatis 'Pribadi')
const uploadForm = ref({
  title: '',
  author: '',
  publisher: '',
  category: 'buku', // Otomatis disesuaikan dengan halaman buku
  year: new Date().getFullYear(),
  file_name: '',
  file_size: '',
  pages: '' as number | string,
  status: 'Pribadi' // Otomatis value Pribadi
})

const resetUploadForm = () => {
  uploadForm.value = {
    title: '',
    author: '',
    publisher: '',
    category: 'buku',
    year: new Date().getFullYear(),
    file_name: '',
    file_size: '',
    pages: '',
    status: 'Pribadi'
  }
  selectedFile.value = null
  uploadErrorMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const openUploadModal = () => {
  resetUploadForm()
  isUploadModalOpen.value = true
}

const closeUploadModal = () => {
  if (isUploading.value) return
  isUploadModalOpen.value = false
  resetUploadForm()
}

// Format ukuran file bytes ke KB/MB
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Proses seleksi berkas PDF
const processSelectedFile = (file: File) => {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    uploadErrorMessage.value = 'Harap pilih berkas dokumen berformat PDF.'
    return
  }

  uploadErrorMessage.value = ''
  selectedFile.value = file
  uploadForm.value.file_name = file.name
  uploadForm.value.file_size = formatFileSize(file.size)

  // Otomatis isi judul jika belum diisi
  if (!uploadForm.value.title) {
    uploadForm.value.title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processSelectedFile(target.files[0])
  }
}

const onDropFile = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    processSelectedFile(e.dataTransfer.files[0])
  }
}

// Fungsi Submit Upload ke Supabase Storage ("arsip_pdf") & Database ("document")
const handleUploadSubmit = async () => {
  if (!selectedFile.value) {
    uploadErrorMessage.value = 'Silakan pilih atau seret file PDF terlebih dahulu.'
    return
  }

  if (!uploadForm.value.title.trim()) {
    uploadErrorMessage.value = 'Judul dokumen wajib diisi.'
    return
  }

  if (!uploadForm.value.author.trim()) {
    uploadErrorMessage.value = 'Nama penulis / pengarang wajib diisi.'
    return
  }

  if (!uploadForm.value.publisher.trim()) {
    uploadErrorMessage.value = 'Penerbit wajib diisi.'
    return
  }

  if (!uploadForm.value.year) {
    uploadErrorMessage.value = 'Tahun terbit wajib diisi.'
    return
  }

  if (!uploadForm.value.pages) {
    uploadErrorMessage.value = 'Jumlah halaman wajib diisi.'
    return
  }

  isUploading.value = true
  uploadErrorMessage.value = ''

  try {
    const file = selectedFile.value
    // Format nama file unik di Supabase Storage
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `buku/${Date.now()}_${cleanFileName}`

    // 1. Upload berkas ke bucket "arsip_pdf" di Supabase Storage
    const { error: storageError } = await client.storage
      .from('arsip_pdf')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) {
      throw new Error(`Gagal upload berkas ke storage arsip_pdf: ${storageError.message}`)
    }

    // 2. Dapatkan URL berkas dari Storage
    const { data: urlData } = client.storage
      .from('arsip_pdf')
      .getPublicUrl(filePath)

    const filePublicUrl = urlData.publicUrl

    // 3. Dapatkan User ID yang sedang login
    const currentUserId = await getActiveUserId()
    if (!currentUserId) {
      uploadErrorMessage.value = 'Sesi login tidak ditemukan. Silakan login kembali.'
      return
    }

    // 4. Masukkan record data ke tabel "documents" di Supabase
    const newRecord = {
      user_id: currentUserId,
      title: uploadForm.value.title.trim(),
      author: uploadForm.value.author.trim(),
      publisher: uploadForm.value.publisher.trim(),
      category: uploadForm.value.category, // 'buku'
      year: Number(uploadForm.value.year),
      pages: Number(uploadForm.value.pages),
      file_name: uploadForm.value.file_name,
      file_size: uploadForm.value.file_size,
      file_url: filePublicUrl,
      status: uploadForm.value.status, // 'Pribadi'
      uploaded_at: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    const { error: insertError } = await client
      .from('documents')
      .insert([newRecord])

    if (insertError) {
      throw new Error(`Gagal menyimpan data ke tabel documents: ${insertError.message}`)
    }

    // Tutup otomatis modal upload dan tampilkan notifikasi toast sukses
    isUploadModalOpen.value = false
    triggerToast(`Buku "${uploadForm.value.title}" berhasil diunggah!`, 'success')
    resetUploadForm()
    await fetchBooks()
  } catch (err: any) {
    console.error('Upload Error:', err)
    uploadErrorMessage.value = err?.message || 'Terjadi kesalahan saat mengunggah berkas.'
  } finally {
    isUploading.value = false
  }
}

// ==========================================
// FETCH & DELETE DARI SUPABASE
// ==========================================
const fetchBooks = async () => {
  isLoadingBooks.value = true
  fetchError.value = ''

  try {
    if (!client) return

    // Pastikan session sudah ter-sinkronisasi sebelum melakukan query
    const { data: sessionData } = await client.auth.getSession()
    const activeUser = sessionData?.session?.user ?? user.value
    const currentUserId = activeUser?.id

    let query = client
      .from('documents')
      .select('*')
      .eq('category', 'buku')

    // Filter dokumen sesuai user yang sedang login jika ada
    if (currentUserId) {
      query = query.eq('user_id', currentUserId)
    }

    const { data, error } = await query.order('id', { ascending: false })

    if (error) {
      console.error('Error fetching documents table:', error)
      fetchError.value = error.message
    } else if (data) {
      books.value = data
    }
  } catch (err: any) {
    console.error('Fetch error:', err)
    fetchError.value = err?.message || 'Gagal mengambil data dari Supabase.'
  } finally {
    isLoadingBooks.value = false
  }
}

// Filter Data
const filteredBooks = computed(() => {
  return books.value.filter(book => {
    const q = searchQuery.value.toLowerCase()
    return (
      (book.title || '').toLowerCase().includes(q) ||
      (book.author || '').toLowerCase().includes(q) ||
      (book.publisher || '').toLowerCase().includes(q) ||
      (book.file_name || '').toLowerCase().includes(q)
    )
  }).sort((a, b) => {
    if (sortBy.value === 'title') {
      return (a.title || '').localeCompare(b.title || '')
    }
    if (sortBy.value === 'size') {
      return parseFloat(b.file_size || '0') - parseFloat(a.file_size || '0')
    }
    if (sortBy.value === 'oldest') {
      return String(a.id).localeCompare(String(b.id))
    }
    // Default: latest
    return String(b.id).localeCompare(String(a.id))
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

// Aksi Edit: Menuju ke halaman edit dokumen
const handleEdit = (book: BukuItem) => {
  navigateTo({
    path: '/buku/edit',
    query: {
      id: book.id
    }
  })
}

// Aksi Delete
const openDeleteModal = (book: BukuItem) => {
  selectedBookToDelete.value = book
  isDeleteModalOpen.value = true
}

const closeDeleteModal = () => {
  if (isDeleting.value) return
  isDeleteModalOpen.value = false
  selectedBookToDelete.value = null
}

const confirmDelete = async () => {
  if (!selectedBookToDelete.value) return
  isDeleting.value = true

  try {
    const bookToDelete = selectedBookToDelete.value
    const bookTitle = bookToDelete.title
    const currentUserId = await getActiveUserId()

    // 1. Hapus berkas fisik PDF dari Supabase Storage (bucket "arsip_pdf")
    if (bookToDelete.file_url) {
      const storagePath = extractStoragePath(bookToDelete.file_url)
      if (storagePath) {
        const { error: storageError } = await client.storage
          .from('arsip_pdf')
          .remove([storagePath])

        if (storageError) {
          console.warn('Gagal menghapus file dari storage arsip_pdf:', storageError.message)
        }
      }
    }

    // 2. Hapus data record dari tabel "documents"
    let deleteQuery = client
      .from('documents')
      .delete()
      .eq('id', bookToDelete.id)

    if (currentUserId) {
      deleteQuery = deleteQuery.eq('user_id', currentUserId)
    }

    const { error: dbError } = await deleteQuery

    if (dbError) {
      throw dbError
    }

    // 3. Tutup otomatis modal konfirmasi delete
    isDeleteModalOpen.value = false
    selectedBookToDelete.value = null

    // 4. Tampilkan notifikasi toast sukses
    triggerToast(`Buku "${bookTitle}" dan berkas PDF berhasil dihapus!`, 'success')

    // 5. Muat ulang daftar buku terbaru
    await fetchBooks()
  } catch (err: any) {
    console.error('Delete error:', err)
    triggerToast('Gagal menghapus: ' + err.message, 'error')
  } finally {
    isDeleting.value = false
  }
}

// Fetch data saat halaman pertama kali dimuat
onMounted(() => {
  fetchBooks()
})
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
          Daftar buku literatur yang telah Anda upload secara pribadi ke Supabase (tabel <code class="text-rose-400 font-mono">documents</code>).
        </p>
      </div>

      <div>
        <!-- Tombol Buka Modal Upload Buku -->
        <button
          type="button"
          @click="openUploadModal"
          class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-rose-500/20 flex items-center space-x-2 flex-shrink-0 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Upload Buku Baru</span>
        </button>
      </div>
    </div>

    <!-- Banner Notifikasi Error Ambil Data -->
    <div
      v-if="fetchError"
      class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <span>⚠️</span>
        <span>Gagal memuat data dari Supabase: {{ fetchError }}</span>
      </div>
      <button
        @click="fetchBooks"
        class="text-xs underline font-semibold hover:text-white cursor-pointer"
      >
        Coba Lagi
      </button>
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

        <!-- Sorting Dropdown & Refresh -->
        <div class="flex items-center space-x-2.5">
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

          <button
            type="button"
            @click="fetchBooks"
            :disabled="isLoadingBooks"
            class="p-2.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Muat Ulang Data"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'animate-spin text-rose-400': isLoadingBooks }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
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
              <th class="py-3.5 px-4 text-center w-24">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <!-- Loading State -->
            <tr v-if="isLoadingBooks && books.length === 0">
              <td colspan="6" class="py-12 text-center">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <svg class="animate-spin h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <p class="text-xs text-slate-400">Menghubungkan ke Supabase & memuat daftar buku...</p>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="filteredBooks.length === 0">
              <td colspan="6" class="py-12 text-center">
                <div class="max-w-sm mx-auto space-y-3">
                  <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-white">Belum ada buku di Supabase</p>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Belum ada data dokumen kategori buku. Klik tombol di bawah untuk mengunggah buku pertama Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="openUploadModal"
                    class="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <span>+ Upload Buku Baru</span>
                  </button>
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
                {{ book.uploaded_at || '-' }}
              </td>

              <!-- Tombol Aksi (Icon Saja: Read, Delete) -->
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
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- 2. Tombol Edit (Icon Saja) -->
                  <button
                    type="button"
                    @click="handleEdit(book)"
                    title="Edit Informasi Dokumen"
                    aria-label="Edit Dokumen"
                    class="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <!-- 3. Tombol Delete (Icon Saja) -->
                  <button
                    type="button"
                    @click="openDeleteModal(book)"
                    title="Hapus Buku dari Arsip"
                    aria-label="Hapus Buku"
                    class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  >
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

    <!-- ============================================================ -->
    <!-- MODAL FORM UPLOAD BUKU KE SUPABASE (STORAGE & TABLE DOCUMENT) -->
    <!-- PERINGATAN: MODAL HANYA BISA DITUTUP MELALUI TOMBOL X DI TEPI -->
    <!-- ============================================================ -->
    <div
      v-if="isUploadModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <!-- Container Modal (Klik backdrop TIDAK menutup modal) -->
      <div
        class="relative w-full max-w-2xl bg-[#0e1117] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn"
      >
        <!-- Header Modal & Tombol X Tutup Modal -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/90 bg-[#0d1015]">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">
                Upload Buku ke Arsip
              </h3>
            </div>
          </div>

          <!-- SATU-SATUNYA TOMBOL UNTUK MENUTUP MODAL (SIMBOL X) -->
          <button
            type="button"
            @click="closeUploadModal"
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex-shrink-0"
            title="Tutup Modal"
            aria-label="Tutup Modal"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body Form Modal (Scrollable) -->
        <div class="overflow-y-auto p-6 space-y-5">
          <!-- Alert Error Upload -->
          <div
            v-if="uploadErrorMessage"
            class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn"
          >
            <svg class="w-4 h-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{{ uploadErrorMessage }}</span>
          </div>

          <form id="uploadBookForm" @submit.prevent="handleUploadSubmit" class="space-y-4">
            <!-- 1. Input Hidden User ID, Kategori & Status (Otomatis) -->
            <input type="hidden" name="user_id" :value="user?.id" />
            <input type="hidden" name="category" :value="uploadForm.category" />
            <input type="hidden" name="status" :value="uploadForm.status" />
            <input type="hidden" name="file_name" :value="uploadForm.file_name" />
            <input type="hidden" name="file_size" :value="uploadForm.file_size" />

            <!-- 2. Area Drag & Drop Berkas PDF / Browse Manual -->
            <div class="space-y-1.5">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Berkas PDF Dokumen <span class="text-rose-400">*</span>
              </label>

              <!-- Drag and Drop Box -->
              <div
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDropFile"
                :class="[
                  'relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2',
                  isDragging
                    ? 'border-rose-500 bg-rose-500/5 scale-[1.01]'
                    : selectedFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-800 hover:border-slate-700 bg-[#090b0e]'
                ]"
                @click="fileInputRef?.click()"
              >
                <!-- Hidden Native Input -->
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="application/pdf,.pdf"
                  class="hidden"
                  @change="onFileChange"
                />

                <!-- Jika Berkas Terpilih -->
                <div v-if="selectedFile" class="flex flex-col items-center space-y-2">
                  <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-white truncate max-w-sm">
                      {{ selectedFile.name }}
                    </p>
                    <p class="text-[11px] text-slate-400">
                      Ukuran: <span class="text-emerald-400 font-mono">{{ uploadForm.file_size }}</span> • Format: PDF
                    </p>
                  </div>
                  <span class="text-[11px] text-rose-400 hover:underline">
                    Klik untuk mengganti file
                  </span>
                </div>

                <!-- Jika Belum Memilih Berkas -->
                <div v-else class="flex flex-col items-center space-y-2">
                  <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div class="space-y-0.5">
                    <p class="text-xs font-semibold text-white">
                      Tarik & lepas file PDF ke sini, atau <span class="text-rose-400 underline">cari berkas manual</span>
                    </p>
                    <p class="text-[11px] text-slate-500">
                      Mendukung format berkas .PDF
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3. Text Judul File / Buku -->
            <div class="space-y-1.5">
              <label for="docTitle" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Judul File / Buku <span class="text-rose-400">*</span>
              </label>
              <input
                id="docTitle"
                v-model="uploadForm.title"
                type="text"
                required
                placeholder="Contoh: Metodologi Penelitian Kearsipan Digital"
                class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            <!-- 4. Penulis & Penerbit -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="docAuthor" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Penulis / Pengarang <span class="text-rose-400">*</span>
                </label>
                <input
                  id="docAuthor"
                  v-model="uploadForm.author"
                  type="text"
                  required
                  placeholder="Contoh: Dr. Ir. Ahmad Dahlan"
                  class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div class="space-y-1.5">
                <label for="docPublisher" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Penerbit <span class="text-rose-400">*</span>
                </label>
                <input
                  id="docPublisher"
                  v-model="uploadForm.publisher"
                  type="text"
                  required
                  placeholder="Contoh: Cendekia Pustaka Utama"
                  class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <!-- 5. Tahun Terbit & Halaman -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="docYear" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tahun Terbit <span class="text-rose-400">*</span>
                </label>
                <input
                  id="docYear"
                  v-model="uploadForm.year"
                  type="number"
                  min="1900"
                  max="2100"
                  required
                  placeholder="Contoh: 2026"
                  class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div class="space-y-1.5">
                <label for="docPages" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Jumlah Halaman <span class="text-rose-400">*</span>
                </label>
                <input
                  id="docPages"
                  v-model="uploadForm.pages"
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 284"
                  class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </form>
        </div>

        <!-- Footer Modal (Tombol Submit) -->
        <div class="p-4 sm:p-6 border-t border-slate-800/90 bg-[#0d1015] flex items-center justify-end space-x-3">
          <button
            type="submit"
            form="uploadBookForm"
            :disabled="isUploading || !selectedFile"
            class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-rose-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <svg v-if="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isUploading ? 'Mengunggah...' : 'Kirim Berkas' }}</span>
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
            Apakah Anda yakin ingin menghapus buku <strong class="text-white">"{{ selectedBookToDelete?.title }}"</strong> dari database? Tindakan ini tidak dapat dibatalkan.
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
            :disabled="isDeleting"
            @click="confirmDelete"
            class="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-sm shadow-rose-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <svg v-if="isDeleting" class="animate-spin -ml-0.5 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>{{ isDeleting ? 'Menghapus...' : 'Ya, Hapus Buku' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Toast Notification (Z-index tinggi agar selalu di atas modal) -->
    <transition
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-3 opacity-0 sm:translate-y-0 sm:translate-x-3"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showToast"
        class="fixed bottom-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-medium max-w-sm"
        :class="[
          toastType === 'success' ? 'bg-[#0d1017]/95 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10' : '',
          toastType === 'error' ? 'bg-[#0d1017]/95 border-rose-500/40 text-rose-300 shadow-rose-500/10' : '',
          toastType === 'info' ? 'bg-[#0d1017]/95 border-slate-700 text-slate-200' : ''
        ]"
      >
        <div
          class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          :class="toastType === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'"
        >
          <svg v-if="toastType === 'success'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span class="leading-relaxed flex-1">{{ toastMessage }}</span>
        <button
          type="button"
          @click="showToast = false"
          class="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>