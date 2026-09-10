<script setup lang="ts">
import { useRoute } from 'vue-router'

defineEmits<{
  (e: 'toggle-mobile'): void
}>()

const route = useRoute()

const pageTitle = () => {
  if (route.path === '/literatur') return 'Literatur & Arsip'
  return 'Dashboard'
}
</script>

<template>
  <header class="h-16 border-b border-slate-800/80 bg-[#0d0f14]/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
    <!-- Left: Mobile Menu Toggle & Title -->
    <div class="flex items-center space-x-3">
      <button
        type="button"
        class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 lg:hidden transition-colors"
        @click="$emit('toggle-mobile')"
        aria-label="Toggle Menu"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
        <span>Arsip Cendekia</span>
        <span>/</span>
        <span class="text-slate-200 font-semibold">{{ pageTitle() }}</span>
      </div>
    </div>

    <!-- Right: User Avatar Only (Sesuai Permintaan) -->
    <div class="flex items-center space-x-3">
      <div class="relative">
        <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500/20 to-rose-400/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center shadow-sm">
          AS
        </div>
        <!-- Online dot status indicator -->
        <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0d0f14]" />
      </div>
    </div>
  </header>
</template>
