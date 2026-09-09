<template>
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">

      <!-- Navigation Links -->
      <nav class="flex items-center space-x-5 sm:space-x-8 text-sm font-medium text-slate-300">
        <NuxtLink to="/" class="hover:text-brand-400 transition-colors" active-class="text-brand-400 font-bold">
          Beranda
        </NuxtLink>
        <NuxtLink to="/profile" class="hover:text-brand-400 transition-colors" active-class="text-brand-400 font-bold">
          Profile
        </NuxtLink>
        <NuxtLink to="/pendidikan" class="hover:text-brand-400 transition-colors" active-class="text-brand-400 font-bold">
          Pendidikan
        </NuxtLink>
        <NuxtLink to="/kontak" class="hover:text-brand-400 transition-colors" active-class="text-brand-400 font-bold">
          Kontak
        </NuxtLink>
      </nav>

    </div>
  </header>
</template>
