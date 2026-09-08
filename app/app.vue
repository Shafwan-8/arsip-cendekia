<script setup lang="ts">
import { ref } from 'vue'
import type { ArchiveCategory, ArchiveItem } from '~/types/archive'

const activeCategory = ref('akademik')
const searchKeyword = ref('')
const isBookmarked = ref(false)

const categories: ArchiveCategory[] = [
  { id: 'akademik', label: 'Arsip Akademik', count: 142, icon: '🎓' },
  { id: 'sk', label: 'Surat Keputusan', count: 86, icon: '📜' },
  { id: 'penelitian', label: 'Laporan Riset', count: 54, icon: '🔬' },
  { id: 'keuangan', label: 'Berkas Keuangan', count: 37, icon: '📊' }
]

const recentArchives: ArchiveItem[] = [
  {
    title: 'Pedoman Kurikulum Merdeka Terintegrasi 2026/2027',
    category: 'akademik',
    code: 'AC-AKD-2026-004',
    date: '08 Mar 2026',
    size: '3.4 MB',
    type: 'PDF'
  },
  {
    title: 'SK Penetapan Dewan Pembina & Pengawas Arsip',
    category: 'sk',
    code: 'AC-SK-2026-012',
    date: '05 Mar 2026',
    size: '1.2 MB',
    type: 'PDF'
  },
  {
    title: 'Laporan Riset Evaluasi Efektivitas Digitalisasi Kampus',
    category: 'penelitian',
    code: 'AC-RST-2026-009',
    date: '01 Mar 2026',
    size: '8.7 MB',
    type: 'PDF'
  }
]
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
    <!-- Ambient Background Glow -->
    <AppBackground />

    <!-- Top Navigation Header -->
    <AppHeader />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      <HeroSection v-model="searchKeyword" />

      <ArchiveCatalog
        v-model="activeCategory"
        :categories="categories"
        :archives="recentArchives"
      />

      <TechStackSection />

      <QuickActionBanner v-model:is-bookmarked="isBookmarked" />
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
