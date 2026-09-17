// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY,
    // Nonaktifkan redirect otomatis bawaan jika Anda menggunakan custom middleware auth
    redirect: false,
    // Konfigurasi Cookie untuk menyimpan token JWT (Access & Refresh Token)
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7, // Cookie aktif selama 7 hari
      sameSite: 'lax',           // Mencegah pemblokiran navigasi antar-halaman di Chrome
      secure: process.env.NODE_ENV === 'production', // Wajib HTTPS di Vercel (Production), namun fleksibel di localhost (HTTP)
    },
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true
      }
    }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    adobeClientId: process.env.ADOBE_CLIENT_ID,
    adobeClientSecret: process.env.ADOBE_CLIENT_SECRET,
    public: {
      openalexApiKey: process.env.OPENALEX_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      supabaseJwksUrl: process.env.SUPABASE_JWKS_URL
    }
  },
  experimental: {
    appManifest: false
  },
  app: {
    head: {
      title: 'Arsip Cendekia - Sistem Manajemen & Pengarsipan Digital',
      meta: [
        { name: 'description', content: 'Aplikasi manajemen pengarsipan dokumen digital.' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  }
})

