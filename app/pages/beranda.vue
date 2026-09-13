<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DocumentItem } from '~/types/document'
import { formatUploadDate } from '~/utils/document'

definePageMeta({
  alias: ['/']
})

useHead({
  title: 'Dashboard - Arsip Cendekia'
})

const { client, user } = useSupabase()

const documents = ref<DocumentItem[]>([])
const isLoading = ref(true)
const error = ref('')
const activeCategoryFilter = ref('semua')

// Ambil data dokumen dari Supabase
const fetchDashboardData = async () => {
  if (!client) return
  isLoading.value = true
  error.value = ''

  try {
    const { data: sessionData } = await client.auth.getSession()
    const activeUser = sessionData?.session?.user ?? user.value
    const currentUserId = activeUser?.id

    let query = client
      .from('documents')
      .select('*')

    // Filter dokumen milik pengguna yang sedang login jika ada
    if (currentUserId) {
      query = query.eq('user_id', currentUserId)
    }

    const { data, error: fetchErr } = await query.order('id', { ascending: false })

    if (fetchErr) {
      throw fetchErr
    }

    if (data) {
      documents.value = data as DocumentItem[]
    }
  } catch (err: any) {
    console.error('Gagal mengambil data dashboard dari Database:', err)
    error.value = err?.message || 'Gagal memuat data arsip dari Database.'
  } finally {
    isLoading.value = false
  }
}

// Perhitungan metrik dokumen dari data asli Supabase
const totalCount = computed(() => documents.value.length)
const bukuCount = computed(() => documents.value.filter(d => d.category?.toLowerCase() === 'buku').length)
const jurnalCount = computed(() => documents.value.filter(d => d.category?.toLowerCase() === 'jurnal').length)
const skripsiCount = computed(() => documents.value.filter(d => d.category?.toLowerCase() === 'skripsi').length)

