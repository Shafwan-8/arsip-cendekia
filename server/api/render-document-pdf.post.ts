import { defineEventHandler, readBody, createError } from 'h3'
import { getSupabaseServerClient } from '../utils/supabase/serverClient'
import { renderDocumentToPdf } from '../utils/pdf/renderContentToPdf'
import type { RenderPdfResponse, DocumentContentBlock } from '~/types/documentContentBlock'

// Idempotency lock map: mencegah render ganda secara bersamaan untuk satu dokumen
const activeRenders = new Set<string | number>()

export default defineEventHandler(async (event): Promise<RenderPdfResponse> => {
  let body: { document_id: string | number }
  try {
    body = await readBody<{ document_id: string | number }>(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payload request tidak valid.'
    })
  }

  const documentId = body?.document_id
  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter document_id wajib disertakan.'
    })
  }

  const supabase = getSupabaseServerClient()

  // 1. Periksa metadata dokumen
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, title, author, category, year, file_name, pdf_cache_url, pdf_cache_stale')
    .eq('id', documentId)
    .single()

  if (docError || !doc) {
    throw createError({
      statusCode: 404,
      statusMessage: `Dokumen dengan ID "${documentId}" tidak ditemukan.`
    })
  }

  // 2. Jika cache PDF masih valid (tidak stale), langsung return URL cache
  if (doc.pdf_cache_url && doc.pdf_cache_stale === false) {
    return {
      success: true,
      pdf_url: doc.pdf_cache_url,
      from_cache: true
    }
  }

  // 3. Idempotency guard: cegah pemrosesan paralel
  if (activeRenders.has(documentId)) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Proses rendering PDF untuk dokumen ini sedang berjalan. Harap tunggu sesaat.'
    })
  }

  activeRenders.add(documentId)

  try {
    // 4. Ambil semua blok konten dokumen
    const { data: blocks, error: blocksError } = await supabase
      .from('document_content_blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('block_order', { ascending: true })

    if (blocksError || !blocks || blocks.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dokumen belum memiliki konten bab untuk dirender menjadi PDF.'
      })
    }

    // 5. Render konten blok ke Buffer PDF via Puppeteer
    const pdfBuffer = await renderDocumentToPdf(blocks as DocumentContentBlock[], {
      title: doc.title,
      author: doc.author,
      category: doc.category,
      year: doc.year
    })

    // 6. Upload Buffer ke Supabase Storage bucket 'arsip_pdf'
    const categoryFolder = doc.category || 'buku'
    const cleanFileName = (doc.title || 'dokumen')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40)
    const storagePath = `ai_generated/${categoryFolder}/${documentId}_${cleanFileName}_${Date.now()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from('arsip_pdf')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Gagal mengunggah berkas PDF ke penyimpanan cloud: ${uploadError.message}`)
    }

    // 7. Ambil URL Publik
    const { data: urlData } = supabase.storage
      .from('arsip_pdf')
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl

    // 8. Update data dokumen: file_url, pdf_cache_url, dan pdf_cache_stale = false
    await supabase
      .from('documents')
      .update({
        file_url: publicUrl,
        pdf_cache_url: publicUrl,
        pdf_cache_stale: false
      })
      .eq('id', documentId)

    return {
      success: true,
      pdf_url: publicUrl,
      from_cache: false
    }
  } catch (err: any) {
    console.error('Error saat merender PDF dokumen:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Terjadi kesalahan saat merender berkas PDF.'
    })
  } finally {
    activeRenders.delete(documentId)
  }
})
