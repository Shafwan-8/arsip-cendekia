import { ref } from 'vue'
import type { RenderPdfResponse } from '~/types/documentContentBlock'

/**
 * Composable untuk memicu dan memantau rendering PDF dokumen secara on-demand.
 */
export function useDocumentPdfRender() {
  const isRendering = ref(false)
  const pdfUrl = ref<string | null>(null)
  const errorMessage = ref('')

  /**
   * Meminta backend untuk merender konten dokumen ke berkas PDF (dengan cache guard)
   */
  const requestPdfRender = async (documentId: string | number): Promise<string | null> => {
    if (!documentId) return null

    isRendering.value = true
    errorMessage.value = ''

    try {
      const response = await $fetch<RenderPdfResponse>('/api/render-document-pdf', {
        method: 'POST',
        body: { document_id: documentId }
      })

      if (response && response.success && response.pdf_url) {
        pdfUrl.value = response.pdf_url
        return response.pdf_url
      }

      throw new Error('URL berkas PDF tidak ditemukan dalam respon.')
    } catch (err: any) {
      console.error('Gagal merender PDF dokumen:', err)
      errorMessage.value = err?.data?.statusMessage || err?.message || 'Terjadi kesalahan saat memproses PDF.'
      return null
    } finally {
      isRendering.value = false
    }
  }

  /**
   * Mengunduh berkas PDF ke perangkat pengguna
   */
  const downloadPdf = async (documentId: string | number, defaultFileName: string = 'dokumen.pdf') => {
    const url = await requestPdfRender(documentId)
    if (!url) return

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.download = defaultFileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  return {
    isRendering,
    pdfUrl,
    errorMessage,
    requestPdfRender,
    downloadPdf
  }
}
