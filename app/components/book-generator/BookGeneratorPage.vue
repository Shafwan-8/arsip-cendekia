<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useBookGeneratorStore } from '~/stores/useBookGeneratorStore'
import { useDocumentPdfRender } from '~/composables/document/useDocumentPdfRender'
import BookGeneratorInput from './BookGeneratorInput.vue'
import BookGeneratorProgress from './BookGeneratorProgress.vue'
import BookGeneratorChapterSidebar from './BookGeneratorChapterSidebar.vue'
import BookGeneratorEditor from './BookGeneratorEditor.vue'
import BookGeneratorSaveBar from './BookGeneratorSaveBar.vue'
import BookGeneratorPdfModal from './BookGeneratorPdfModal.vue'
import BookGeneratorLeaveConfirmModal from './BookGeneratorLeaveConfirmModal.vue'

const store = useBookGeneratorStore()

const isPdfModalOpen = ref(false)
const saveSuccessMessage = ref('')
const showLeaveConfirmModal = ref(false)
const leaveConfirmMessage = ref('')
const pendingAction = ref<(() => void) | null>(null)

// Composable Render PDF
const {
  isRendering: isRenderingPdf,
  pdfUrl,
  errorMessage: pdfError,
  requestPdfRender,
  downloadPdf
} = useDocumentPdfRender()

// Mulai alur pembuatan buku
const handleStartGenerate = async (payload: { title: string; category: 'buku' | 'jurnal' | 'skripsi' }) => {
  saveSuccessMessage.value = ''
  await store.generate(payload.title, payload.category)
}

// Handler update konten dari TipTap editor
const handleEditorUpdate = (newContent: Record<string, any>) => {
  saveSuccessMessage.value = ''
  if (store.activeBlockId) {
    store.updateBlockContent(store.activeBlockId, newContent)
  }
}

// Handler Simpan Draft ke Supabase
const handleSave = async () => {
  saveSuccessMessage.value = ''
  const success = await store.saveDraftToSupabase()
  if (success) {
    const categoryName = store.category.charAt(0).toUpperCase() + store.category.slice(1)
    saveSuccessMessage.value = `Karya berhasil disimpan ke arsip ${categoryName}!`
  }
}

// Handler Lihat PDF
const handleViewPdf = async () => {
  // Jika belum pernah disimpan atau ada perubahan, simpan ke database terlebih dahulu
  if (!store.savedDocumentId || store.hasUnsavedChanges) {
    const saved = await store.saveDraftToSupabase()
    if (!saved || !store.savedDocumentId) return
  }

  const url = await requestPdfRender(store.savedDocumentId)
  if (url) {
    isPdfModalOpen.value = true
  }
}

// Handler Unduh PDF
const handleDownloadPdf = async () => {
  if (!store.savedDocumentId || store.hasUnsavedChanges) {
    const saved = await store.saveDraftToSupabase()
    if (!saved || !store.savedDocumentId) return
  }

  await downloadPdf(store.savedDocumentId, `${store.title || 'literatur'}.pdf`)
}

// Handler Tombol "Buat Baru"
const handleCreateNew = () => {
  if (store.hasUnsavedChanges) {
    leaveConfirmMessage.value = 'Anda belum menyimpan literatur ini ke arsip. Yakin ingin membuat baru? Draft yang ada saat ini akan direset.'
    pendingAction.value = () => {
      saveSuccessMessage.value = ''
      store.resetDraft()
    }
    showLeaveConfirmModal.value = true
  } else {
    saveSuccessMessage.value = ''
    store.resetDraft()
  }
}

// Konfirmasi dari modal leave
const handleConfirmLeave = () => {
  showLeaveConfirmModal.value = false
  if (pendingAction.value) {
    const actionToRun = pendingAction.value
    pendingAction.value = null
    actionToRun()
  }
}

const handleCloseLeaveModal = () => {
  showLeaveConfirmModal.value = false
  pendingAction.value = null
}

// Proteksi pindah halaman SPA (vue-router guard)
onBeforeRouteLeave((to, from, next) => {
  if (store.hasUnsavedChanges) {
    leaveConfirmMessage.value = 'Anda belum menyimpan literatur ini ke arsip. Jika Anda berpindah halaman, perubahan belum tersimpan dapat hilang saat browser dimuat ulang. Yakin ingin melanjutkan?'
    pendingAction.value = () => next()
    showLeaveConfirmModal.value = true
    next(false)
  } else {
    next()
  }
})

