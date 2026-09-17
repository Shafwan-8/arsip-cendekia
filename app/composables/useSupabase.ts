export const useSupabase = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const session = useSupabaseSession()

  // Fungsi Login dengan Email & Kata Sandi
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    // Pastikan user & session terisi langsung tanpa menunggu async event listener
    if (data.session) {
      session.value = data.session
      try {
        const { data: claimsData } = await client.auth.getClaims()
        user.value = claimsData?.claims ?? (data.user as any)
      } catch {
        user.value = data.user as any
      }
    }

    return data
  }

  // Fungsi Keluar / Logout
  const signOut = async () => {
    user.value = null
    session.value = null
    await client.auth.signOut()
    await navigateTo('/auth/login', { replace: true })
  }

  return {
    client,
    user,
    session,
    signInWithEmail,
    signOut
  }
}
