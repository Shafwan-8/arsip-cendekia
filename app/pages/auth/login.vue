<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Masuk - Arsip Cendekia'
})

// State Form
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Composable Supabase Auth
const { signInWithEmail } = useSupabase()

// Handle Submit Form Login
const handleLogin = async () => {
  errorMessage.value = ''
  
  const cleanEmail = email.value.trim()
  const cleanPassword = password.value

  if (!cleanEmail || !cleanPassword) {
    errorMessage.value = 'Silakan isi email dan kata sandi Anda.'
    return
  }

  isLoading.value = true

  try {
    // Autentikasi langsung ke Supabase
    await signInWithEmail(cleanEmail, cleanPassword)
    
    // Redirect ke Beranda/Dashboard setelah berhasil
    await navigateTo('/', { replace: true })
  } catch (err: any) {
    console.error('Supabase Login Error:', err)
    const rawMsg = err?.message || ''
    
    if (rawMsg.toLowerCase().includes('invalid login credentials')) {
      errorMessage.value = 'Email atau kata sandi tidak valid. Pastikan akun telah terdaftar di Database.'
    } else if (rawMsg.toLowerCase().includes('email not confirmed')) {
      errorMessage.value = 'Email belum dikonfirmasi. Silakan periksa kotak masuk atau aktifkan Auto-Confirm di Database.'
    } else {
      errorMessage.value = rawMsg || 'Gagal masuk. Periksa kembali koneksi dan akun Anda.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#090b0e] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden selection:bg-rose-500 selection:text-white">
    <!-- Ambient Glow Effects (Sesuai Tema Gelap Arsip Cendekia) -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
    <div class="absolute bottom-10 right-10 w-72 h-72 bg-rose-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

    <!-- Container Utama -->
    <div class="w-full max-w-md space-y-6">
      <!-- Logo & Header Branding -->
      <div class="text-center space-y-3">
        <NuxtLink to="/" class="inline-flex items-center space-x-3 group cursor-pointer">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-500/25 group-hover:scale-105 transition-transform">
            <span class="font-extrabold text-base tracking-tight">AC</span>
          </div>
          <div class="text-left">
            <h1 class="text-lg font-bold text-white tracking-tight leading-tight">
              Arsip Cendekia
            </h1>
            <span class="text-[10px] font-semibold tracking-wider text-rose-400/90 uppercase">
              SISTEM ARSIP DIGITAL
            </span>
          </div>
        </NuxtLink>

        <div class="pt-2">
          <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Selamat Datang
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">
            Masuk ke akun Anda untuk mengelola arsip dan literatur
          </p>
        </div>
      </div>

      <!-- Card Formulir Login -->
      <div class="bg-[#0e1117] border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <!-- Banner Error -->
        <div
          v-if="errorMessage"
          class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn"
        >
          <svg class="w-4 h-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Input Email -->
          <div class="space-y-1.5">
            <label for="email" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Email
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                </svg>
              </span>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                autocomplete="email"
                placeholder="nama@institusi.ac.id"
                class="w-full pl-10 pr-4 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <!-- Input Password -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="password" class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Kata Sandi
              </label>
            </div>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 bg-[#090b0e] border border-slate-800 hover:border-slate-700 focus:border-rose-500/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              />
              <!-- Toggle Show/Hide Password -->
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                :title="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
              >
                <!-- Eye Off -->
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <!-- Eye -->
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 rounded border-slate-800 bg-[#090b0e] text-rose-500 focus:ring-rose-500/20 focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <span>Ingat saya</span>
            </label>
          </div>

          <!-- Tombol Masuk -->
          <div class="pt-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-rose-500/25 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>{{ isLoading ? 'Memproses Masuk...' : 'Masuk ke Sistem' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Footer & Navigasi Kembali -->
      <div class="text-center space-y-2">
        <p class="text-[11px] text-slate-500">
          © 2026 Arsip Cendekia.
        </p>
      </div>
    </div>
  </div>
</template>
