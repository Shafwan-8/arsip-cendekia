<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'generate', payload: { title: string; category: 'buku' | 'jurnal' | 'skripsi' }): void
}>()

const title = ref('')
const selectedCategory = ref<'buku' | 'jurnal' | 'skripsi'>('buku')
const validationError = ref('')

const categories = [
  {
    value: 'buku' as const,
    label: 'Buku Akademik',
    desc: 'Buku teks komprehensif 5–7 bab mendalam dengan tinjauan konsep dan aplikasi.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  },
  {
    value: 'jurnal' as const,
    label: 'Artikel Jurnal',
    desc: 'Format makalah IMRaD (Pendahuluan, Metodologi, Hasil, dan Pembahasan).',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
  },
  {
    value: 'skripsi' as const,
    label: 'Skripsi / Tesis',
    desc: 'Struktur akademik 5 bab standar penelitian dengan landasan teori dan analisis data.',
    icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342'
  }
]

const handleSubmit = () => {
  const trimmed = title.value.trim()
  if (!trimmed) {
    validationError.value = 'Silakan ketikkan judul atau topik karya yang ingin Anda buat.'
    return
  }
  validationError.value = ''
  emit('generate', {
    title: trimmed,
    category: selectedCategory.value
  })
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 py-6">
    <!-- Header Hero -->
    <div class="text-center space-y-3">
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
        Buat Karya Ilmiah Buku / Jurnal / Skripsi
      </h1>
      <p class="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Ketikkan topik atau judul yang Anda inginkan. AI akan menyusun Daftar Isi, menulis pembahasan setiap bab secara mendalam, merumuskan kesimpulan, dan melakukan grounding Daftar Pustaka dari OpenAlex.
      </p>
    </div>

    <!-- Form Card -->
    <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
      <!-- Input Judul -->
      <div class="space-y-2">
        <label for="book-title" class="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Judul atau Topik Utama Karya
        </label>
        <div class="relative">
          <input
            id="book-title"
            v-model="title"
            type="text"
            placeholder="Contoh: Penerapan Machine Learning dalam Diagnostik Medis Kontemporer"
            class="w-full px-4 py-3.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none transition-colors shadow-inner"
            @keyup.enter="handleSubmit"
          >
        </div>
        <p v-if="validationError" class="text-xs text-rose-400 font-medium">
          ⚠️ {{ validationError }}
        </p>
      </div>

      <!-- Pilihan Kategori -->
      <div class="space-y-3">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Pilih Format Literatur
        </label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <button
            v-for="cat in categories"
            :key="cat.value"
            type="button"
            @click="selectedCategory = cat.value"
            :class="[
              'text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between',
              selectedCategory === cat.value
                ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-950/20'
                : 'bg-[#090b0e] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
            ]"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div
                  :class="[
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    selectedCategory === cat.value
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800/60 text-slate-400'
                  ]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="cat.icon" />
                  </svg>
                </div>
                <div
                  :class="[
                    'w-4 h-4 rounded-full border flex items-center justify-center',
                    selectedCategory === cat.value
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-slate-700 bg-transparent'
                  ]"
                >
                  <div v-if="selectedCategory === cat.value" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>

              <div>
                <h2 class="text-sm font-bold text-white">{{ cat.label }}</h2>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ cat.desc }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Tombol Generate Action -->
      <div class="pt-4 border-t border-slate-800/70 flex flex-col sm:flex-row justify-end gap-4">
        <button
          type="button"
          @click="handleSubmit"
          class="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Mulai</span>
        </button>
      </div>
    </div>
  </div>
</template>