// 4 Kartu Metrik Kontekstual Arsip Cendekia
const metrics = computed(() => [
  {
    title: 'Total Koleksi Arsip',
    value: totalCount.value.toLocaleString('id-ID'),
    categoryLabel: 'Semua Berkas',
    color: 'rose',
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    title: 'Buku',
    value: bukuCount.value.toLocaleString('id-ID'),
    categoryLabel: 'Buku Literatur',
    color: 'cyan',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  {
    title: 'Jurnal',
    value: jurnalCount.value.toLocaleString('id-ID'),
    categoryLabel: 'Jurnal Ilmiah',
    color: 'emerald',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
  },
  {
    title: 'Skripsi',
    value: skripsiCount.value.toLocaleString('id-ID'),
    categoryLabel: 'Tugas Akhir',
    color: 'purple',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342'
  }
])

// Dokumen yang difilter berdasarkan tab kategori
const filteredDocuments = computed(() => {
  if (activeCategoryFilter.value === 'semua') {
    return documents.value
  }
  return documents.value.filter(d => d.category?.toLowerCase() === activeCategoryFilter.value)
})

watch(user, () => {
  fetchDashboardData()
})

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ringkasan Arsip Cendekia
        </h2>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Pantau ketersediaan dokumen dan data kearsipan terkini dari sistem.
        </p>
      </div>

      <!-- Tombol Refresh Data -->
      <button
        type="button"
        :disabled="isLoading"
        @click="fetchDashboardData"
        class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-[#0e1117] border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        title="Perbarui data"
      >
        <svg
          class="w-3.5 h-3.5 text-slate-400"
          :class="{ 'animate-spin': isLoading }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{{ isLoading ? 'Memuat...' : 'Segarkan Data' }}</span>
      </button>
    </div>

    <!-- Error Alert jika Gagal Mengambil Data -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <span>⚠️</span>
        <span>{{ error }}</span>
      </div>
      <button
        type="button"
        class="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold"
        @click="fetchDashboardData"
      >
        Coba Lagi
      </button>
    </div>

    <!-- 4 Kartu Metrik dari Supabase -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(card, idx) in metrics"
        :key="idx"
        class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden transition-all hover:border-slate-700 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-slate-400">
            {{ card.title }}
          </span>
          <div :class="['w-9 h-9 rounded-xl border flex items-center justify-center', card.iconBg]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.icon" />
            </svg>
          </div>
        </div>

        <div class="mt-4 flex items-baseline justify-between">
          <div v-if="isLoading" class="h-8 w-16 bg-slate-800/80 rounded animate-pulse" />
          <h3 v-else class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {{ card.value }}
          </h3>
          <span class="text-[11px] text-slate-500 font-medium">
            {{ card.categoryLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tabel Dokumen Terkini -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 class="text-base font-bold text-white tracking-tight">
            Dokumen & Berkas Terkini
          </h3>
          <p class="text-xs text-slate-400">
            Daftar berkas arsip dokumen yang tersimpan di sistem.
          </p>
        </div>

        <!-- Filter Kategori Tabs -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-for="cat in ['semua', 'buku', 'jurnal', 'skripsi']"
            :key="cat"
            type="button"
            @click="activeCategoryFilter = cat"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors',
              activeCategoryFilter === cat
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            ]"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Loading Skeleton State -->
      <div v-if="isLoading" class="py-8 space-y-3">
        <div v-for="i in 4" :key="i" class="h-10 bg-slate-900/60 rounded-xl animate-pulse" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredDocuments.length === 0"
        class="py-12 flex flex-col items-center justify-center text-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-white">Belum Ada Dokumen</p>
          <p class="text-xs text-slate-400 max-w-sm">
            {{ activeCategoryFilter === 'semua'
              ? 'Belum ada berkas dokumen yang tersimpan di Database. Anda dapat mengunggah dokumen dari menu Buku, Jurnal, atau Skripsi.'
              : `Belum ada dokumen untuk kategori ${activeCategoryFilter}.`
            }}
          </p>
        </div>
        <div class="pt-2 flex items-center space-x-2">
          <NuxtLink
            to="/buku"
            class="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
          >
            Buka Buku
          </NuxtLink>
          <NuxtLink
            to="/jurnal"
            class="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors"
          >
            Buka Jurnal
          </NuxtLink>
          <NuxtLink
            to="/skripsi"
            class="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold transition-colors"
          >
            Buka Skripsi
          </NuxtLink>
        </div>
      </div>

      <!-- Table Container -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="text-slate-500 border-b border-slate-800/80 uppercase tracking-wider font-semibold">
              <th class="py-3 px-4">Judul Dokumen</th>
              <th class="py-3 px-4">Kategori</th>
              <th class="py-3 px-4">Format</th>
              <th class="py-3 px-4">Ukuran</th>
              <th class="py-3 px-4">Tanggal Unggah</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="doc in filteredDocuments"
              :key="doc.id"
              class="hover:bg-slate-900/40 transition-colors"
            >
              <td class="py-3.5 px-4 font-medium text-white max-w-xs sm:max-w-md">
                <div class="truncate text-slate-200 font-semibold">{{ doc.title }}</div>
                <div class="text-[10px] text-slate-500 mt-0.5 truncate">
                  {{ doc.author ? `${doc.author}${doc.year ? ` • ${doc.year}` : ''}` : (doc.file_name || '-') }}
                </div>
              </td>
              <td class="py-3.5 px-4">
                <span
                  :class="[
                    'inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold capitalize border',
                    doc.category?.toLowerCase() === 'buku' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : '',
                    doc.category?.toLowerCase() === 'jurnal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : '',
                    doc.category?.toLowerCase() === 'skripsi' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''
                  ]"
                >
                  {{ doc.category || 'Dokumen' }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-mono">
                  PDF
                </span>
              </td>
              <td class="py-3.5 px-4 text-slate-400 font-mono">{{ doc.file_size || '-' }}</td>
              <td class="py-3.5 px-4 text-slate-400">{{ formatUploadDate(doc.uploaded_at) || '-' }}</td>
              <td class="py-3.5 px-4 text-right">
                <NuxtLink
                  :to="{
                    path: `/${(doc.category || 'buku').toLowerCase()}/read`,
                    query: {
                      id: doc.id,
                      title: doc.title,
                      file: doc.file_url,
                      fileName: doc.file_name
                    }
                  }"
                  class="inline-flex items-center space-x-1 text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  <span>Buka</span>
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
