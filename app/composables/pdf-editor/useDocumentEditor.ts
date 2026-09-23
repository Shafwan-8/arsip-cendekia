import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { extractStoragePath, documentCategoryConfig } from '~/utils/document'
import type { DocumentItem, DocumentCategoryConfig } from '~/types/document'
import type { PdfDocumentInfo } from '~/types/pdf-editor'

export interface UseDocumentEditorOptions {
  category: 'buku' | 'jurnal' | 'skripsi' | string
}

export const useDocumentEditor = (options: UseDocumentEditorOptions) => {
  const route = useRoute()
  const router = useRouter()
  const { client, user } = useSupabase()

  const categoryConfig = documentCategoryConfig[options.category as 'buku' | 'jurnal' | 'skripsi'] || documentCategoryConfig.buku

  const docId = (route.query.id as string) || ''
  const initialTitle = (route.query.title as string) || ''
  const initialFileUrl = (route.query.file as string) || ''
  const initialFileName = (route.query.fileName as string) || ''

  const document = ref<PdfDocumentInfo | null>(null)
  const pdfBytes = ref<ArrayBuffer | null>(null)
  const isLoading = ref(true)
  const error = ref('')

  const loadDocumentData = async () => {
    if (!docId && !initialFileUrl) {
      error.value = 'Dokumen tidak ditentukan (ID dokumen tidak ditemukan pada parameter URL).'
      isLoading.value = false
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      let fileUrlToFetch = initialFileUrl
      let fileNameResolved = initialFileName
      let docTitleResolved = initialTitle
      let resolvedCategory = options.category
      let resolvedAuthor = ''
      let resolvedPages: number | undefined = undefined

      // 1. Ambil detail metadata dokumen dari Supabase jika ada docId
      if (docId && client) {
        let query = client
          .from('documents')
          .select('*')
          .eq('id', docId)

        if (user.value?.id) {
          query = query.eq('user_id', user.value.id)
        }

        const { data, error: dbError } = await query.single()

        if (!dbError && data) {
          const item = data as DocumentItem
          docTitleResolved = item.title || docTitleResolved
          fileNameResolved = item.file_name || fileNameResolved
          fileUrlToFetch = item.file_url || fileUrlToFetch
          resolvedCategory = (item.category || resolvedCategory).toLowerCase()
          resolvedAuthor = item.author || ''
          resolvedPages = item.pages

          // Validasi kategori dokumen: jika kategori di database berbeda dengan route saat ini,
          // arahkan ke route kategori yang benar secara aman
          if (
            resolvedCategory &&
            resolvedCategory !== options.category.toLowerCase() &&
            (resolvedCategory === 'buku' || resolvedCategory === 'jurnal' || resolvedCategory === 'skripsi')
          ) {
            router.replace({
              path: `/${resolvedCategory}/edit`,
              query: { id: docId }
            })
          }

          // Jika dokumen merupakan hasil AI generation atau uploaded_editable, lewati seluruh proses fetch pdfBytes
          if (item.source === 'ai_generated' || item.source === 'uploaded_editable') {
            document.value = {
              id: docId,
              title: docTitleResolved || 'Dokumen AI',
              author: resolvedAuthor,
              fileName: fileNameResolved || 'dokumen.pdf',
              fileUrl: fileUrlToFetch || '',
              category: resolvedCategory,
              pages: resolvedPages,
              source: item.source
            }
            isLoading.value = false
            return
          }
        }
      }

      if (!fileUrlToFetch) {
        throw new Error('URL berkas dokumen PDF tidak ditemukan di database.')
      }

      document.value = {
        id: docId || Date.now().toString(),
        title: docTitleResolved || 'Dokumen PDF',
        author: resolvedAuthor,
        fileName: fileNameResolved || 'dokumen.pdf',
        fileUrl: fileUrlToFetch,
        category: resolvedCategory,
        pages: resolvedPages,
        source: 'upload'
      }

      // 2. Ambil raw bytes PDF (ArrayBuffer) untuk manipulasi pdf-lib & rendering pdf.js
      let buffer: ArrayBuffer | null = null

      try {
        const response = await fetch(fileUrlToFetch)
        if (!response.ok) {
          throw new Error(`Gagal mengunduh berkas langsung: ${response.statusText}`)
        }
        buffer = await response.arrayBuffer()
      } catch (fetchErr) {
        console.warn('Direct fetch berkas PDF gagal, mencoba fallback Supabase storage:', fetchErr)

        // Fallback: Unduh via Supabase Storage client jika direct fetch terhalang CORS
        const storagePath = extractStoragePath(fileUrlToFetch)
        if (storagePath && client) {
          const { data: blobData, error: downloadError } = await client.storage
            .from('arsip_pdf')
            .download(storagePath)

          if (downloadError || !blobData) {
            throw new Error(downloadError?.message || 'Gagal mengunduh berkas dari storage Supabase.')
          }

          buffer = await blobData.arrayBuffer()
        } else {
          throw fetchErr
        }
      }

      if (!buffer || buffer.byteLength === 0) {
        throw new Error('Berkas PDF kosong atau tidak valid.')
      }

      pdfBytes.value = buffer
    } catch (err: any) {
      console.error('Error saat inisialisasi Document Editor:', err)
      error.value = err?.message || 'Terjadi kesalahan saat memuat data dokumen PDF.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    loadDocumentData()
  })

  return {
    document,
    pdfBytes,
    isLoading,
    error,
    categoryConfig,
    source: computed(() => document.value?.source),
    reload: loadDocumentData
  }
}
