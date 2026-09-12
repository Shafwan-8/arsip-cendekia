import { ref } from 'vue'
import type { DocumentItem } from '~/types/document'
import { extractStoragePath } from '~/utils/document'

export interface UseDocumentDeleteOptions {
  getActiveUserId: () => Promise<string | null>
  onSuccess?: (title: string) => Promise<void> | void
  onError?: (msg: string) => void
}

export const useDocumentDelete = (options: UseDocumentDeleteOptions) => {
  const { getActiveUserId, onSuccess, onError } = options
  const { client } = useSupabase()

  const isDeleteModalOpen = ref(false)
  const selectedDocumentToDelete = ref<DocumentItem | null>(null)
  const isDeleting = ref(false)

  const openDeleteModal = (doc: DocumentItem) => {
    selectedDocumentToDelete.value = doc
    isDeleteModalOpen.value = true
  }

  const closeDeleteModal = () => {
    if (isDeleting.value) return
    isDeleteModalOpen.value = false
    selectedDocumentToDelete.value = null
  }

  const confirmDelete = async () => {
    if (!selectedDocumentToDelete.value || !client) return
    isDeleting.value = true

    try {
      const docToDelete = selectedDocumentToDelete.value
      const docTitle = docToDelete.title
      const currentUserId = await getActiveUserId()

      // 1. Hapus berkas fisik PDF dari Supabase Storage (bucket "arsip_pdf")
      if (docToDelete.file_url) {
        const storagePath = extractStoragePath(docToDelete.file_url)
        if (storagePath) {
          const { error: storageError } = await client.storage
            .from('arsip_pdf')
            .remove([storagePath])

          if (storageError) {
            console.warn('Gagal menghapus file dari storage arsip_pdf:', storageError.message)
          }
        }
      }

      // 2. Hapus data record dari tabel "documents"
      let deleteQuery = client
        .from('documents')
        .delete()
        .eq('id', docToDelete.id)

      if (currentUserId) {
        deleteQuery = deleteQuery.eq('user_id', currentUserId)
      }

      const { error: dbError } = await deleteQuery
      if (dbError) {
        throw dbError
      }

      // 3. Tutup otomatis modal konfirmasi delete
      isDeleteModalOpen.value = false
      selectedDocumentToDelete.value = null

      if (onSuccess) {
        await onSuccess(docTitle)
      }
    } catch (err: any) {
      console.error('Delete error:', err)
      if (onError) {
        onError(err?.message || 'Gagal menghapus dokumen.')
      }
    } finally {
      isDeleting.value = false
    }
  }

  return {
    isDeleteModalOpen,
    selectedDocumentToDelete,
    isDeleting,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete
  }
}
