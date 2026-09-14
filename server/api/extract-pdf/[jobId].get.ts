import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getSupabaseServerClient } from '../../utils/supabase/serverClient'
import type { ExtractPdfResponse, DocumentChapter, ExtractionStatus } from '~/types/documentChapter'

export default defineEventHandler(async (event): Promise<ExtractPdfResponse> => {
  const documentId = getRouterParam(event, 'jobId')

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter jobId / document_id wajib disertakan.'
    })
  }

  const supabase = getSupabaseServerClient()

  // Ambil metadata status dokumen
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, extraction_status, extraction_error, extraction_started_at, extraction_completed_at')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    throw createError({
      statusCode: 404,
      statusMessage: `Dokumen dengan ID "${documentId}" tidak ditemukan.`
    })
  }

  const status = (document.extraction_status as ExtractionStatus) || 'pending'

  // Ambil daftar chapters jika status completed
  let chapters: DocumentChapter[] = []
  if (status === 'completed') {
    const { data: chapterData } = await supabase
      .from('document_chapters')
      .select('*')
      .eq('document_id', documentId)
      .order('nomor_halaman', { ascending: true })

    if (chapterData) {
      chapters = chapterData as DocumentChapter[]
    }
  }

  return {
    success: true,
    document_id: documentId,
    status,
    message: document.extraction_error || undefined,
    chapters,
    total_chapters: chapters.length
  }
})
