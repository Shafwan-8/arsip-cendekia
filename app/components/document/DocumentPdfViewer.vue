<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { extractStoragePath } from '~/utils/document'
import type { DocumentCategoryConfig } from '~/types/document'
import type { DocumentChapter, ExtractionStatus } from '~/types/documentChapter'
import PdfChapterSidebar from './pdf/PdfChapterSidebar.vue'

const props = withDefaults(
  defineProps<{
    fileUrl: string
    fileName?: string
    config?: DocumentCategoryConfig
    documentId?: string | number
    chapters?: DocumentChapter[]
    isExtracting?: boolean
    isLoadingChapters?: boolean
    extractionStatus?: ExtractionStatus
    chaptersErrorMessage?: string
  }>(),
  {
    fileName: '',
    chapters: () => [],
    isExtracting: false,
    isLoadingChapters: false,
    extractionStatus: 'pending',
    chaptersErrorMessage: ''
  }
)

const emit = defineEmits<{
  (e: 'loaded', totalPages: number): void
  (e: 'error', errorMsg: string): void
  (e: 'retryExtract'): void
  (e: 'pageChange', page: number): void
}>()

// State Sidebar BAB
const isSidebarOpen = ref(true)

// State Viewer
const isLoading = ref(true)
const loadingProgress = ref(0)
const errorMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1.2)
const isFitWidth = ref(false)
const isFullscreen = ref(false)
const pageInput = ref('1')
const copiedToast = ref(false)

// DOM Refs
const viewerContainerRef = ref<HTMLDivElement | null>(null)
const pageContainerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const textLayerRef = ref<HTMLDivElement | null>(null)

// PDF.js internal instances
let pdfDoc: any = null
let pdfjsLib: any = null
let currentRenderTask: any = null

// Supabase client for storage fallback
const { client } = useSupabase()

/**
 * Inisialisasi library pdf.js secara client-side
 */
const initPdfJs = async () => {
  if (typeof window === 'undefined') return

  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    // Set worker local dari /public atau CDN fallback
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }
  }
}

/**
 * Memuat dokumen PDF dari URL atau Supabase Storage fallback
 */
const loadPdf = async () => {
  if (!props.fileUrl) {
    errorMessage.value = 'URL berkas PDF tidak ditemukan.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  loadingProgress.value = 0

  try {
    await initPdfJs()

    if (!pdfjsLib) {
      throw new Error('Gagal memuat pustaka PDF.js')
    }

    let loadingTask: any = null

    try {
      // 1. Coba load langsung via URL
      loadingTask = pdfjsLib.getDocument({
        url: props.fileUrl,
        withCredentials: false
      })

      loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
        if (progressData.total > 0) {
          loadingProgress.value = Math.round((progressData.loaded / progressData.total) * 100)
        }
      }

      pdfDoc = await loadingTask.promise
    } catch (urlErr: any) {
      console.warn('Gagal memuat langsung via URL, mencoba unduh dari Supabase Storage:', urlErr)

      // 2. Fallback: Unduh via Supabase Storage client jika direct URL terhalang CORS
      const storagePath = extractStoragePath(props.fileUrl)
      if (storagePath && client) {
        const { data: blobData, error: downloadError } = await client.storage
          .from('arsip_pdf')
          .download(storagePath)

        if (downloadError || !blobData) {
          throw new Error(downloadError?.message || 'Gagal mengunduh berkas dari storage.')
        }

        const arrayBuffer = await blobData.arrayBuffer()
        loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        pdfDoc = await loadingTask.promise
      } else {
        throw urlErr
      }
    }

    totalPages.value = pdfDoc.numPages
    currentPage.value = 1
    pageInput.value = '1'
    emit('loaded', pdfDoc.numPages)

    await nextTick()
    await renderCurrentPage()
  } catch (err: any) {
    console.error('Error saat membaca PDF:', err)
    errorMessage.value = err?.message || 'Gagal memproses berkas PDF. Pastikan format berkas valid.'
    emit('error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

/**
 * Render halaman saat ini (Canvas + TextLayer untuk seleksi & copy)
 */
const renderCurrentPage = async () => {
  if (!pdfDoc || !canvasRef.value || !textLayerRef.value) return

  try {
    const page = await pdfDoc.getPage(currentPage.value)

    // Batalkan task render sebelumnya jika masih berjalan
    if (currentRenderTask) {
      try {
        currentRenderTask.cancel()
      } catch {}
      currentRenderTask = null
    }

    // Hitung viewport sesuai scale
    let currentScale = scale.value

    // Jika mode Fit Width aktif, sesuaikan dengan lebar kontainer pembaca
    if (isFitWidth.value && viewerContainerRef.value) {
      const containerWidth = viewerContainerRef.value.clientWidth - 48 // padding
      const unscaledViewport = page.getViewport({ scale: 1 })
      currentScale = Math.max(0.6, Math.min(2.5, containerWidth / unscaledViewport.width))
      scale.value = Number(currentScale.toFixed(2))
    }

    const viewport = page.getViewport({ scale: currentScale })
    const outputScale = window.devicePixelRatio || 1

    const canvas = canvasRef.value
    const canvasContext = canvas.getContext('2d', { alpha: false })
    if (!canvasContext) return

    // Sesuaikan resolusi canvas untuk layar retina / HiDPI
    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = `${Math.floor(viewport.width)}px`
    canvas.style.height = `${Math.floor(viewport.height)}px`

    // Sesuaikan ukuran pembungkus page
    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = `${Math.floor(viewport.width)}px`
      pageContainerRef.value.style.height = `${Math.floor(viewport.height)}px`
    }

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

    // 1. Render gambar halaman ke Canvas
    const renderContext = {
      canvasContext,
      viewport,
      transform
    }

    currentRenderTask = page.render(renderContext)
    await currentRenderTask.promise

    // 2. Render TextLayer agar teks dapat di-select & copy
    const textLayerContainer = textLayerRef.value
    textLayerContainer.innerHTML = ''
    textLayerContainer.style.width = `${Math.floor(viewport.width)}px`
    textLayerContainer.style.height = `${Math.floor(viewport.height)}px`
    textLayerContainer.style.setProperty('--scale-factor', `${currentScale}`)
    textLayerContainer.style.setProperty('--total-scale-factor', `${currentScale}`)

    const textContent = await page.getTextContent()

    if (pdfjsLib?.TextLayer) {
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerContainer,
        viewport
      })
      await textLayer.render()
    }
  } catch (err: any) {
    if (err?.name === 'RenderingCancelledException') {
      // Pembatalan render normal saat berpindah halaman/zoom dengan cepat
      return
    }
    console.error('Error saat render halaman PDF:', err)
  }
}

