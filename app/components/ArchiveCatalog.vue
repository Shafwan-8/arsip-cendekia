<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveCategory, ArchiveItem } from '~/types/archive'

const props = defineProps<{
  categories: ArchiveCategory[]
  archives: ArchiveItem[]
}>()

const activeCategory = defineModel<string>({ default: 'akademik' })

const filteredArchives = computed(() => {
  if (!activeCategory.value) return props.archives
  return props.archives.filter(item => item.category === activeCategory.value)
})
</script>

<template>
  <section id="archives" class="space-y-6">
    <!-- Section Header & Category Filters -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div>
        <h3 class="text-xl font-bold text-white tracking-tight">Katalog Arsip Unggulan</h3>
        <p class="text-sm text-slate-400">Pilih kategori untuk memfilter dokumen arsip</p>
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          @click="activeCategory = cat.id"
          :class="[
            'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2',
            activeCategory === cat.id
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          ]"
        >
          <span>{{ cat.icon }}</span>
          <span>{{ cat.label }}</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded-md text-[10px]',
              activeCategory === cat.id ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
            ]"
          >
            {{ cat.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Archive Cards Grid -->
    <div v-if="filteredArchives.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <ArchiveCard
        v-for="(item, idx) in filteredArchives"
        :key="item.code || idx"
        :item="item"
      />
    </div>

    <!-- Empty State if no archives found for selected category -->
    <div
      v-else
      class="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-400 space-y-2"
    >
      <p class="text-2xl">📂</p>
      <p class="text-sm font-medium text-slate-300">Belum ada arsip pada kategori ini</p>
      <p class="text-xs text-slate-500">Silakan pilih kategori arsip lain di atas.</p>
    </div>
  </section>
</template>
