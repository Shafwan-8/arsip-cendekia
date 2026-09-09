<script setup lang="ts">
import { ref } from 'vue'
import type { ArchiveItem } from '~/types/archive'

definePageMeta({
  alias: ['/']
})

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
  <div class="space-y-16">
    <HeroSection v-model="searchKeyword" />

    <ArchiveCatalog
      v-model="activeCategory"
      :archives="recentArchives"
    />
  </div>
</template>
