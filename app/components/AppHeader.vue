<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useChatSearchStore } from '~/stores/chatSearch'

defineEmits<{
  (e: 'toggle-mobile'): void
}>()

const route = useRoute()
const { user, signOut } = useSupabase()
const chatStore = useChatSearchStore()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

const userInitials = computed(() => {
  if (!user.value?.email) return 'AC'
  const name = user.value.email.split('@')[0]
  return name.slice(0, 2).toUpperCase()
})

const userEmail = computed(() => {
  return user.value?.email
})

const pageTitle = () => {
  if (route.path === '/literatur') return 'Pencarian Literatur'
  if (route.path === '/arsip-literatur') return 'Literatur & Arsip'
  if (route.path === '/buku' || route.path === '/buku/read' || route.path === '/buku/edit') return 'Buku'
  if (route.path === '/jurnal' || route.path === '/jurnal/read' || route.path === '/jurnal/edit') return 'Jurnal'
  if (route.path === '/skripsi' || route.path === '/skripsi/read' || route.path === '/skripsi/edit') return 'Skripsi'
  return 'Beranda'
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

const handleLogout = async () => {
  closeDropdown()
  await signOut()
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})
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

    <!-- Right: Search With AI & User Avatar -->
    <div class="flex items-center space-x-3 sm:space-x-4">
      <!-- Search With AI Button (Sesuai Konsep Visual) -->
      <button
        type="button"
        @click="chatStore.toggle"
        class="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#141720] hover:bg-[#1b202c] border border-slate-700/80 hover:border-rose-500/60 shadow-sm hover:shadow-rose-950/20 transition-all duration-200 cursor-pointer focus:outline-none"
        aria-label="Cari Literatur dengan AI"
      >
        <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span>Search With AI</span>
      </button>

      <!-- User Avatar & Logout Dropdown -->
      <div ref="dropdownRef" class="relative">
        <button
          type="button"
          @click.stop="toggleDropdown"
          class="flex items-center space-x-2 p-0.5 rounded-full hover:ring-2 hover:ring-slate-700 transition-all cursor-pointer focus:outline-none"
          aria-label="Menu Pengguna"
          :aria-expanded="isDropdownOpen"
        >
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500/20 to-rose-400/30 border border-rose-500/40 text-rose-400 font-bold text-xs flex items-center justify-center shadow-sm">
            {{ userInitials }}
          </div>
        </button>

      <!-- Dropdown Menu -->
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isDropdownOpen"
          class="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e1117] border border-slate-800/90 shadow-2xl p-2 z-50 divide-y divide-slate-800/80"
        >
          <!-- Info Pengguna -->
          <div class="px-3 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Masuk Sebagai
            </p>
            <p class="text-xs font-bold text-white truncate mt-0.5" :title="userEmail">
              {{ userEmail }}
            </p>
          </div>

          <!-- Opsi Logout -->
          <div class="pt-1.5 mt-1.5">
            <button
              type="button"
              @click="handleLogout"
              class="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
            >
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
  </header>
</template>
