<script setup lang="ts">
import type { DocumentItem, DocumentCategoryTheme } from '~/types/document'

defineProps<{
  document: DocumentItem
  index: number
  currentPage: number
  itemsPerPage: number
  theme: DocumentCategoryTheme
}>()

defineEmits<{
  (e: 'read', doc: DocumentItem): void
  (e: 'edit', doc: DocumentItem): void
  (e: 'delete', doc: DocumentItem): void
}>()
</script>

<template>
  <tr class="hover:bg-slate-900/40 transition-colors group">
    <!-- Nomor Urut -->
    <td class="py-4 px-4 text-center font-mono text-slate-500 text-[11px]">
      {{ (currentPage - 1) * itemsPerPage + index + 1 }}
    </td>

    <!-- Detail Dokumen (Judul, Penulis, Penerbit) -->
    <td class="py-4 px-4 max-w-sm">
      <div class="flex items-start space-x-3">
        <div
          class="w-9 h-11 rounded-lg bg-slate-900 border border-slate-800 flex-shrink-0 flex items-center justify-center shadow-sm"
          :class="theme.primaryText"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div class="min-w-0">
          <div
            class="font-medium text-white line-clamp-1 transition-colors"
            :class="`group-hover:${theme.primaryText}`"
            :title="document.title"
          >
            {{ document.title }}
          </div>
          <div class="text-[11px] text-slate-400 mt-0.5 truncate">
            ✍️ {{ document.author }}
          </div>
          <div class="text-[10px] text-slate-500 truncate">
            🏢 {{ document.publisher }}
          </div>
        </div>
      </div>
    </td>

    <!-- Tahun & Jumlah Halaman -->
    <td class="py-4 px-4 whitespace-nowrap">
      <div class="text-slate-200 font-medium">{{ document.year }}</div>
      <div class="text-[11px] text-slate-500">{{ document.pages }} Halaman</div>
    </td>

    <!-- Berkas PDF & Ukuran -->
    <td class="py-4 px-4 whitespace-nowrap">
      <div class="flex items-center space-x-1.5 text-slate-300">
        <span
          class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border"
          :class="[theme.badgeBg, theme.badgeBorder, theme.badgeText]"
        >
          PDF
        </span>
        <span class="text-xs font-medium">{{ document.file_size }}</span>
      </div>
      <div class="text-[10px] text-slate-500 truncate max-w-[160px]" :title="document.file_name">
        {{ document.file_name }}
      </div>
    </td>

    <!-- Waktu Upload -->
    <td class="py-4 px-4 text-slate-400 whitespace-nowrap text-[11px]">
      {{ document.uploaded_at || '-' }}
    </td>

    <!-- Tombol Aksi (Icon Saja: Read, Edit, Delete) -->
    <td class="py-4 px-4 text-center whitespace-nowrap">
      <div class="inline-flex items-center justify-center space-x-1.5">
        <!-- 1. Tombol Read -->
        <button
          type="button"
          @click="$emit('read', document)"
          title="Baca Dokumen (PDF Viewer)"
          aria-label="Baca Dokumen"
          class="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>

        <!-- 2. Tombol Edit -->
        <button
          type="button"
          @click="$emit('edit', document)"
          title="Edit Informasi Dokumen"
          aria-label="Edit Dokumen"
          class="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <!-- 3. Tombol Delete -->
        <button
          type="button"
          @click="$emit('delete', document)"
          title="Hapus Dokumen dari Arsip"
          aria-label="Hapus Dokumen"
          class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </td>
  </tr>
</template>
