// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      openalexApiKey: '' // Otomatis dioverride oleh NUXT_PUBLIC_OPENALEX_API_KEY di .env
    }
  },
  experimental: {
    appManifest: false
  },
  app: {
    head: {
      title: 'Arsip Cendekia - Sistem Manajemen & Pengarsipan Digital',
      meta: [
        { name: 'description', content: 'Platform manajemen pengarsipan dokumen digital modern untuk institusi dan lembaga pendidikan Arsip Cendekia.' },
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

