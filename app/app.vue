<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
    <!-- Ambient Background Glow -->
    <AppBackground />

    <!-- Top Navigation Header -->
    <AppHeader />

    <!-- Main Content Area with Nuxt Routing -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
