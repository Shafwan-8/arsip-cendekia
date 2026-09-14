import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let serverSupabaseInstance: SupabaseClient | null = null

/**
 * Mendapatkan Supabase Client untuk lingkungan server (Nitro).
 * Menggunakan SUPABASE_SECRET_KEY (service_role) jika tersedia agar memiliki izin admin
 * untuk mengunduh berkas storage dan mengelola data extraction secara aman.
 */
export const getSupabaseServerClient = (): SupabaseClient => {
  if (serverSupabaseInstance) {
    return serverSupabaseInstance
  }

  const config = useRuntimeConfig()
  const supabaseUrl = (config.public.supabaseUrl || process.env.SUPABASE_URL) as string
  // Prioritaskan secret key (service role) di server; fallback ke publishable key jika belum diset
  const supabaseKey = (config.supabaseSecretKey || process.env.SUPABASE_SECRET_KEY || config.public.supabasePublishableKey || process.env.SUPABASE_PUBLISHABLE_KEY) as string

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL atau Key belum terkonfigurasi di lingkungan server.')
  }

  serverSupabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  return serverSupabaseInstance
}
