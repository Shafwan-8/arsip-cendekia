export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const isAuthRoute = to.path.startsWith('/auth')

  // Jika di sisi browser user.value belum terisi (misal transisi login), verifikasi session aktif
  if (!user.value && import.meta.client) {
    const client = useSupabaseClient()
    const { data } = await client.auth.getSession()
    if (data?.session?.user) {
      try {
        const { data: claimsData } = await client.auth.getClaims()
        user.value = claimsData?.claims ?? (data.session.user as any)
      } catch {
        user.value = data.session.user as any
      }
    }
  }

  // Jika pengguna belum login dan mengakses halaman terproteksi
  if (!user.value && !isAuthRoute) {
    return navigateTo('/auth/login')
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman auth (login/register)
  if (user.value && isAuthRoute) {
    return navigateTo('/')
  }
})
