import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export const useSupabase = () => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabasePublishableKey as string

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  const user = useState<User | null>('supabase_user', () => null)
  const session = useState<Session | null>('supabase_session', () => null)
  const isAuthReady = useState<boolean>('supabase_auth_ready', () => false)
  const authCookie = useCookie<boolean>('sb-is-authenticated', {
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    default: () => false
  })

  // Sinkronisasi state autentikasi di sisi browser
  if (import.meta.client && !isAuthReady.value) {
    supabaseInstance.auth.getSession().then(({ data }) => {
      session.value = data.session
      user.value = data.session?.user ?? null
      authCookie.value = !!data.session
      isAuthReady.value = true
    })

    supabaseInstance.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
      authCookie.value = !!newSession
      isAuthReady.value = true
    })
  }

  // Fungsi Login dengan Email & Kata Sandi
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabaseInstance) throw new Error('Supabase client belum terinisialisasi')
    
    const { data, error } = await supabaseInstance.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    session.value = data.session
    user.value = data.user
    authCookie.value = true

    return data
  }

  // Fungsi Keluar / Logout
  const signOut = async () => {
    if (!supabaseInstance) return

    await supabaseInstance.auth.signOut()
    session.value = null
    user.value = null
    authCookie.value = false

    await navigateTo('/auth/login')
  }

  return {
    client: supabaseInstance,
    user,
    session,
    isAuthReady,
    authCookie,
    signInWithEmail,
    signOut
  }
}
