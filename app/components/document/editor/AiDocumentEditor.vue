<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { DocumentCategoryConfig } from '~/types/document'
import { useDocumentContentBlocks } from '~/composables/document/useDocumentContentBlocks'
import { useDocumentPdfRender } from '~/composables/document/useDocumentPdfRender'
import BookGeneratorChapterSidebar from '~/components/book-generator/BookGeneratorChapterSidebar.vue'
import BookGeneratorEditor from '~/components/book-generator/BookGeneratorEditor.vue'
import BookGeneratorSaveBar from '~/components/book-generator/BookGeneratorSaveBar.vue'
import BookGeneratorPdfModal from '~/components/book-generator/BookGeneratorPdfModal.vue'

const props = defineProps<{
  documentId: string | number
  config: DocumentCategoryConfig
}>()

const isPdfModalOpen = ref(false)
const saveSuccessMessage = ref('')
const documentTitle = ref('Dokumen AI')

const {
  blocks,
  activeBlockId,
  activeBlock,
  isLoading,
  isSaving,
  hasUnsavedChanges,
  errorMessage,
  fetchBlocks,
  updateBlockContent,
  saveBlocks,
  selectBlock
} = useDocumentContentBlocks()

const {
  isRendering: isRenderingPdf,
  pdfUrl,
  errorMessage: pdfError,
  requestPdfRender,
  downloadPdf
} = useDocumentPdfRender()

const { client } = useSupabase()

onMounted(async () => {
  if (props.documentId) {
    // Ambil judul dokumen dari database
    if (client) {
      try {
        const { data } = await client
          .from('documents')
          .select('title')
          .eq('id', props.documentId)
          .single()
        if (data?.title) {
          documentTitle.value = data.title
        }
      } catch (err) {
        console.warn('Gagal membaca judul dokumen:', err)
      }
    }

    await fetchBlocks(props.documentId)
  }
})

const handleEditorUpdate = (newContent: Record<string, any>) => {
  saveSuccessMessage.value = ''
  if (activeBlockId.value) {
    updateBlockContent(activeBlockId.value, newContent)
  }
}

const handleSave = async () => {
  saveSuccessMessage.value = ''
  const success = await saveBlocks(props.documentId)
  if (success) {
    saveSuccessMessage.value = 'Perubahan bagian dokumen berhasil disimpan ke arsip!'
  }
}

const handleViewPdf = async () => {
  if (hasUnsavedChanges.value) {
    await saveBlocks(props.documentId)
  }
  const url = await requestPdfRender(props.documentId)
  if (url) {
    isPdfModalOpen.value = true
  }
}

const handleDownloadPdf = async () => {
  if (hasUnsavedChanges.value) {
    await saveBlocks(props.documentId)
  }
  await downloadPdf(props.documentId, `${documentTitle.value || 'literatur'}.pdf`)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header Dokumen AI -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
            :class="config.theme.badgeBg + ' ' + config.theme.badgeText + ' border ' + config.theme.badgeBorder"
          >
            {{ config.label }} AI
          </span>
          <span class="text-xs text-slate-500">• Editor Konten Terstruktur</span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-1" :title="documentTitle">
          {{ documentTitle }}
        </h1>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          :to="config.basePath"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors inline-flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Kembali ke Daftar</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Action Save Bar -->
    <BookGeneratorSaveBar
      :has-unsaved-changes="hasUnsavedChanges"
      :is-saving="isSaving"
      :is-rendering-pdf="isRenderingPdf"
      :category="config.category as any"
      @save="handleSave"
      @view-pdf="handleViewPdf"
      @download-pdf="handleDownloadPdf"
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
        :to="config.basePath"
        class="font-bold underline text-white hover:text-emerald-200 ml-2 flex-shrink-0"
      >
        Buka Arsip &rarr;
      </NuxtLink>
    </div>

    <!-- Feedback Banner jika ada pesan error -->
    <div v-if="errorMessage || pdfError" class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
      ⚠️ {{ errorMessage || pdfError }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-20 text-center text-xs text-slate-400 space-y-2">
      <div class="animate-spin w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full mx-auto"></div>
      <p>Memuat bagian-bagian dokumen ke editor...</p>
    </div>

    <!-- Main Workspace (Sidebar + TipTap Editor) -->
    <div v-else class="flex flex-col lg:flex-row gap-4 items-start min-h-[580px]">
      <BookGeneratorChapterSidebar
        :blocks="blocks"
        :active-block-id="activeBlockId"
        @select="selectBlock"
      />

      <BookGeneratorEditor
        :block="activeBlock"
        @update="handleEditorUpdate"
      />
    </div>

    <!-- PDF Viewer Modal -->
    <BookGeneratorPdfModal
      :is-open="isPdfModalOpen"
      :pdf-url="pdfUrl"
      :title="documentTitle"
      @close="isPdfModalOpen = false"
    />
  </div>
</template>