// Navigasi Halaman & BAB
const goToPage = async (pageNumber: number) => {
  const p = Math.max(1, Math.min(totalPages.value || 9999, pageNumber))
  if (p !== currentPage.value) {
    currentPage.value = p
    pageInput.value = String(p)
    await renderCurrentPage()
    emit('pageChange', p)
  }
}

const goToChapter = async (chapter: DocumentChapter) => {
  if (chapter && chapter.nomor_halaman) {
    await goToPage(chapter.nomor_halaman)
  }
}

// Menentukan BAB aktif berdasarkan nomor halaman saat ini
const activeChapter = computed<DocumentChapter | null>(() => {
  if (!props.chapters || props.chapters.length === 0) return null
  const p = currentPage.value
  for (let i = 0; i < props.chapters.length; i++) {
    const cur = props.chapters[i]
    const next = props.chapters[i + 1]
    if (p >= cur.nomor_halaman && (!next || p < next.nomor_halaman)) {
      return cur
    }
  }
  return null
})

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    pageInput.value = String(currentPage.value)
    await renderCurrentPage()
    emit('pageChange', currentPage.value)
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    pageInput.value = String(currentPage.value)
    await renderCurrentPage()
    emit('pageChange', currentPage.value)
  }
}

const handlePageInput = async () => {
  const p = parseInt(pageInput.value, 10)
  if (!isNaN(p) && p >= 1 && p <= totalPages.value && p !== currentPage.value) {
    currentPage.value = p
    await renderCurrentPage()
    emit('pageChange', p)
  } else {
    pageInput.value = String(currentPage.value)
  }
}

// Kontrol Zoom
const zoomIn = async () => {
  isFitWidth.value = false
  if (scale.value < 3.0) {
    scale.value = Number(Math.min(3.0, scale.value + 0.2).toFixed(2))
    await renderCurrentPage()
  }
}

const zoomOut = async () => {
  isFitWidth.value = false
  if (scale.value > 0.6) {
    scale.value = Number(Math.max(0.6, scale.value - 0.2).toFixed(2))
    await renderCurrentPage()
  }
}

const toggleFitWidth = async () => {
  isFitWidth.value = !isFitWidth.value
  await renderCurrentPage()
}

// Fitur Salin Seluruh Teks Halaman
const copyCurrentPageText = async () => {
  if (!pdfDoc) return
  try {
    const page = await pdfDoc.getPage(currentPage.value)
    const textContent = await page.getTextContent()
    const fullText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fullText)
      copiedToast.value = true
      setTimeout(() => {
        copiedToast.value = false
      }, 2500)
    }
  } catch (e) {
    console.error('Gagal menyalin teks:', e)
  }
}

