<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentCategoryConfig } from '~/types/document'
import { useDocumentEditor } from '~/composables/pdf-editor/useDocumentEditor'
import PdfEditor from '~/components/document/editor/PdfEditor.vue'
import AiDocumentEditor from '~/components/document/editor/AiDocumentEditor.vue'

const props = defineProps<{
  config: DocumentCategoryConfig
}>()

const {
  document,
  pdfBytes,
  isLoading,
  error
} = useDocumentEditor({
  category: props.config.category
})

useHead({
  title: computed(() => `${document.value?.title || 'Edit Dokumen'} - Editor Arsip Cendekia`)
})
</script>

<template>
  <div class="space-y-4">
    <ClientOnly>
      <!-- Loading State saat Mengambil Metadata & Bytes PDF -->
      <div
        v-if="isLoading"
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-12 min-h-[65vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner"
      >
        <div class="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <div class="space-y-1">
          <h3 class="text-sm font-semibold text-white">Menyiapkan Dokumen...</h3>
          <p class="text-xs text-slate-400">Memuat berkas dari arsip untuk disunting</p>
        </div>
      </div>

      <!-- Jalur 1: Dokumen Hasil AI Generation & Uploaded Editable -> AiDocumentEditor (TipTap per bab & sub-bab) -->
      <div v-else-if="document?.source === 'ai_generated' || document?.source === 'uploaded_editable'">
        <AiDocumentEditor
          :document-id="document.id"
          :config="config"
        />
      </div>

      <!-- Jalur 2: Dokumen Manual Upload dengan Berkas PDF -> PdfEditor (Anotasi PDF) -->
      <div v-else-if="document && pdfBytes">
        <PdfEditor
          :document="document"
          :pdf-bytes="pdfBytes"
          :config="config"
        />
      </div>

      <!-- Error State jika Dokumen Tidak Ditemukan atau Gagal Dimuat -->
      <div
        v-else
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-10 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner"
      >
        <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-lg">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div class="max-w-md space-y-1">
          <h3 class="text-base font-bold text-white">Gagal Membuka Editor Dokumen</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            {{ error || 'Berkas dokumen tidak dapat dimuat atau ID tidak valid.' }}
          </p>
        </div>

        <div class="pt-2 flex items-center space-x-3">
          <NuxtLink
            :to="config.basePath"
            class="px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-colors"
            :class="config.theme.primaryBtn"
          >
            Kembali ke Daftar {{ config.label }}
          </NuxtLink>
        </div>
      </div>

      <template #fallback>
        <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-12 min-h-[65vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
          <div class="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          <p class="text-xs text-slate-400">Menyiapkan modul Editor...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
