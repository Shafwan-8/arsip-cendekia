import { defineEventHandler, readBody, createError } from 'h3'
import { getSupabaseServerClient } from '../utils/supabase/serverClient'
import { extractPdfChapters } from '../utils/adobe/extractPdf'
import type { ExtractPdfRequest, ExtractPdfResponse, DocumentChapter } from '~/types/documentChapter'

export default defineEventHandler(async (event): Promise<ExtractPdfResponse> => {
  const body = await readBody<ExtractPdfRequest>(event)

  if (!body || !body.document_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter document_id wajib disertakan.'
    })
  }

  const documentId = body.document_id
  const force = !!body.force
  const supabase = getSupabaseServerClient()

  // 1. Ambil data dokumen dari database
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    throw createError({
      statusCode: 404,
      statusMessage: `Dokumen dengan ID "${documentId}" tidak ditemukan.`
    })
  }

  // 2. Tentukan Storage Path berkas PDF
  let storagePath = body.file_path || ''

  if (!storagePath && document.file_url) {
    // Ekstrak relative path dari URL Supabase Storage
    const bucketName = 'arsip_pdf'
    const marker = `/${bucketName}/`
    const idx = document.file_url.indexOf(marker)
    if (idx !== -1) {
      storagePath = decodeURIComponent(document.file_url.substring(idx + marker.length).split('?')[0])
    }
  }

  if (!storagePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path berkas PDF di Supabase Storage tidak dapat ditentukan.'
    })
  }

  // Validasi ekstensi PDF
  if (!storagePath.toLowerCase().endsWith('.pdf') && !document.file_name?.toLowerCase().endsWith('.pdf')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Berkas dokumen bukan merupakan PDF yang valid.'
    })
  }

  // 3. Caching: Cek apakah daftar BAB sudah pernah diekstrak dan disimpan sebelumnya
  if (!force) {
    const { data: existingChapters } = await supabase
      .from('document_chapters')
      .select('*')
      .eq('document_id', documentId)
      .order('nomor_halaman', { ascending: true })

    if (existingChapters && existingChapters.length > 0) {
      return {
        success: true,
        document_id: documentId,
        status: 'completed',
        message: 'Daftar BAB diambil dari basis data (cache).',
        chapters: existingChapters as DocumentChapter[],
        total_chapters: existingChapters.length
      }
    }
  }

  // 4. Guard Idempotency: Jika sedang diproses oleh request lain dalam 3 menit terakhir
  if (!force && document.extraction_status === 'processing') {
    const startedAt = document.extraction_started_at ? new Date(document.extraction_started_at).getTime() : 0
    const now = Date.now()
    if (now - startedAt < 3 * 60 * 1000) {
      return {
        success: true,
        document_id: documentId,
        status: 'processing',
        message: 'Ekstraksi struktur PDF sedang berlangsung. Harap tunggu.',
        chapters: []
      }
    }
  }

  // 5. Tandai status dokumen menjadi 'processing'
  const startTime = new Date().toISOString()
  await supabase
    .from('documents')
    .update({
      extraction_status: 'processing',
      extraction_started_at: startTime,
      extraction_error: null
    })
    .eq('id', documentId)

  try {
    // 6. Jalankan proses ekstraksi Adobe PDF Extract
    const { chapters, pageCount } = await extractPdfChapters(documentId, storagePath)

    // 7. Simpan hasil ke Supabase: Hapus chapter lama jika ada, lalu insert chapter baru
    await supabase
      .from('document_chapters')
      .delete()
      .eq('document_id', documentId)

    let savedChapters: DocumentChapter[] = []

    if (chapters.length > 0) {
      const rowsToInsert = chapters.map(ch => ({
        document_id: documentId,
        judul_bab: ch.judul_bab,
        nomor_halaman: ch.nomor_halaman
      }))

      const { data: insertedData, error: insertError } = await supabase
        .from('document_chapters')
        .insert(rowsToInsert)
        .select('*')

      if (insertError) {
        throw new Error(`Gagal menyimpan daftar BAB ke database: ${insertError.message}`)
      }

      savedChapters = (insertedData as DocumentChapter[]) || chapters
    }

    // 8. Update status dokumen menjadi 'completed'
    const updatePayload: Record<string, any> = {
      extraction_status: 'completed',
      extraction_completed_at: new Date().toISOString(),
      extraction_error: null
    }

    if (pageCount && (!document.pages || document.pages === 0)) {
      updatePayload.pages = pageCount
    }

    await supabase
      .from('documents')
      .update(updatePayload)
      .eq('id', documentId)

    return {
      success: true,
      document_id: documentId,
      status: 'completed',
      message: chapters.length > 0 
        ? `Berhasil mengekstrak ${chapters.length} BAB.` 
        : 'Ekstraksi selesai. Tidak ada struktur BAB terdeteksi pada dokumen ini.',
      chapters: savedChapters,
      total_chapters: savedChapters.length
    }
  } catch (err: any) {
    console.error(`[Adobe Extract Error - Doc ${documentId}]:`, err)

    const errorMessage = err?.message || 'Terjadi kesalahan internal saat ekstraksi PDF.'

    // Update status dokumen menjadi 'failed'
    await supabase
      .from('documents')
      .update({
        extraction_status: 'failed',
        extraction_error: errorMessage.substring(0, 500)
      })
      .eq('id', documentId)

    throw createError({
      statusCode: 500,
      statusMessage: errorMessage
    })
  }
})
