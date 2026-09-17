export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  const isAuthRoute = to.path.startsWith('/auth')

  // Jika pengguna belum login dan mengakses halaman terproteksi
  if (!user.value && !isAuthRoute) {
    return navigateTo('/auth/login')
  }

  // Jika pengguna sudah login dan mencoba mengakses halaman auth (login/register)
  if (user.value && isAuthRoute) {
    return navigateTo('/')
  }
})
