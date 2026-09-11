export default defineNuxtRouteMiddleware(async (to) => {
  const isAuthRoute = to.path.startsWith('/auth')
  const { user, session, authCookie, client } = useSupabase()

  // Verifikasi autentikasi di sisi browser/klien
  if (import.meta.client && client) {
    const { data } = await client.auth.getSession()
    const isAuthenticated = !!data.session

    if (!isAuthenticated && !isAuthRoute) {
      return navigateTo('/auth/login')
    }

    if (isAuthenticated && isAuthRoute) {
      return navigateTo('/')
    }
    return
  }

  // Verifikasi di sisi server (SSR) menggunakan cookie sesi
  const isServerAuthenticated = !!authCookie.value || !!user.value || !!session.value

  if (!isServerAuthenticated && !isAuthRoute) {
    return navigateTo('/auth/login')
  }

  if (isServerAuthenticated && isAuthRoute) {
    return navigateTo('/')
  }
})
