<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Kontak - Arsip Cendekia'
})

const form = ref({
  name: '',
  email: '',
  message: ''
})

const isSubmitted = ref(false)

const handleSubmit = () => {
  if (!form.value.name || !form.value.email || !form.value.message) return
  isSubmitted.value = true
  setTimeout(() => {
    form.value = { name: '', email: '', message: '' }
    isSubmitted.value = false
  }, 4000)
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-10">
    <!-- Header -->
    <div class="text-center space-y-3">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-brand-400">
        <span>Bantuan & Layanan</span>
      </div>
      <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Hubungi Kami</h1>
      <p class="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
        Memerlukan akses arsip khusus atau memiliki pertanyaan seputar sistem Arsip Cendekia? Silakan hubungi kami.
      </p>
    </div>

    <!-- Contact Form & Info -->
    <div class="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6">
      <div v-if="isSubmitted" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
        Pesan Anda telah berhasil terkirim! Tim kami akan segera menanggapi.
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Masukkan nama Anda"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="nama@email.com"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          >
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Pesan / Permohonan</label>
          <textarea
            v-model="form.message"
            rows="4"
            required
            placeholder="Tuliskan pertanyaan atau permohonan informasi arsip..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition-colors resize-none"
          ></textarea>
        </div>

        <button
          type="submit"
          class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm transition-colors shadow-lg shadow-brand-500/20"
        >
          Kirim Pesan
        </button>
      </form>
    </div>
  </div>
</template>
