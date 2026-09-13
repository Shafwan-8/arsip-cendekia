<script setup lang="ts">
import { ref } from 'vue'
import type { PdfTool, PdfEditorElement, TextPdfElement, HighlightPdfElement } from '~/types/pdf-editor'
import type { DocumentCategoryConfig } from '~/types/document'

const props = defineProps<{
  selectedTool: PdfTool
  selectedElement: PdfEditorElement | null
  canUndo: boolean
  canRedo: boolean
  zoom: number
  isFitWidth: boolean
  isSaving: boolean
  config: DocumentCategoryConfig
}>()

const emit = defineEmits<{
  (e: 'set-tool', tool: PdfTool): void
  (e: 'trigger-image-upload'): void
  (e: 'trigger-signature-modal'): void
  (e: 'delete-selected'): void
  (e: 'update-selected', updates: Partial<PdfEditorElement>): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'toggle-fit-width'): void
  (e: 'cancel'): void
  (e: 'save'): void
}>()

const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48]
const highlightColors = [
  { name: 'Kuning', hex: '#facc15' },
  { name: 'Hijau', hex: '#4ade80' },
  { name: 'Biru', hex: '#60a5fa' },
  { name: 'Merah Muda', hex: '#f472b6' }
]

const textColors = [
  { name: 'Hitam', hex: '#000000' },
  { name: 'Putih', hex: '#ffffff' },
  { name: 'Merah', hex: '#dc2626' },
  { name: 'Biru', hex: '#2563eb' },
  { name: 'Hijau', hex: '#16a34a' }
]
</script>

