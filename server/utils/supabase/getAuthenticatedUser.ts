import type { H3Event } from 'h3'
import { getHeader, parseCookies } from 'h3'
import { getSupabaseServerClient } from './serverClient'

/**
 * Mendapatkan data pengguna yang sedang login dari request headers / cookies di server (Nitro).
 */
export async function getAuthenticatedUser(event: H3Event) {
  const supabase = getSupabaseServerClient()

  // 1. Coba dari Authorization Header (Bearer token)
  const authHeader = getHeader(event, 'authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    if (token) {
      try {
        const { data, error } = await supabase.auth.getUser(token)
        if (!error && data?.user) {
          return data.user
        }
      } catch (err) {
        console.warn('Gagal memverifikasi bearer token:', err)
      }
    }
  }

  // 2. Coba dari Cookies Supabase
  const cookies = parseCookies(event)
  for (const [name, rawVal] of Object.entries(cookies)) {
    if (name.includes('auth-token') || name === 'sb-access-token' || name.startsWith('sb-')) {
      try {
        let token = rawVal
        // Jika cookie di-encode JSON array atau JSON object
        if (rawVal.startsWith('[') || rawVal.startsWith('%5B')) {
          const decoded = decodeURIComponent(rawVal)
          const parsed = JSON.parse(decoded)
          token = Array.isArray(parsed) ? parsed[0] : parsed
        } else if (rawVal.startsWith('{') || rawVal.startsWith('%7B')) {
          const decoded = decodeURIComponent(rawVal)
          const parsed = JSON.parse(decoded)
          token = parsed.access_token || parsed[0]
        }

        if (token && typeof token === 'string' && token.length > 20) {
          const { data, error } = await supabase.auth.getUser(token)
          if (!error && data?.user) {
            return data.user
          }
        }
      } catch {
        // Lanjut ke cookie berikutnya jika gagal parse
      }
    }
  }

  return null
}