// Fullscreen
const toggleFullscreen = () => {
  if (!viewerContainerRef.value) return
  if (!document.fullscreenElement) {
    viewerContainerRef.value.requestFullscreen().then(() => {
      isFullscreen.value = true
    }).catch(err => console.error(err))
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
    }).catch(err => console.error(err))
  }
}

// Keyboard shortcuts (Left/Right arrow)
const handleKeydown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault()
    prevPage()
  } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    e.preventDefault()
    nextPage()
  }
}

// Watch URL change
watch(() => props.fileUrl, () => {
  loadPdf()
})

onMounted(() => {
  loadPdf()
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel()
    } catch {}
  }
})

// Expose fungsi kontrol untuk komponen induk jika diperlukan
defineExpose({
  goToPage,
  goToChapter,
  currentPage,
  totalPages,
  activeChapter,
  isSidebarOpen
})
</script>

<template>
  <div
    ref="viewerContainerRef"
    class="relative flex flex-col bg-[#0b0e14] border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl transition-all"
    :class="{ 'fixed inset-0 z-50 rounded-none border-none': isFullscreen }"
  >
    <!-- Floating Toolbar Reader -->
    <div class="sticky top-0 z-30 bg-[#0e121a]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
      <div class="flex items-center flex-wrap gap-2">
        <!-- Tombol Toggle Sidebar BAB -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 text-xs font-semibold cursor-pointer shadow-sm"
          :class="[
            isSidebarOpen
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
              : 'bg-[#080a0f] border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
          ]"
          :title="isSidebarOpen ? 'Sembunyikan Daftar BAB' : 'Tampilkan Daftar BAB'"
          @click="isSidebarOpen = !isSidebarOpen"
        >
          <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span class="hidden sm:inline">Daftar BAB</span>
          <span
            v-if="chapters && chapters.length > 0"
            class="ml-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold"
          >
            {{ chapters.length }}
          </span>
          <span
            v-else-if="isExtracting"
            class="w-2 h-2 rounded-full bg-blue-400 animate-ping ml-0.5"
            title="Sedang menganalisis struktur PDF..."
          />
        </button>

        <!-- Navigasi Halaman -->
        <div class="flex items-center space-x-1.5 bg-[#080a0f] border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
          :disabled="currentPage <= 1 || isLoading"
          title="Halaman Sebelumnya (Panah Kiri)"
          @click="prevPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center space-x-1 text-xs font-mono text-slate-300">
          <input
            v-model="pageInput"
            type="number"
            min="1"
            :max="totalPages || 1"
            class="w-11 bg-slate-900 border border-slate-700/80 focus:border-blue-500 rounded px-1 py-0.5 text-center text-white text-xs font-semibold focus:outline-none"
            :disabled="isLoading || totalPages === 0"
            @keydown.enter="handlePageInput"
            @blur="handlePageInput"
          />
          <span class="text-slate-500">/</span>
          <span class="text-slate-400 font-medium">{{ totalPages || '-' }}</span>
        </div>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
          :disabled="currentPage >= totalPages || isLoading"
          title="Halaman Selanjutnya (Panah Kanan)"
          @click="nextPage"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Kontrol Zoom & Tampilan -->
      <div class="flex items-center space-x-1.5 bg-[#080a0f] border border-slate-800 rounded-xl px-2 py-1 shadow-inner">
        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
          :disabled="scale <= 0.6 || isLoading"
          title="Perkecil (-)"
          @click="zoomOut"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>

        <span class="text-xs font-mono font-medium text-slate-300 min-w-[3.2rem] text-center">
          {{ Math.round(scale * 100) }}%
        </span>

        <button
          type="button"
          class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
          :disabled="scale >= 3.0 || isLoading"
          title="Perbesar (+)"
          @click="zoomIn"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        <div class="w-px h-4 bg-slate-800 mx-0.5" />

        <button
          type="button"
          class="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
          :class="isFitWidth ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Sesuaikan Lebar Kontainer"
          @click="toggleFitWidth"
        >
          Sesuaikan
        </button>
      </div>
    </div>

      <!-- Action Tools: Copy Teks & Fullscreen -->
      <div class="flex items-center space-x-2">
        <!-- Tombol Salin Teks Halaman -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl border border-slate-800 bg-[#080a0f] hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center space-x-1.5"
          :disabled="isLoading || !totalPages"
          title="Salin semua teks yang ada di halaman ini"
          @click="copyCurrentPageText"
        >
          <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span class="hidden sm:inline">Salin Teks Halaman</span>
        </button>

        <!-- Fullscreen -->
        <button
          type="button"
          class="p-2 rounded-xl border border-slate-800 bg-[#080a0f] hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
          :title="isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'"
          @click="toggleFullscreen"
        >
          <svg v-if="!isFullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Alert Toast Saat Teks Disalin -->
    <transition
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="copiedToast"
        class="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/90 border border-emerald-600/60 text-emerald-200 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2 backdrop-blur-md"
      >
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Teks halaman {{ currentPage }} berhasil disalin ke clipboard!</span>
      </div>
    </transition>

    <!-- Main Reader Layout: Sidebar BAB + Viewport PDF -->
    <div class="flex-1 flex flex-row overflow-hidden relative min-h-[68vh]">
      <!-- Sidebar Daftar BAB -->
      <PdfChapterSidebar
        :chapters="chapters"
        :active-chapter="activeChapter"
        :current-page="currentPage"
        :is-open="isSidebarOpen"
        :is-loading="isLoadingChapters"
        :is-extracting="isExtracting"
        :extraction-status="extractionStatus"
        :error-message="chaptersErrorMessage"
        :config="config"
        @select-chapter="goToChapter"
        @close="isSidebarOpen = false"
        @retry="$emit('retryExtract')"
      />

      <!-- Main Viewport Area -->
      <div
        class="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-[#07090d] select-auto"
        tabindex="0"
      >
        <!-- State Loading -->
        <div v-if="isLoading" class="my-auto py-16 flex flex-col items-center justify-center space-y-4 text-center">
          <div class="relative w-14 h-14">
            <div class="w-14 h-14 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-semibold text-white">Memuat Dokumen PDF...</p>
            <p v-if="loadingProgress > 0" class="text-xs font-mono text-slate-400">
              Mengunduh berkas: {{ loadingProgress }}%
            </p>
          </div>
        </div>

        <!-- State Error -->
        <div v-else-if="errorMessage" class="my-auto py-16 max-w-md text-center space-y-4 px-4">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-white">Gagal Membuka Berkas PDF</h4>
            <p class="text-xs text-slate-400 leading-relaxed">{{ errorMessage }}</p>
          </div>
          <div class="flex items-center justify-center space-x-2 pt-2">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
              @click="loadPdf"
            >
              Coba Lagi
            </button>
            <a
              v-if="fileUrl"
              :href="fileUrl"
              target="_blank"
              download
              class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
            >
              Unduh Berkas Langsung
            </a>
          </div>
        </div>

        <!-- Page Canvas & TextLayer Container -->
        <div
          v-show="!isLoading && !errorMessage"
          ref="pageContainerRef"
          class="pdf-page-wrapper relative bg-white shadow-2xl transition-transform mx-auto rounded-sm overflow-hidden"
        >
          <!-- Canvas untuk raster PDF -->
          <canvas ref="canvasRef" class="block m-0 p-0" />

          <!-- TextLayer untuk seleksi mouse & Ctrl+C copy -->
          <div
            ref="textLayerRef"
            class="textLayer"
          />
        </div>
      </div>
    </div>

    <!-- Bottom Footer Status -->
    <div class="bg-[#0e121a] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
      <div class="flex items-center space-x-2 truncate">
        <span class="font-mono font-medium text-slate-300">Hal {{ currentPage }} / {{ totalPages }}</span>
        <template v-if="activeChapter">
          <span class="text-slate-600">•</span>
          <span class="text-blue-400 font-medium truncate max-w-[200px] sm:max-w-md">
            {{ activeChapter.judul_bab }}
          </span>
        </template>
      </div>
      <div v-if="totalPages" class="text-slate-500 font-mono text-[10px]">
        Skala: {{ Math.round(scale * 100) }}%
      </div>
    </div>
  </div>
</template>

<style>
/* CSS Spesifikasi Resmi TextLayer PDF.js untuk Seleksi & Copy Teks */
.pdf-page-wrapper {
  user-select: text;
  -webkit-user-select: text;
}

.textLayer {
  position: absolute;
  text-align: initial;
  inset: 0;
  overflow: clip;
  opacity: 1;
  line-height: 1;
  letter-spacing: normal;
  word-spacing: normal;
  -webkit-text-size-adjust: none;
  -moz-text-size-adjust: none;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  caret-color: auto;
  z-index: 2;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor, 1) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
  pointer-events: auto;
}

.textLayer :is(span, br) {
  color: transparent !important;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  user-select: text !important;
  pointer-events: all;
}

.textLayer > :not(.markedContent),
.textLayer .markedContent span:not(.markedContent) {
  z-index: 1;
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}

.textLayer .markedContent {
  display: contents;
}

/* Highlight warna biru transparan yang cantik saat pengguna memblok/menyeleksi teks */
.textLayer ::selection {
  background: rgba(59, 130, 246, 0.35) !important;
  color: transparent !important;
}

.textLayer ::-moz-selection {
  background: rgba(59, 130, 246, 0.35) !important;
  color: transparent !important;
}

.textLayer .endOfContent {
  display: block;
  position: absolute;
  inset: 100% 0 0;
  z-index: 0;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
}
</style>