<template>
  <div class="bg-[#0e121a] border-b border-slate-800/80 px-3 sm:px-4 py-2 flex flex-col gap-2 shadow-md">
    <!-- Baris Utama: Tools, Undo/Redo, Zoom, & Save -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <!-- Grup Tool Interaktif -->
      <div class="flex items-center space-x-1 bg-[#080a0f] border border-slate-800 rounded-xl p-1 shadow-inner">
        <!-- Select / Cursor -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          :class="selectedTool === 'select' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Mode Seleksi / Pindah Elemen"
          @click="emit('set-tool', 'select')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <span class="hidden md:inline">Pilih</span>
        </button>

        <!-- Text -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          :class="selectedTool === 'text' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Tambah Teks (Klik area dokumen)"
          @click="emit('set-tool', 'text')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M12 6v14" />
          </svg>
          <span class="hidden md:inline">Teks</span>
        </button>

        <!-- Highlight -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          :class="selectedTool === 'highlight' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Highlight Area (Klik & drag di dokumen)"
          @click="emit('set-tool', 'highlight')"
        >
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span class="hidden md:inline">Highlight</span>
        </button>

        <!-- Gambar -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 text-slate-400 hover:text-white hover:bg-slate-850"
          title="Sematkan Gambar dari Perangkat"
          @click="emit('trigger-image-upload')"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="hidden md:inline">Gambar</span>
        </button>

        <!-- Tanda Tangan -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 text-slate-400 hover:text-white hover:bg-slate-850"
          title="Tambahkan Tanda Tangan"
          @click="emit('trigger-signature-modal')"
        >
          <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span class="hidden md:inline">Tanda Tangan</span>
        </button>

        <!-- Draw / Goresan Bebas -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          :class="selectedTool === 'draw' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Coretan Bebas / Pensil"
          @click="emit('set-tool', 'draw')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span class="hidden md:inline">Gambar Bebas</span>
        </button>

        <!-- Kotak / Rect -->
        <button
          type="button"
          class="p-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1"
          :class="selectedTool === 'rect' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
          title="Bentuk Kotak"
          @click="emit('set-tool', 'rect')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
          </svg>
          <span class="hidden md:inline">Kotak</span>
        </button>
      </div>

      <!-- Undo / Redo & Zoom -->
      <div class="flex items-center space-x-2">
        <!-- Undo / Redo -->
        <div class="flex items-center space-x-1 bg-[#080a0f] border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            :disabled="!canUndo"
            title="Urungkan Perubahan (Undo)"
            @click="emit('undo')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors"
            :disabled="!canRedo"
            title="Ulangi Perubahan (Redo)"
            @click="emit('redo')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2m15-7l-6-6m6 6l-6 6" />
            </svg>
          </button>
        </div>

        <!-- Zoom Controls -->
        <div class="flex items-center space-x-1 bg-[#080a0f] border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
            :disabled="zoom <= 0.6"
            title="Perkecil (-)"
            @click="emit('zoom-out')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </button>
          <span class="text-xs font-mono font-medium text-slate-300 min-w-[3rem] text-center">
            {{ Math.round(zoom * 100) }}%
          </span>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 disabled:opacity-30 transition-colors"
            :disabled="zoom >= 3.0"
            title="Perbesar (+)"
            @click="emit('zoom-in')"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
            :class="isFitWidth ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-850'"
            title="Sesuaikan Lebar Kontainer"
            @click="emit('toggle-fit-width')"
          >
            Sesuaikan
          </button>
        </div>

        <!-- Action: Batal & Simpan -->
        <div class="flex items-center space-x-2 pl-1">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            @click="emit('cancel')"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="isSaving"
            class="px-4 py-1.5 rounded-xl text-white text-xs font-semibold transition-all shadow-md flex items-center space-x-1.5"
            :class="config.theme.primaryBtn"
            @click="emit('save')"
          >
            <svg v-if="isSaving" class="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{{ isSaving ? 'Menyimpan...' : 'Simpan PDF' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Baris Kedua: Opsi Elemen Terpilih (Font Size, Warna, Delete) -->
    <div
      v-if="selectedElement"
      class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs animate-in fade-in duration-200"
    >
      <div class="flex items-center space-x-3">
        <span class="text-slate-400 font-medium">
          Elemen Terpilih:
          <span class="text-white capitalize font-mono">{{ selectedElement.type }}</span>
        </span>

        <!-- Opsi Teks -->
        <div v-if="selectedElement.type === 'text'" class="flex items-center space-x-2">
          <!-- Ukuran Font -->
          <label class="text-slate-400">Ukuran:</label>
          <select
            :value="(selectedElement as TextPdfElement).fontSize"
            class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-white text-xs focus:outline-none"
            @change="emit('update-selected', { fontSize: Number(($event.target as HTMLSelectElement).value) })"
          >
            <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}px</option>
          </select>

          <!-- Bold -->
          <button
            type="button"
            class="w-6 h-6 rounded border font-bold text-xs flex items-center justify-center transition-colors"
            :class="(selectedElement as TextPdfElement).bold ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'"
            @click="emit('update-selected', { bold: !(selectedElement as TextPdfElement).bold })"
          >
            B
          </button>

          <!-- Italic -->
          <button
            type="button"
            class="w-6 h-6 rounded border italic font-serif text-xs flex items-center justify-center transition-colors"
            :class="(selectedElement as TextPdfElement).italic ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'"
            @click="emit('update-selected', { italic: !(selectedElement as TextPdfElement).italic })"
          >
            I
          </button>

          <!-- Warna Teks -->
          <div class="flex items-center space-x-1 pl-1">
            <button
              v-for="c in textColors"
              :key="c.hex"
              type="button"
              class="w-4 h-4 rounded-full border transition-transform"
              :class="(selectedElement as TextPdfElement).color === c.hex ? 'border-blue-400 scale-125' : 'border-slate-600'"
              :style="{ backgroundColor: c.hex }"
              :title="c.name"
              @click="emit('update-selected', { color: c.hex })"
            />
          </div>
        </div>

        <!-- Opsi Highlight -->
        <div v-else-if="selectedElement.type === 'highlight'" class="flex items-center space-x-2">
          <span class="text-slate-400">Warna Highlight:</span>
          <div class="flex items-center space-x-1.5">
            <button
              v-for="c in highlightColors"
              :key="c.hex"
              type="button"
              class="w-5 h-5 rounded-full border transition-transform"
              :class="(selectedElement as HighlightPdfElement).color === c.hex ? 'border-white scale-110' : 'border-transparent'"
              :style="{ backgroundColor: c.hex }"
              :title="c.name"
              @click="emit('update-selected', { color: c.hex })"
            />
          </div>
        </div>
      </div>

      <!-- Tombol Hapus Elemen -->
      <button
        type="button"
        class="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center space-x-1.5"
        title="Hapus Elemen (Delete)"
        @click="emit('delete-selected')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span>Hapus Elemen</span>
      </button>
    </div>
  </div>
</template>
