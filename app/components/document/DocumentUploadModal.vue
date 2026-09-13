  <script setup lang="ts">
import { ref } from 'vue'
import type { DocumentCategoryConfig, DocumentUploadForm } from '~/types/document'

const props = defineProps<{
  isOpen: boolean
  isUploading: boolean
  errorMessage: string
  isDragging: boolean
  selectedFile: File | null
  form: DocumentUploadForm
  config: DocumentCategoryConfig
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
  (e: 'fileChange', event: Event): void
  (e: 'dropFile', event: DragEvent): void
  (e: 'dragOver'): void
  (e: 'dragLeave'): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
  >
    <!-- Container Modal (Klik backdrop TIDAK menutup modal) -->
    <div
      class="relative w-full max-w-2xl bg-[#0e1117] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn"
    >
      <!-- Header Modal & Tombol X Tutup Modal -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800/90 bg-[#0d1015]">
        <div class="flex items-center space-x-2.5">
          <div
            class="w-8 h-8 rounded-xl border flex items-center justify-center"
            :class="[config.theme.badgeBg, config.theme.badgeBorder, config.theme.badgeText]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-white tracking-tight">
              {{ config.uploadModalTitle }}
            </h3>
          </div>
        </div>

        <!-- SATU-SATUNYA TOMBOL UNTUK MENUTUP MODAL (SIMBOL X) -->
        <button
          type="button"
          @click="$emit('close')"
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
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn"
        >
          <svg class="w-4 h-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <form id="uploadDocForm" @submit.prevent="$emit('submit')" class="space-y-4">
          <!-- Area Drag & Drop Berkas PDF / Browse Manual -->
          <div class="space-y-1.5">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Berkas PDF Dokumen <span :class="config.theme.primaryText">*</span>
            </label>

            <!-- Drag and Drop Box -->
            <div
              @dragover.prevent="$emit('dragOver')"
              @dragleave.prevent="$emit('dragLeave')"
              @drop.prevent="$emit('dropFile', $event)"
              :class="[
                'relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2',
                isDragging
                  ? `${config.theme.accentBorder} ${config.theme.accentBg} scale-[1.01]`
                  : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-slate-700 bg-[#090b0e]'
              ]"
              @click="triggerFileInput"
            >
              <!-- Hidden Native Input -->
              <input
                ref="fileInputRef"
                type="file"
                accept="application/pdf,.pdf"
                class="hidden"
                @change="$emit('fileChange', $event)"
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
                    Ukuran: <span class="text-emerald-400 font-mono">{{ form.file_size }}</span> • Format: PDF
                  </p>
                </div>
                <span class="text-[11px] hover:underline" :class="config.theme.primaryText">
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
                    Tarik & lepas file PDF ke sini, atau <span class="underline" :class="config.theme.primaryText">cari berkas manual</span>
                  </p>
                  <p class="text-[11px] text-slate-500">
                    Mendukung format berkas .PDF
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Text Judul File / Dokumen -->
          <div class="space-y-1.5">
            <label for="docTitle" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Judul {{ config.label }} <span :class="config.theme.primaryText">*</span>
            </label>
            <input
              id="docTitle"
              v-model="form.title"
              type="text"
              required
              :placeholder="`Contoh: Pengantar Riset ${config.label} Digital`"
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              :class="config.theme.focusBorder"
            />
          </div>

          <!-- Penulis & Penerbit -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="docAuthor" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Penulis / Pengarang
              </label>
              <input
                id="docAuthor"
                v-model="form.author"
                type="text"
                placeholder="Contoh: Dr. Ir. Ahmad Dahlan"
                class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                :class="config.theme.focusBorder"
              />
            </div>

            <div class="space-y-1.5">
              <label for="docPublisher" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Penerbit / Institusi
              </label>
              <input
                id="docPublisher"
                v-model="form.publisher"
                type="text"
                placeholder="Contoh: Cendekia Pustaka Utama"
                class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                :class="config.theme.focusBorder"
              />
            </div>
          </div>

          <!-- Tahun Terbit & Halaman -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="docYear" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Tahun Terbit
              </label>
              <input
                id="docYear"
                v-model="form.year"
                type="number"
                min="1900"
                max="2100"
                placeholder="Contoh: 2026"
                class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                :class="config.theme.focusBorder"
              />
            </div>

            <div class="space-y-1.5">
              <label for="docPages" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Jumlah Halaman
              </label>
              <input
                id="docPages"
                v-model="form.pages"
                type="number"
                min="1"
                placeholder="Contoh: 284"
                class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
                :class="config.theme.focusBorder"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Footer Modal (Tombol Submit) -->
      <div class="p-4 sm:p-6 border-t border-slate-800/90 bg-[#0d1015] flex items-center justify-end space-x-3">
        <button
          type="submit"
          form="uploadDocForm"
          :disabled="isUploading || !selectedFile"
          class="w-full sm:w-auto px-6 py-2.5 rounded-xl disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          :class="config.theme.primaryBtn"
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
</template>
