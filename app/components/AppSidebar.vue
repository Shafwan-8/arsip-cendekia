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

// Supabase Auth Integration
const { user, signOut } = useSupabase()

const userEmail = computed(() => user.value?.email || 'admin@cendekia.id')
const userInitials = computed(() => {
  if (!user.value?.email) return 'AC'
  const name = user.value.email.split('@')[0]
  return name.slice(0, 2).toUpperCase()
})

// Check active route
const isActive = (path: string) => {
  if (path === '/') return route.path === '/' || route.path === '/beranda'
  if (path === '/literatur') return route.path === '/literatur'
  if (path === '/buku') return route.path === '/buku'
  if (path === '/jurnal') return route.path === '/jurnal'
  if (path === '/skripsi') return route.path === '/skripsi'
  return route.path.startsWith(path)
}

const navItems = [
  {
    label: 'Beranda',
    path: '/',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    label: 'Pencarian Literatur',
    path: '/literatur',
    icon: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'
  }
]

const categoryItems = [
  {
    label: 'Buku',
    path: '/buku',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  {
    label: 'Jurnal',
    path: '/jurnal',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z'
  },
  {
    label: 'Skripsi',
    path: '/skripsi',
    icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342'
  }
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
        'fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-[#0d0f14] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 flex-shrink-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Top Branding & Navigation Section (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-5">
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
              Dashboard
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
              Arsip Literatur
            </p>
            <div class="space-y-1">
              <NuxtLink
                v-for="cat in categoryItems"
                :key="cat.label"
                :to="cat.path"
                @click="emit('close')"
                class="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                :class="isActive(cat.path)
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'"
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="cat.icon" />
                </svg>
                <span>{{ cat.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom User Profile Card (Fixed di bawah layar) -->
      <div class="p-4 border-t border-slate-800/80 bg-[#0d0f14] flex-shrink-0 mt-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3 min-w-0 mr-2">
            <div class="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {{ userInitials }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-white leading-tight truncate" :title="userEmail">
                {{ userEmail.split('@')[0] }}
              </p>
              <p class="text-[10px] text-slate-500 truncate" :title="userEmail">
                {{ userEmail }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="signOut"
            class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
            title="Keluar dari Akun"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