// Proteksi penutupan tab browser / hard refresh
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (store.hasUnsavedChanges) {
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="space-y-6">
    <!-- State 1: Input Awal -->
    <div v-if="store.status === 'idle'">
      <BookGeneratorInput @generate="handleStartGenerate" />
    </div>

    <!-- State 2: Sedang Streaming / Progress SSE -->
    <div v-else-if="store.status === 'generating'">
      <BookGeneratorProgress
        :title="store.title"
        :current-activity="store.currentActivity"
        :chapters="store.outlineChapters"
        :current-chapter-index="store.currentStreamingIndex"
        :current-chapter-text="store.currentStreamingText"
        :error-message="store.errorMessage"
        @abort="store.abortGeneration"
      />
    </div>

    <!-- State 3: Gagal / Error State -->
    <div v-else-if="store.status === 'failed'" class="max-w-xl mx-auto my-12 p-6 rounded-2xl bg-[#0e1117] border border-rose-500/40 text-center space-y-4 shadow-xl">
      <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <div class="space-y-1">
        <h3 class="text-base font-bold text-white">Pembuatan Literatur Terhenti</h3>
        <p class="text-xs text-slate-400">
          {{ store.errorMessage || 'Terjadi kesalahan sistem selama pembuatan literatur.' }}
        </p>
      </div>

      <div class="pt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          @click="handleCreateNew"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Coba Judul Lain
        </button>
        <button
          type="button"
          @click="handleStartGenerate({ title: store.title, category: store.category })"
          class="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          Coba Ulang
        </button>
      </div>
    </div>

    <!-- State 4: Selesai -> Editor Workspace Draft (Belum Disimpan atau Sudah Disimpan) -->
    <div v-else-if="store.status === 'draft_ready' || store.status === 'saving' || store.status === 'saved'" class="space-y-4">
      <!-- Top Title Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {{ store.category }}
            </span>
            <span class="text-xs text-slate-500">• Hasil Susunan AI</span>
            <span v-if="!store.savedDocumentId" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Draft (Belum di Database)
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-1" :title="store.title">
            {{ store.title }}
          </h1>
        </div>
      </div>

      <!-- Action Save Bar -->
      <BookGeneratorSaveBar
        :has-unsaved-changes="store.hasUnsavedChanges"
        :is-saving="store.status === 'saving'"
        :is-rendering-pdf="isRenderingPdf"
        :category="store.category"
        @save="handleSave"
        @view-pdf="handleViewPdf"
        @download-pdf="handleDownloadPdf"
        @new-generation="handleCreateNew"
      />

      <!-- Feedback Banner Sukses Simpan -->
      <div v-if="saveSuccessMessage" class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-md">
        <div class="flex items-center gap-2 min-w-0 pr-2">
          <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="truncate">{{ saveSuccessMessage }}</span>
        </div>
        <NuxtLink
          :to="'/' + store.category"
          class="font-bold underline text-white hover:text-emerald-200 ml-2 flex-shrink-0"
        >
          Buka Halaman Arsip &rarr;
        </NuxtLink>
      </div>

      <!-- Feedback Banner jika ada pesan error -->
      <div v-if="store.errorMessage || pdfError" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        ⚠️ {{ store.errorMessage || pdfError }}
      </div>

      <!-- Main Editor Workspace (Sidebar + Editor) -->
      <div class="flex flex-col lg:flex-row gap-4 items-start min-h-[580px]">
        <!-- Kiri: Sidebar Navigasi Bab -->
        <BookGeneratorChapterSidebar
          :blocks="store.chapters"
          :active-block-id="store.activeBlockId"
          @select="store.selectBlock"
        />

        <!-- Kanan: TipTap Rich Text Editor -->
        <BookGeneratorEditor
          :block="store.activeBlock"
          @update="handleEditorUpdate"
        />
      </div>
    </div>

    <!-- PDF Viewer Modal -->
    <BookGeneratorPdfModal
      :is-open="isPdfModalOpen"
      :pdf-url="pdfUrl"
      :title="store.title"
      @close="isPdfModalOpen = false"
    />

    <!-- Leave / Reset Confirm Modal -->
    <BookGeneratorLeaveConfirmModal
      :is-open="showLeaveConfirmModal"
      :message="leaveConfirmMessage"
      @close="handleCloseLeaveModal"
      @confirm="handleConfirmLeave"
    />
  </div>
</template>
