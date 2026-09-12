<script setup lang="ts">
import { onMounted } from 'vue'
import type { DocumentItem, DocumentCategoryConfig } from '~/types/document'

const props = defineProps<{
  config: DocumentCategoryConfig
}>()

// 1. Inisialisasi useDocuments
const {
  documents,
  isLoading,
  error,
  fetchDocuments,
  getActiveUserId
} = useDocuments({
  category: props.config.category
})

// 2. Inisialisasi Toast
const {
  toastMessage,
  toastType,
  showToast,
  triggerToast,
  hideToast
} = useToast()

// 3. Inisialisasi Filter & Pencarian
const {
  searchQuery,
  sortBy,
  filteredDocuments
} = useDocumentFilter(documents)

// 4. Inisialisasi Paginasi
const {
  currentPage,
  itemsPerPage,
  totalPages,
  paginatedDocuments,
  startItemIndex,
  endItemIndex,
  goToPage,
  resetPage
} = useDocumentPagination(filteredDocuments, 5)

// Reset halaman paginasi jika pencarian / filter berubah
const onFilterChange = () => {
  resetPage()
}

// 5. Inisialisasi Upload
const {
  uploadForm,
  selectedFile,
  isUploading,
  uploadErrorMessage,
  isDragging,
  isUploadModalOpen,
  openUploadModal,
  closeUploadModal,
  onFileChange,
  onDropFile,
  handleUploadSubmit
} = useDocumentUpload({
  category: props.config.category,
  storageFolder: props.config.storageFolder,
  getActiveUserId,
  onSuccess: async (title: string) => {
    triggerToast(`${props.config.label} "${title}" berhasil diunggah!`, 'success')
    await fetchDocuments()
  }
})

// 6. Inisialisasi Delete
const {
  isDeleteModalOpen,
  selectedDocumentToDelete,
  isDeleting,
  openDeleteModal,
  closeDeleteModal,
  confirmDelete
} = useDocumentDelete({
  getActiveUserId,
  onSuccess: async (title: string) => {
    triggerToast(`${props.config.label} "${title}" dan berkas PDF berhasil dihapus!`, 'success')
    await fetchDocuments()
  },
  onError: (msg: string) => {
    triggerToast('Gagal menghapus: ' + msg, 'error')
  }
})

// 7. Navigasi Aksi Read
const handleRead = (doc: DocumentItem) => {
  navigateTo({
    path: `${props.config.basePath}/read`,
    query: {
      id: doc.id,
      title: doc.title,
      file: doc.file_url,
      fileName: doc.file_name
    }
  })
}

// 8. Navigasi Aksi Edit
const handleEdit = (doc: DocumentItem) => {
  navigateTo({
    path: `${props.config.basePath}/edit`,
    query: {
      id: doc.id
    }
  })
}

// Ambil data pertama kali saat mount
onMounted(() => {
  fetchDocuments()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <DocumentHeader
      :title="config.headerTitle"
      :count="documents.length"
      :description="config.headerDescription"
      :upload-btn-text="config.uploadBtnText"
      :theme="config.theme"
      @upload="openUploadModal"
    />

    <!-- Banner Notifikasi Error Ambil Data -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <span>⚠️</span>
        <span>Gagal memuat data dari Supabase: {{ error }}</span>
      </div>
      <button
        @click="fetchDocuments"
        class="text-xs underline font-semibold hover:text-white cursor-pointer"
      >
        Coba Lagi
      </button>
    </div>

    <!-- Filter & Toolbar Bar -->
    <DocumentToolbar
      v-model:search-query="searchQuery"
      v-model:sort-by="sortBy"
      :is-loading="isLoading"
      :placeholder="config.searchPlaceholder"
      :theme="config.theme"
      @refresh="fetchDocuments"
      @change="onFilterChange"
    />

    <!-- Datatable Section -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl overflow-hidden shadow-sm">
      <DocumentTable
        :documents="paginatedDocuments"
        :total-raw-documents="documents.length"
        :total-filtered-documents="filteredDocuments.length"
        :is-loading="isLoading"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :empty-title="config.emptyTitle"
        :empty-description="config.emptyDescription"
        :upload-btn-text="config.uploadBtnText"
        :theme="config.theme"
        @read="handleRead"
        @edit="handleEdit"
        @delete="openDeleteModal"
        @upload="openUploadModal"
      />

      <!-- Pagination Footer -->
      <DocumentPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :start-item-index="startItemIndex"
        :end-item-index="endItemIndex"
        :total-items="filteredDocuments.length"
        :item-label="config.pluralLabel.toLowerCase()"
        :theme="config.theme"
        @page-change="goToPage"
      />
    </div>

    <!-- Modal Form Upload -->
    <DocumentUploadModal
      :is-open="isUploadModalOpen"
      :is-uploading="isUploading"
      :error-message="uploadErrorMessage"
      :is-dragging="isDragging"
      :selected-file="selectedFile"
      :form="uploadForm"
      :config="config"
      @close="closeUploadModal"
      @submit="handleUploadSubmit"
      @file-change="onFileChange"
      @drop-file="onDropFile"
      @drag-over="isDragging = true"
      @drag-leave="isDragging = false"
    />

    <!-- Modal Konfirmasi Hapus -->
    <DocumentDeleteModal
      :is-open="isDeleteModalOpen"
      :is-deleting="isDeleting"
      :document="selectedDocumentToDelete"
      :config="config"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />

    <!-- Floating Toast Notification -->
    <DocumentToast
      :show="showToast"
      :message="toastMessage"
      :type="toastType"
      @close="hideToast"
    />
  </div>
</template>
