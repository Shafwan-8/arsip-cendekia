<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PdfDocumentInfo, ImagePdfElement, SignaturePdfElement } from '~/types/pdf-editor'
import type { DocumentCategoryConfig } from '~/types/document'
import { usePdfEditor } from '~/composables/pdf-editor/usePdfEditor'
import { usePdfExport } from '~/composables/pdf-editor/usePdfExport'
import PdfEditorToolbar from './PdfEditorToolbar.vue'
import PdfEditorCanvas from './PdfEditorCanvas.vue'
import PdfSignatureModal from './PdfSignatureModal.vue'

const props = defineProps<{
  document: PdfDocumentInfo
  pdfBytes: ArrayBuffer
  config: DocumentCategoryConfig
}>()

const router = useRouter()

const {
  elements,
  selectedElementId,
  selectedElement,
  selectedTool,
  currentPage,
  totalPages,
  zoom,
  isFitWidth,
  canUndo,
  canRedo,
  hasUnsavedChanges,
  addElement,
  updateElement,
  deleteElement,
  selectElement,
  setTool,
  setPage,
  prevPage,
  nextPage,
  zoomIn,
  zoomOut,
  toggleFitWidth,
  undo,
  redo
} = usePdfEditor()

const { isSaving, exportError, exportAndDownload } = usePdfExport()

// State Modal Tanda Tangan & Konfirmasi Batal
const showSignatureModal = ref(false)
const showCancelConfirmModal = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const saveSuccessToast = ref(false)

// Trigger File Picker untuk Gambar
const triggerImageUpload = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

// Tangani pemilihan file gambar dari komputer pengguna
const handleImageFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  if (!file.type.startsWith('image/')) {
    alert('Harap pilih berkas gambar yang valid (PNG, JPG, atau JPEG).')
    input.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    if (!dataUrl) return

    // Buat objek Image untuk menghitung aspect ratio asli
    const img = new Image()
    img.onload = () => {
      const aspect = img.width / img.height
      const initialWidth = Math.min(220, img.width)
      const initialHeight = Math.round(initialWidth / aspect)

      const newImageElem: ImagePdfElement = {
        id: `img_${Date.now()}`,
        type: 'image',
        page: currentPage.value,
        x: 60,
        y: 80,
        width: initialWidth,
        height: initialHeight,
        dataUrl,
        mimeType: file.type.includes('png') ? 'image/png' : 'image/jpeg',
        aspectRatio: aspect
      }

      addElement(newImageElem)
      setTool('select')
      input.value = ''
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)
}

// Tangani tanda tangan yang dibuat dari modal
const handleSignatureSaved = (dataUrl: string) => {
  const newSignatureElem: SignaturePdfElement = {
    id: `sig_${Date.now()}`,
    type: 'signature',
    page: currentPage.value,
    x: 80,
    y: 100,
    width: 160,
    height: 80,
    dataUrl,
    aspectRatio: 2
  }

  addElement(newSignatureElem)
  setTool('select')
}

// Batal / Keluar
const handleCancelClick = () => {
  if (hasUnsavedChanges.value) {
    showCancelConfirmModal.value = true
  } else {
    navigateBack()
  }
}

const navigateBack = () => {
  router.push({
    path: `${props.config.basePath}/read`,
    query: {
      id: props.document.id,
      title: props.document.title,
      fileName: props.document.fileName,
      file: props.document.fileUrl
    }
  })
}

// Simpan & Ekspor PDF baru
const handleSavePdf = async () => {
  const success = await exportAndDownload({
    originalPdfBytes: props.pdfBytes,
    elements: elements.value,
    originalFileName: props.document.fileName,
    documentTitle: props.document.title
  })

  if (success) {
    saveSuccessToast.value = true
    setTimeout(() => {
      saveSuccessToast.value = false
    }, 4000)
  }
}

