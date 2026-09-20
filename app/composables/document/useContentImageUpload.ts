import { ref } from 'vue'
import { createStoragePath } from '~/utils/document'

export function useContentImageUpload() {
  const { client } = useSupabase()
  const isUploading = ref(false)
  const uploadError = ref('')

  /**
   * Mengunggah berkas gambar ke Supabase Storage bucket 'arsip_pdf' folder 'content-images/'
   * dan mengembalikan public URL gambar untuk disisipkan ke TipTap.
   */
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null

    // Validasi tipe berkas
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validMimes.includes(file.type)) {
      uploadError.value = 'Format gambar tidak didukung. Harap unggah PNG, JPG, JPEG, atau WebP.'
      return null
    }

    // Validasi ukuran (maksimal 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      uploadError.value = 'Ukuran berkas gambar maksimal 5 MB.'
      return null
    }

    if (!client) {
      uploadError.value = 'Koneksi penyimpanan Supabase tidak tersedia.'
      return null
    }

    isUploading.value = true
    uploadError.value = ''

    try {
      const storagePath = createStoragePath('content-images', file.name)

      const { error: storageError } = await client.storage
        .from('arsip_pdf')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        throw new Error(storageError.message)
      }

      const { data } = client.storage
        .from('arsip_pdf')
        .getPublicUrl(storagePath)

      return data?.publicUrl || null
    } catch (err: any) {
      console.error('[useContentImageUpload] Gagal mengunggah gambar:', err)
      uploadError.value = err?.message || 'Gagal mengunggah gambar ke storage.'
      return null
    } finally {
      isUploading.value = false
    }
  }

  return {
    isUploading,
    uploadError,
    uploadImage
  }
}
