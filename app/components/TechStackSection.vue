<script setup lang="ts">
interface StackFeature {
  icon: string
  title: string
  description: string
  color: string
}

const features: StackFeature[] = [
  {
    icon: '⚡',
    title: 'Nuxt 4 / 3 Engine',
    description: 'SSR, File-based Routing, Auto-imports komponen & composables bawaan Nuxt.',
    color: 'bg-emerald-500/10 text-emerald-400'
  },
  {
    icon: '🎨',
    title: 'Tailwind CSS v3',
    description: 'Utility-first styling, palet warna brand terkonfigurasi, dark mode bawaan.',
    color: 'bg-teal-500/10 text-teal-400'
  },
  {
    icon: '🔤',
    title: 'Plus Jakarta Sans',
    description: 'Tipografi modern dan bersih yang diintegrasikan langsung melalui Google Fonts.',
    color: 'bg-blue-500/10 text-blue-400'
  },
  {
    icon: '🛡️',
    title: 'TypeScript Ready',
    description: 'Type-safety penuh di komponen, skrip, dan konfigurasi berkas aplikasi.',
    color: 'bg-purple-500/10 text-purple-400'
  }
]
</script>

<template>
  <section id="features" class="space-y-6">
    <div class="text-center max-w-xl mx-auto space-y-2">
      <h3 class="text-2xl font-bold text-white tracking-tight">Kesiapan Infrastruktur Frontend</h3>
      <p class="text-sm text-slate-400">Modul dan arsitektur yang telah terintegrasi di dalam proyek ini</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="(feature, idx) in features"
        :key="idx"
        class="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-2 hover:border-slate-700 transition-colors"
      >
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
            feature.color
          ]"
        >
          {{ feature.icon }}
        </div>
        <h4 class="font-bold text-white text-sm">{{ feature.title }}</h4>
        <p class="text-xs text-slate-400 leading-relaxed">{{ feature.description }}</p>
      </div>
    </div>
  </section>
</template>