// Tangani tombol keyboard Delete
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedElementId.value) {
      e.preventDefault()
      deleteElement()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="flex flex-col bg-[#0b0e14] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl space-y-0">
    <!-- Hidden File Input untuk Unggah Gambar -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png, image/jpeg, image/jpg"
      class="hidden"
      @change="handleImageFileChange"
    />

    <!-- Header Dokumen & Navigasi -->
    <div class="bg-[#0e1117] border-b border-slate-800/90 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center space-x-3">
        <!-- Tombol Kembali / Batal -->
        <button
          type="button"
          class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
          :title="`Kembali ke Pembaca ${config.label}`"
          @click="handleCancelClick"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
              {{ document.title || 'PDF Editor' }}
            </h2>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
              :class="[config.theme.badgeBg, config.theme.badgeText, config.theme.badgeBorder]"
            >
              Editor PDF
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Berkas: <span class="text-slate-300 font-mono">{{ document.fileName }}</span>
            <span v-if="totalPages > 0" class="text-slate-500 ml-2">• <span class="text-slate-300">{{ totalPages }} Halaman</span></span>
            <span v-if="elements.length > 0" class="text-amber-400/90 ml-2">• <span class="font-medium">{{ elements.length }} Perubahan</span></span>
          </p>
        </div>
      </div>
    </div>

    <!-- Error Export Alert jika terjadi kegagalan -->
    <div
      v-if="exportError"
      class="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between px-4"
    >
      <div class="flex items-center space-x-2">
        <span>⚠️</span>
        <span>{{ exportError }}</span>
      </div>
    </div>

    <!-- Success Download Toast -->
    <transition
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="saveSuccessToast"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 px-5 py-3 rounded-2xl text-xs font-semibold shadow-2xl flex items-center space-x-2.5 backdrop-blur-md"
      >
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>PDF berhasil digenerate dan diunduh ke perangkat Anda!</span>
      </div>
    </transition>

    <!-- Toolbar Editor -->
    <PdfEditorToolbar
      :selected-tool="selectedTool"
      :selected-element="selectedElement"
      :can-undo="canUndo"
      :can-redo="canRedo"
      :zoom="zoom"
      :is-fit-width="isFitWidth"
      :is-saving="isSaving"
      :config="config"
      @set-tool="setTool"
      @trigger-image-upload="triggerImageUpload"
      @trigger-signature-modal="showSignatureModal = true"
      @delete-selected="deleteElement()"
      @update-selected="updateElement(selectedElementId!, $event)"
      @undo="undo"
      @redo="redo"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @toggle-fit-width="toggleFitWidth"
      @cancel="handleCancelClick"
      @save="handleSavePdf"
    />

    <!-- Canvas Area Editor -->
    <PdfEditorCanvas
      :pdf-bytes="pdfBytes"
      :current-page="currentPage"
      :zoom="zoom"
      :is-fit-width="isFitWidth"
      :selected-tool="selectedTool"
      :selected-element-id="selectedElementId"
      :elements="elements"
      @update:total-pages="totalPages = $event"
      @add-element="addElement"
      @update-element="updateElement"
      @select-element="selectElement"
    />

    <!-- Bottom Page Navigation Bar -->
    <div class="bg-[#0e121a] border-t border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center space-x-1.5 bg-[#080a0f] border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
        <button
          type="button"
          class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
          :disabled="currentPage <= 1"
          title="Halaman Sebelumnya"
          @click="prevPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span class="font-mono text-slate-300 font-semibold px-1">
          Halaman {{ currentPage }} / {{ totalPages }}
        </span>

        <button
          type="button"
          class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
          :disabled="currentPage >= totalPages"
          title="Halaman Selanjutnya"
          @click="nextPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="flex items-center space-x-2 text-[11px] text-slate-500">
        <span>Tekan <kbd class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">Delete</kbd> untuk menghapus elemen aktif</span>
      </div>
    </div>

    <!-- Modal Tanda Tangan -->
    <PdfSignatureModal
      :show="showSignatureModal"
      @close="showSignatureModal = false"
      @save="handleSignatureSaved"
    />

    <!-- Modal Konfirmasi Batal / Keluar -->
    <div
      v-if="showCancelConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      @click.self="showCancelConfirmModal = false"
    >
      <div class="bg-[#0e1117] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Perubahan Belum Disimpan</h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Anda memiliki {{ elements.length }} perubahan yang belum diunduh. Yakin ingin keluar dari editor?
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            class="px-4 py-2 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-colors"
            @click="showCancelConfirmModal = false"
          >
            Lanjutkan Mengedit
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
            @click="navigateBack"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
