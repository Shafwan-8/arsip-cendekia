<script setup lang="ts">
import { ref } from 'vue'
import type { ArchiveItem } from '~/types/archive'

const activeCategory = ref('buku')
const searchKeyword = ref('')

const recentArchives: ArchiveItem[] = [
  {
    title: 'Pedoman Kurikulum Merdeka Terintegrasi 2026/2027',
    category: 'buku',
    code: 'AC-AKD-2026-004',
    date: '08 Mar 2026',
    size: '3.4 MB',
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
        :archives="recentArchives"
      />


    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
