<template>
  <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Logo & Title -->
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <span class="text-xl font-black text-slate-950">AC</span>
        </div>
        <div>
          <h1 class="text-lg font-bold tracking-tight text-white leading-tight">Arsip Cendekia</h1>
          <p class="text-[11px] text-slate-400 font-medium leading-none">Smart Digital Archiving System</p>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-300">
        <a href="#features" class="hover:text-brand-400 transition-colors">Fitur Unggulan</a>
        <a href="#archives" class="hover:text-brand-400 transition-colors">Koleksi Arsip</a>
        <a href="#stack" class="hover:text-brand-400 transition-colors">Tech Stack</a>
      </nav>

      <!-- Status Badge -->
      <div class="flex items-center space-x-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
          <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
          Nuxt 4 + Tailwind CSS v3
        </span>
      </div>
    </div>
  </header>
</template>
