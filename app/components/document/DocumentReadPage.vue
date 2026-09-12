<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DocumentCategoryConfig, DocumentItem } from '~/types/document'

const props = defineProps<{
  config: DocumentCategoryConfig
}>()

const route = useRoute()
const { client } = useSupabase()

// Parameter dari route query
const initialTitle = (route.query.title as string) || ''
const docId = (route.query.id as string) || ''
const initialFileName = (route.query.fileName as string) || ''
const initialFileUrl = (route.query.file as string) || ''

// State dinamis dokumen
const currentTitle = ref(initialTitle)
const currentFileName = ref(initialFileName)
const currentFileUrl = ref(initialFileUrl)
const isLoadingMetadata = ref(false)
const totalPagesCount = ref<number | null>(null)

useHead({
  title: computed(() => `${currentTitle.value || props.config.label} - Pembaca PDF Arsip Cendekia`)
})

// Mengambil metadata lengkap dokumen dari Supabase jika fileUrl belum tersedia di query
onMounted(async () => {
  if (!currentFileUrl.value && docId && client) {
    isLoadingMetadata.value = true
    try {
      const { data, error } = await client
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single()

      if (!error && data) {
        const item = data as DocumentItem
        currentTitle.value = currentTitle.value || item.title
        currentFileName.value = currentFileName.value || item.file_name
        currentFileUrl.value = item.file_url
        if (item.pages) {
          totalPagesCount.value = item.pages
        }
      }
    } catch (err) {
      console.error('Gagal memuat detail dokumen dari Supabase:', err)
    } finally {
      isLoadingMetadata.value = false
    }
  }
})

const handlePdfLoaded = (pages: number) => {
  totalPagesCount.value = pages
}
</script>

<template>
  <div class="space-y-4">
    <!-- Top Bar Navigasi & Info Berkas -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div class="flex items-center space-x-3">
        <!-- Tombol Kembali -->
        <NuxtLink
          :to="config.basePath"
          class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
          :title="`Kembali ke Daftar ${config.label}`"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>

        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
              {{ currentTitle || (isLoadingMetadata ? 'Memuat dokumen...' : 'Membaca Dokumen') }}
            </h2>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border"
              :class="[config.theme.badgeBg, config.theme.badgeText, config.theme.badgeBorder]"
            >
              PDF
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Berkas: <span class="text-slate-300 font-mono">{{ currentFileName || (isLoadingMetadata ? 'Memeriksa...' : '-') }}</span>
            <span v-if="totalPagesCount" class="text-slate-500 ml-2">• <span class="text-slate-300">{{ totalPagesCount }} Halaman</span></span>
          </p>
        </div>
      </div>

      <!-- Action Buttons in Reader -->
      <div class="flex items-center space-x-2">
        <NuxtLink
          v-if="docId"
          :to="`${config.basePath}/edit?id=${docId}`"
          class="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
        >
          <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Edit Metadata</span>
        </NuxtLink>

        <a
          v-if="currentFileUrl"
          :href="currentFileUrl"
          target="_blank"
          download
          class="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold transition-colors flex items-center space-x-1.5"
          :class="config.theme.primaryBtn"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Unduh Berkas</span>
        </a>
      </div>
    </div>

    <!-- PDF Viewer Area (pdf.js dengan TextLayer untuk Seleksi & Copy) -->
    <ClientOnly>
      <div v-if="currentFileUrl">
        <DocumentPdfViewer
          :file-url="currentFileUrl"
          :file-name="currentFileName"
          :config="config"
          @loaded="handlePdfLoaded"
        />
      </div>

      <!-- State Jika Belum Ada Berkas yang Dipilih -->
      <div
        v-else-if="!isLoadingMetadata"
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-10 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner"
      >
        <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md text-amber-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div class="max-w-md space-y-1">
          <h3 class="text-base font-bold text-white">Berkas PDF Tidak Ditentukan</h3>
          <p class="text-xs text-slate-400 leading-relaxed">
            Tidak ada dokumen yang dipilih untuk dibaca. Silakan pilih dokumen dari daftar {{ config.label.toLowerCase() }} Anda.
          </p>
        </div>

        <NuxtLink
          :to="config.basePath"
          class="px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition-colors"
          :class="config.theme.primaryBtn"
        >
          Kembali ke Daftar {{ config.label }}
        </NuxtLink>
      </div>

      <!-- Loading State Metadata -->
      <div
        v-else
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-10 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner"
      >
        <div class="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
        <p class="text-xs text-slate-400">Menghubungkan ke Supabase Storage...</p>
      </div>

      <template #fallback>
        <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-10 min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4 shadow-inner">
          <div class="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          <p class="text-xs text-slate-400">Menyiapkan pembaca PDF...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
