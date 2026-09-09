<script setup lang="ts">
import type { ArchiveItem } from '~/types/archive'

defineProps<{
  item: ArchiveItem
}>()
</script>

<template>
  <div class="group bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/40 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/5 flex flex-col justify-between">
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
          {{ item.code }}
        </span>
        <span class="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          {{ item.type }}
        </span>
      </div>
      <h4 class="font-semibold text-white group-hover:text-brand-300 transition-colors leading-snug">
        {{ item.title }}
      </h4>
    </div>

    <div class="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between text-xs text-slate-400">
      <span>Terakhir Diubah: {{ item.date }}</span>
      <span>📦 {{ item.size }}</span>
    </div>
  </div>
</template>
