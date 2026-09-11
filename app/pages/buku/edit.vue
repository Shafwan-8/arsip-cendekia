<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const bookId = (route.query.id as string) || ''

useHead({
  title: 'Edit Dokumen Buku - Arsip Cendekia'
})

const { client, user } = useSupabase()

const formData = ref({
  id: bookId,
  title: '',
  author: '',
  publisher: '',
  category: 'buku',
  year: new Date().getFullYear(),
  pages: 0,
  status: 'Pribadi',
  fileName: ''
})

const isLoading = ref(true)
const isSaving = ref(false)
const savedSuccess = ref(false)
const errorMessage = ref('')

const loadDocument = async () => {
  if (!bookId || !client) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    let query = client
      .from('documents')
      .select('*')
      .eq('id', bookId)

    if (user.value?.id) {
      query = query.eq('user_id', user.value.id)
    }

    const { data, error } = await query.single()
    if (error) throw error

    if (data) {
      formData.value = {
        id: data.id,
        title: data.title || '',
        author: data.author || '',
        publisher: data.publisher || '',
        category: data.category || 'buku',
        year: data.year || new Date().getFullYear(),
        pages: data.pages || 0,
        status: data.status || 'Pribadi',
        fileName: data.file_name || 'dokumen.pdf'
      }
    }
  } catch (err: any) {
    console.error('Error load document:', err)
    errorMessage.value = err?.message || 'Gagal memuat dokumen dari Supabase.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDocument()
})

const handleSave = async () => {
  if (!bookId || !client) return
  isSaving.value = true
  errorMessage.value = ''

  try {
    const updatePayload: Record<string, any> = {
      title: formData.value.title.trim(),
      author: formData.value.author.trim(),
      publisher: formData.value.publisher.trim(),
      year: Number(formData.value.year),
      pages: Number(formData.value.pages)
    }

    if (user.value?.id) {
      updatePayload.user_id = user.value.id
    }

    let query = client
      .from('documents')
      .update(updatePayload)
      .eq('id', bookId)

    if (user.value?.id) {
      query = query.eq('user_id', user.value.id)
    }

    const { error } = await query

    if (error) throw error

    savedSuccess.value = true
    setTimeout(() => {
      navigateTo('/buku')
    }, 1200)
  } catch (err: any) {
    console.error('Error update document:', err)
    errorMessage.value = err?.message || 'Gagal menyimpan perubahan ke Supabase.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header Navigasi -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <NuxtLink
          to="/buku"
          class="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
          title="Kembali ke Daftar Buku"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </NuxtLink>
        <div>
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Edit Informasi Buku
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Perbarui metadata berkas buku di repositori sistem. ID: <span class="font-mono text-rose-400">{{ bookId }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Alert Error -->
    <div
      v-if="errorMessage"
      class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2"
    >
      <span>⚠️</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Alert Sukses Simpan -->
    <div
      v-if="savedSuccess"
      class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2"
    >
      <span>✓</span>
      <span>Perubahan berhasil disimpan! Mengalihkan ke daftar buku...</span>
    </div>

    <!-- Formulir Edit -->
    <form @submit.prevent="handleSave" class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
      <div class="space-y-4">
        <!-- Judul Buku -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Judul Buku Literatur
          </label>
          <input
            v-model="formData.title"
            type="text"
            required
            class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Penulis -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Penulis / Pengarang
            </label>
            <input
              v-model="formData.author"
              type="text"
              required
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors"
            />
          </div>

          <!-- Penerbit -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Penerbit
            </label>
            <input
              v-model="formData.publisher"
              type="text"
              required
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Kategori -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <select
              v-model="formData.category"
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="Teknologi">Teknologi</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Sains">Sains</option>
              <option value="Hukum">Hukum</option>
              <option value="Ekonomi">Ekonomi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <!-- Tahun Terbit -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tahun Terbit
            </label>
            <input
              v-model="formData.year"
              type="number"
              required
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors"
            />
          </div>

          <!-- Jumlah Halaman -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Jumlah Halaman
            </label>
            <input
              v-model="formData.pages"
              type="number"
              required
              class="w-full px-3.5 py-2.5 bg-[#090b0e] border border-slate-800 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <!-- Info Berkas PDF Asli -->
        <div class="p-3.5 bg-[#090b0e] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span class="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold font-mono">
              PDF
            </span>
            <span class="text-slate-300 font-mono">{{ formData.fileName }}</span>
          </div>
          <span class="text-[11px] text-slate-500">(File di Supabase Storage)</span>
        </div>
      </div>

      <!-- Tombol Aksi -->
      <div class="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/80">
        <NuxtLink
          to="/buku"
          class="px-4 py-2.5 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          Batal
        </NuxtLink>
        <button
          type="submit"
          :disabled="isSaving"
          class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-rose-500/20 flex items-center space-x-2 cursor-pointer"
        >
          <svg v-if="isSaving" class="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>{{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
