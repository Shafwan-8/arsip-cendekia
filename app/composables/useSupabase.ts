export const useSupabase = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  // Fungsi Login dengan Email & Kata Sandi
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw error
    }

    return data
  }

  // Fungsi Keluar / Logout
  const signOut = async () => {
    await client.auth.signOut()
    await navigateTo('/auth/login')
  }

  return {
    client,
    user,
    signInWithEmail,
    signOut
  }
}
