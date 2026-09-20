<script setup lang="ts">
import type { DocumentItem, DocumentCategoryTheme } from '~/types/document'

defineProps<{
  documents: DocumentItem[]
  totalRawDocuments: number
  totalFilteredDocuments: number
  isLoading: boolean
  currentPage: number
  itemsPerPage: number
  emptyTitle?: string
  emptyDescription?: string
  uploadBtnText?: string
  theme: DocumentCategoryTheme
}>()

defineEmits<{
  (e: 'read', doc: DocumentItem): void
  (e: 'edit', doc: DocumentItem): void
  (e: 'delete', doc: DocumentItem): void
  (e: 'upload'): void
}>()
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs">
      <thead>
        <tr class="text-slate-400 border-b border-slate-800/90 bg-[#0d1015] uppercase tracking-wider font-semibold">
          <th class="py-3.5 px-4 w-12 text-center">No</th>
          <th class="py-3.5 px-4">Informasi Dokumen</th>
          <th class="py-3.5 px-4">Tahun & Halaman</th>
          <th class="py-3.5 px-4">Berkas PDF</th>
          <th class="py-3.5 px-4 text-center">Sumber</th>
          <th class="py-3.5 px-4">Tanggal Unggah</th>
          <th class="py-3.5 px-4 text-center w-24">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60 text-slate-300">
        <!-- Loading State -->
        <tr v-if="isLoading && totalRawDocuments === 0">
          <td colspan="7" class="py-12 text-center">
            <div class="flex flex-col items-center justify-center space-y-2">
              <svg class="animate-spin h-6 w-6" :class="theme.primaryText" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p class="text-xs text-slate-400">Menghubungkan ke Database & memuat daftar dokumen...</p>
            </div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="totalFilteredDocuments === 0">
          <td colspan="7" class="py-12 text-center">
            <DocumentEmptyState
              :title="emptyTitle"
              :description="emptyDescription"
              :upload-btn-text="uploadBtnText"
              :theme="theme"
              @upload="$emit('upload')"
            />
          </td>
        </tr>

        <!-- Baris Data Dokumen -->
        <DocumentRow
          v-for="(doc, index) in documents"
          v-else
          :key="doc.id"
          :document="doc"
          :index="index"
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :theme="theme"
          @read="$emit('read', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </tbody>
    </table>
  </div>
</template>
