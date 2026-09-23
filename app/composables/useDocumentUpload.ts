import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DocumentUploadForm } from '~/types/document'
import { formatFileSize, createStoragePath } from '~/utils/document'

export interface UseDocumentUploadOptions {
  category: string
  storageFolder: string
  getActiveUserId: () => Promise<string | null>
  onSuccess?: (title: string) => Promise<void> | void
}

export const useDocumentUpload = (options: UseDocumentUploadOptions) => {
  const router = useRouter()
  const { category, storageFolder, getActiveUserId, onSuccess } = options
  const { client } = useSupabase()

  const isUploadModalOpen = ref(false)
  const isUploading = ref(false)
  const uploadErrorMessage = ref('')
  const uploadProgressText = ref('')
  const uploadMode = ref<'edit_ai' | 'annotate'>('edit_ai')
  const isDragging = ref(false)
  const selectedFile = ref<File | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  const uploadForm = ref<DocumentUploadForm>({
    title: '',
    author: '',
    publisher: '',
    category,
    year: '',
    file_name: '',
    file_size: '',
    pages: '',
    status: 'Pribadi'
  })

  const resetUploadForm = () => {
    uploadForm.value = {
      title: '',
      author: '',
      publisher: '',
      category,
      year: '',
      file_name: '',
      file_size: '',
      pages: '',
      status: 'Pribadi'
    }
    selectedFile.value = null
    uploadErrorMessage.value = ''
    uploadProgressText.value = ''
    uploadMode.value = 'edit_ai'
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }

  const openUploadModal = () => {
    resetUploadForm()
    isUploadModalOpen.value = true
  }

  const closeUploadModal = () => {
    if (isUploading.value) return
    isUploadModalOpen.value = false
    resetUploadForm()
  }

  const processSelectedFile = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      uploadErrorMessage.value = 'Harap pilih berkas dokumen berformat PDF.'
      return
    }

    uploadErrorMessage.value = ''
    selectedFile.value = file
    uploadForm.value.file_name = file.name
    uploadForm.value.file_size = formatFileSize(file.size)

    // Otomatis isi judul jika belum diisi
    if (!uploadForm.value.title) {
      uploadForm.value.title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    }
  }

  const onFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files[0]) {
      processSelectedFile(target.files[0])
    }
  }

  const onDropFile = (e: DragEvent) => {
    isDragging.value = false
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleUploadSubmit = async () => {
    if (!client) {
      uploadErrorMessage.value = 'Supabase client belum siap.'
      return
    }

    if (!selectedFile.value) {
      uploadErrorMessage.value = 'Silakan pilih atau seret file PDF terlebih dahulu.'
      return
    }

    if (!uploadForm.value.title.trim()) {
      uploadErrorMessage.value = 'Judul dokumen wajib diisi.'
      return
    }

    isUploading.value = true
    uploadErrorMessage.value = ''

    try {
      const file = selectedFile.value
      const filePath = createStoragePath(storageFolder, file.name)

      // 1. Upload berkas ke bucket "arsip_pdf" di Supabase Storage
      const { error: storageError } = await client.storage
        .from('arsip_pdf')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (storageError) {
        throw new Error(`Gagal upload berkas ke storage arsip_pdf: ${storageError.message}`)
      }

      // 2. Dapatkan URL berkas dari Storage
      const { data: urlData } = client.storage
        .from('arsip_pdf')
        .getPublicUrl(filePath)

      const filePublicUrl = urlData.publicUrl

      // 3. Dapatkan User ID yang sedang login
      const currentUserId = await getActiveUserId()
      if (!currentUserId) {
        uploadErrorMessage.value = 'Sesi login tidak ditemukan. Silakan login kembali.'
        return
      }

      // 4. Masukkan record data ke tabel "documents" di Supabase
      //    Field opsional yang kosong diganti dengan "-"
      const authorVal = uploadForm.value.author.trim()
      const publisherVal = uploadForm.value.publisher.trim()
      const yearVal = uploadForm.value.year ? Number(uploadForm.value.year) : 0
      const pagesVal = uploadForm.value.pages ? Number(uploadForm.value.pages) : 0

      const isEditAi = uploadMode.value === 'edit_ai'

      const newRecord = {
        user_id: currentUserId,
        title: uploadForm.value.title.trim(),
        author: authorVal || '-',
        publisher: publisherVal || '-',
        category,
        year: yearVal,
        pages: pagesVal,
        file_name: uploadForm.value.file_name,
        file_size: uploadForm.value.file_size,
        file_url: filePublicUrl,
        status: uploadForm.value.status,
        source: isEditAi ? 'uploaded_editable' : 'upload',
        extraction_status: isEditAi ? 'processing' : 'pending',
        uploaded_at: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      }

      const { data: insertedData, error: insertError } = await client
        .from('documents')
        .insert([newRecord])
        .select()
        .single()

      if (insertError) {
        throw new Error(`Gagal menyimpan data ke tabel documents: ${insertError.message}`)
      }

      const uploadedTitle = uploadForm.value.title

      // Jika mode Editor Terstruktur dipilih, jalankan ekstraksi lokal
      if (isEditAi && insertedData?.id) {
        uploadProgressText.value = 'Mengekstrak dan menyusun struktur Bab & Sub-bab...'
        try {
          await $fetch('/api/ai/extract-pdf-literature', {
            method: 'POST',
            body: {
              document_id: insertedData.id,
              storage_path: filePath
            }
          })
        } catch (extractErr: any) {
          console.warn('Peringatan: Ekstraksi AI menghadapi kendala, dokumen tetap dapat dibuka:', extractErr)
        }

        isUploadModalOpen.value = false
        resetUploadForm()

        if (onSuccess) {
          await onSuccess(uploadedTitle)
        }

        // Alihkan langsung ke halaman editor dokumen
        await router.push({
          path: `/${category}/edit`,
          query: { id: insertedData.id }
        })
        return
      }

      isUploadModalOpen.value = false
      resetUploadForm()

      if (onSuccess) {
        await onSuccess(uploadedTitle)
      }
    } catch (err: any) {
      console.error('Upload Error:', err)
      uploadErrorMessage.value = err?.message || 'Terjadi kesalahan saat mengunggah berkas.'
    } finally {
      isUploading.value = false
      uploadProgressText.value = ''
    }
  }

  return {
    uploadForm,
    selectedFile,
    isUploading,
    uploadErrorMessage,
    uploadProgressText,
    uploadMode,
    isDragging,
    fileInputRef,
    isUploadModalOpen,
    openUploadModal,
    closeUploadModal,
    processSelectedFile,
    onFileChange,
    onDropFile,
    handleUploadSubmit,
    resetUploadForm
  }
}
