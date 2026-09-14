// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
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

