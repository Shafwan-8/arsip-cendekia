  <script setup lang="ts">
import { ref } from 'vue'
import type { DocumentCategoryConfig, DocumentUploadForm } from '~/types/document'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    isUploading: boolean
    errorMessage: string
    isDragging: boolean
    selectedFile: File | null
    form: DocumentUploadForm
    config: DocumentCategoryConfig
    uploadMode?: 'edit_ai' | 'annotate'
    uploadProgressText?: string
  }>(),
  {
    uploadMode: 'edit_ai',
    uploadProgressText: ''
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
  (e: 'fileChange', event: Event): void
  (e: 'dropFile', event: DragEvent): void
  (e: 'dragOver'): void
  (e: 'dragLeave'): void
  (e: 'update:uploadMode', mode: 'edit_ai' | 'annotate'): void
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

          <!-- Pilihan Mode Penanganan PDF -->
          <div class="space-y-2 pt-1">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tujuan Pengunggahan Dokumen
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Opsi 1: Mode Editor Terstruktur -->
              <div
                @click="$emit('update:uploadMode', 'edit_ai')"
                :class="[
                  'p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none',
                  uploadMode === 'edit_ai'
                    ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/30'
                    : 'bg-[#090b0e] border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    <span class="text-xs font-bold text-white">Mode Editor Terstruktur</span>
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 leading-snug">
                  AI Mengekstrak Bab & Sub-bab agar teks dokumen dapat dibaca dan diedit secara leluasa.
                </p>
              </div>

              <!-- Opsi 2: Mode Anotasi PDF Canvas -->
              <div
                @click="$emit('update:uploadMode', 'annotate')"
                :class="[
                  'p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 select-none',
                  uploadMode === 'annotate'
                    ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/30'
                    : 'bg-[#090b0e] border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                    </svg>
                    <span class="text-xs font-bold text-white">Mode Anotasi Canvas</span>
                  </div>
                </div>
                <p class="text-[11px] text-slate-400 leading-snug">
                  Simpan berkas PDF asli untuk dibaca, diberi coretan, stabilo, dan tanda tangan digital pada kanvas.
                </p>
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
      <div class="p-4 sm:p-6 border-t border-slate-800/90 bg-[#0d1015] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div v-if="isUploading && uploadProgressText" class="text-xs text-rose-400 flex items-center gap-2 animate-pulse">
          <svg class="w-4 h-4 animate-spin text-rose-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span class="font-medium">{{ uploadProgressText }}</span>
        </div>
        <div v-else class="text-[11px] text-slate-500 hidden sm:block">
          {{ uploadMode === 'edit_ai' ? 'Dokumen akan diproses otomatis oleh AI' : 'Dokumen akan disimpan langsung ke arsip' }}
        </div>

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
          <span>
            {{
              isUploading
                ? (uploadMode === 'edit_ai' ? 'Mengekstrak AI...' : 'Mengunggah...')
                : (uploadMode === 'edit_ai' ? 'Kirim & Buka di Editor' : 'Kirim Berkas')
            }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
