import { ref } from 'vue'
import type { DocumentItem } from '~/types/document'

export interface UseDocumentsOptions {
  category: string
}

export const useDocuments = (options: UseDocumentsOptions) => {
  const { category } = options
  const { client, user } = useSupabase()

  const documents = ref<DocumentItem[]>([])
  const isLoading = ref(false)
  const error = ref('')

  // Helper memastikan ID pengguna aktif dari session
  const getActiveUserId = async (): Promise<string | null> => {
    if (user.value?.id) return user.value.id
    if (client) {
      const { data } = await client.auth.getUser()
      if (data?.user?.id) {
        user.value = data.user
        return data.user.id
      }
    }
    return null
  }

  // Mengambil daftar dokumen sesuai kategori dari Supabase
  const fetchDocuments = async () => {
    isLoading.value = true
    error.value = ''

    try {
      if (!client) return

      const { data: sessionData } = await client.auth.getSession()
      const activeUser = sessionData?.session?.user ?? user.value
      const currentUserId = activeUser?.id

      let query = client
        .from('documents')
        .select('*')
        .eq('category', category)

      // Filter dokumen milik pengguna yang sedang login jika ada
      if (currentUserId) {
        query = query.eq('user_id', currentUserId)
      }

      const { data, error: fetchErr } = await query.order('id', { ascending: false })

      if (fetchErr) {
        console.error('Error fetching documents table:', fetchErr)
        error.value = fetchErr.message
      } else if (data) {
        documents.value = data as DocumentItem[]
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      error.value = err?.message || 'Gagal mengambil data dari Supabase.'
    } finally {
      isLoading.value = false
    }
  }

  // Menghapus data record dari tabel documents
  const deleteDocumentRecord = async (documentId: string | number, currentUserId?: string | null) => {
    if (!client) throw new Error('Supabase client belum siap.')

    let deleteQuery = client
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (currentUserId) {
      deleteQuery = deleteQuery.eq('user_id', currentUserId)
    }

    const { error: dbError } = await deleteQuery
    if (dbError) {
      throw dbError
    }
  }

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    deleteDocumentRecord,
    getActiveUserId
  }
}
