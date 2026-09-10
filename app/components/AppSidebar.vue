<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{
  isMobileOpen?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()

// Check active route
const isActive = (path: string) => {
  if (path === '/') return route.path === '/' || route.path === '/beranda'
  return route.path.startsWith(path)
}

const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    label: 'Literatur & Arsip',
    path: '/literatur',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  }
]

const categoryItems = [
  { label: 'Buku Referensi', count: '486', path: '/literatur?cat=Buku' },
  { label: 'Jurnal Ilmiah', count: '354', path: '/literatur?cat=Jurnal' },
  { label: 'Artikel & Riset', count: '288', path: '/literatur?cat=Artikel' }
]
</script>

<template>
  <div>
    <!-- Mobile Backdrop -->
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
      @click="emit('close')"
    />

    <!-- Sidebar Container -->
    <aside
      :class="[
        'fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0d0f14] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Top Branding Section -->
      <div class="p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <span class="font-extrabold text-sm">AC</span>
            </div>
            <div>
              <h1 class="text-sm font-bold text-white tracking-tight leading-tight">
                Arsip Cendekia
              </h1>
              <span class="text-[10px] font-semibold tracking-wider text-rose-400/90 uppercase">
                DASHBOARD
              </span>
            </div>
          </div>

          <!-- Close button on mobile -->
          <button
            type="button"
            class="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
            @click="emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Navigation Menu -->
        <div class="mt-8 space-y-6">
          <!-- Main Menu -->
          <div>
            <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Overview
            </p>
            <nav class="space-y-1">
              <NuxtLink
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                @click="emit('close')"
                :class="[
                  'flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  isActive(item.path)
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                ]"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
                </svg>
                <span>{{ item.label }}</span>
              </NuxtLink>
            </nav>
          </div>

          <!-- Categories Shortcut -->
          <div>
            <p class="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Kategori Arsip
            </p>
            <div class="space-y-1">
              <NuxtLink
                v-for="cat in categoryItems"
                :key="cat.label"
                :to="cat.path"
                @click="emit('close')"
                class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                <span>{{ cat.label }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                  {{ cat.count }}
                </span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom User Profile Card -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center">
              AS
            </div>
            <div>
              <p class="text-xs font-semibold text-white leading-tight">Admin Cendekia</p>
              <p class="text-[10px] text-slate-500">Super Admin</p>
            </div>
          </div>

          <div class="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="Keluar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
