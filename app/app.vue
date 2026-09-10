<script setup lang="ts">
import { ref } from 'vue'

const isMobileOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-[#090b0e] text-slate-100 flex font-sans antialiased selection:bg-rose-500 selection:text-white">
    <!-- Sidebar Navigation -->
    <AppSidebar
      :is-mobile-open="isMobileOpen"
      @close="isMobileOpen = false"
    />

    <!-- Main Content Container -->
    <div class="flex-1 flex flex-col min-w-0 min-h-screen">
      <!-- Navbar Header (Only Avatar & Breadcrumbs) -->
      <AppHeader @toggle-mobile="isMobileOpen = !isMobileOpen" />

      <!-- Page Content -->
      <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div class="max-w-7xl mx-auto">
          <NuxtPage />
        </div>
      </main>
    </div>
  </div>
</template>
