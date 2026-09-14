import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { DocumentChapter, ExtractionStatus, ExtractPdfResponse } from '~/types/documentChapter'

export const useDocumentChapters = (docIdSource: MaybeRefOrGetter<string | number | undefined | null>) => {
  const { client } = useSupabase()

  const chapters = ref<DocumentChapter[]>([])
  const extractionStatus = ref<ExtractionStatus>('pending')
  const isLoading = ref<boolean>(false)
  const isExtracting = ref<boolean>(false)
  const errorMessage = ref<string>('')

  /**
   * Mengambil daftar BAB dari Supabase jika sudah ada di database.
   */
  const fetchChapters = async (): Promise<DocumentChapter[]> => {
    const documentId = toValue(docIdSource)
    if (!documentId || !client) return []

    isLoading.value = true
    errorMessage.value = ''

    try {
      // 1. Ambil status ekstraksi dari tabel documents
      const { data: docData } = await client
        .from('documents')
        .select('extraction_status, extraction_error')
        .eq('id', documentId)
        .maybeSingle()

      if (docData?.extraction_status) {
        extractionStatus.value = docData.extraction_status as ExtractionStatus
        if (docData.extraction_error) {
          errorMessage.value = docData.extraction_error
        }
      }

      // 2. Ambil daftar chapters dari tabel document_chapters
      const { data, error } = await client
        .from('document_chapters')
        .select('*')
        .eq('document_id', documentId)
        .order('nomor_halaman', { ascending: true })

      if (error) {
        console.error('Error fetching document_chapters:', error)
      } else if (data && data.length > 0) {
        chapters.value = data as DocumentChapter[]
        extractionStatus.value = 'completed'
        return chapters.value
      } else {
        chapters.value = []
      }
    } catch (err: any) {
      console.error('Gagal mengambil data chapter:', err)
      errorMessage.value = err?.message || 'Gagal mengambil daftar BAB.'
    } finally {
      isLoading.value = false
    }

    return chapters.value
  }

  /**
   * Memicu proses ekstraksi BAB dengan Adobe PDF Extract API melalui backend Nuxt.
   */
  const extractChapters = async (force: boolean = false): Promise<DocumentChapter[]> => {
    const documentId = toValue(docIdSource)
    if (!documentId) return []

    isExtracting.value = true
    errorMessage.value = ''
    extractionStatus.value = 'processing'

    try {
      const response = await $fetch<ExtractPdfResponse>('/api/extract-pdf', {
        method: 'POST',
        body: {
          document_id: documentId,
          force
        }
      })

      if (response.success) {
        chapters.value = response.chapters || []
        extractionStatus.value = response.status || 'completed'
        return chapters.value
      } else {
        throw new Error(response.message || 'Ekstraksi tidak berhasil.')
      }
    } catch (err: any) {
      console.error('Ekstraksi BAB gagal:', err)
      extractionStatus.value = 'failed'
      errorMessage.value = err?.data?.statusMessage || err?.message || 'Gagal menganalisis struktur PDF.'
      return []
    } finally {
      isExtracting.value = false
    }
  }

  /**
   * Inisialisasi daftar BAB:
   * Periksa database terlebih dahulu (cache).
   * Jika belum ada, otomatis jalankan ekstraksi Adobe PDF Extract.
   */
  const initChapters = async () => {
    const existing = await fetchChapters()
    // Jika tidak ada chapter dan status bukan processing, lakukan ekstraksi otomatis
    if (existing.length === 0 && extractionStatus.value !== 'processing') {
      await extractChapters(false)
    }
  }

  return {
    chapters,
    extractionStatus,
    isLoading,
    isExtracting,
    errorMessage,
    fetchChapters,
    extractChapters,
    initChapters
  }
}
