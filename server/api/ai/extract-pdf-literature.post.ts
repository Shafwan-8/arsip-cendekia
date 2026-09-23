import { defineEventHandler, readBody, createError } from 'h3'
import { getSupabaseServerClient } from '../../utils/supabase/serverClient'
import { parsePdfToLiteratureStructure } from '../../utils/pdf/localPdfExtractor'
import type { ContentBlockSectionType } from '~/types/documentContentBlock'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    document_id: string | number
    storage_path?: string
  }>(event).catch(() => null)

  if (!body || !body.document_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parameter document_id wajib disertakan.'
    })
  }

  const documentId = body.document_id
  const supabase = getSupabaseServerClient()

  // 1. Ambil detail metadata dokumen dari database
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

  // 2. Tentukan storage path file PDF
  let storagePath = body.storage_path || ''
  if (!storagePath && document.file_url) {
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

  // Tandai status dokumen menjadi processing
  await supabase
    .from('documents')
    .update({
      extraction_status: 'processing',
      extraction_started_at: new Date().toISOString(),
      extraction_error: null
    })
    .eq('id', documentId)

  try {
    // 3. Unduh berkas PDF dari Supabase Storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('arsip_pdf')
      .download(storagePath)

    if (downloadError || !fileBlob) {
      throw new Error(`Gagal mengunduh berkas PDF dari Storage: ${downloadError?.message || 'File kosong'}`)
    }

    const arrayBuffer = await fileBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)

    // 4. Ekstrak teks secara lokal menggunakan pdfjs-dist (0 token, 100% teks utuh tanpa pihak ketiga)
    const extractionResult = await parsePdfToLiteratureStructure(pdfBuffer, document.title)

    if (!extractionResult || !extractionResult.chapters || extractionResult.chapters.length === 0) {
      throw new Error('Gagal mengekstrak teks atau struktur bab dari berkas PDF.')
    }

    // 5. Transformasi ke format DocumentContentBlock
    const blocksToInsert: any[] = []
    let blockOrder = 1

    for (const ch of extractionResult.chapters) {
      const lowerTitle = (ch.title || '').toLowerCase()
      let sectionType: ContentBlockSectionType = 'bab'

      if (ch.section_type === 'daftar_isi' || lowerTitle.includes('daftar isi')) {
        sectionType = 'daftar_isi'
      } else if (ch.section_type === 'kesimpulan' || lowerTitle.includes('kesimpulan') || lowerTitle.includes('penutup')) {
        sectionType = 'kesimpulan'
      } else if (ch.section_type === 'daftar_pustaka' || lowerTitle.includes('daftar pustaka') || lowerTitle.includes('bibliografi')) {
        sectionType = 'daftar_pustaka'
      }

      // Bangun HTML gabungan untuk bab
      const formattedSubsections = (ch.subsections || []).map((sub, sIdx) => ({
        id: `sub-${blockOrder}-${sIdx + 1}`,
        code: sub.code || `${sIdx + 1}`,
        title: sub.title || `Bagian ${sIdx + 1}`,
        content: sub.content_html || '<p></p>'
      }))

      let combinedHtml = `<h2>${ch.number ? ch.number + ': ' : ''}${ch.title}</h2>`

      if (formattedSubsections.length === 0) {
        // Bab mandiri tanpa sub-bab (Abstrak, Kata Pengantar, Daftar Isi, Daftar Pustaka)
        combinedHtml += ch.content_html || '<p></p>'
      } else {
        // Bab dengan sub-bab terstruktur (BAB I, BAB II, dst.)
        if (ch.intro_html) {
          combinedHtml += ch.intro_html
        }
        for (const sub of formattedSubsections) {
          combinedHtml += `<h3 id="${sub.id}" data-sub-id="${sub.id}">${sub.code ? sub.code + '. ' : ''}${sub.title}</h3>`
          combinedHtml += sub.content
        }
      }

      const chapterTitle = ch.number ? `${ch.number}: ${ch.title}` : ch.title

      blocksToInsert.push({
        document_id: documentId,
        block_order: blockOrder,
        section_type: sectionType,
        title: chapterTitle,
        content: {
          html: combinedHtml,
          subsections: formattedSubsections
        }
      })

      blockOrder++
    }

    // 6. Simpan blok konten ke tabel document_content_blocks
    // Hapus blok lama terlebih dahulu agar tidak duplikat
    await supabase
      .from('document_content_blocks')
      .delete()
      .eq('document_id', documentId)

    const { error: insertError } = await supabase
      .from('document_content_blocks')
      .insert(blocksToInsert)

    if (insertError) {
      throw new Error(`Gagal menyimpan blok konten ke basis data: ${insertError.message}`)
    }

    // 7. Simpan juga ke document_chapters jika ada untuk referensi navigasi halaman
    try {
      await supabase
        .from('document_chapters')
        .delete()
        .eq('document_id', documentId)

      const chapterRows = extractionResult.chapters.map((ch, idx) => ({
        document_id: documentId,
        judul_bab: ch.number ? `${ch.number}: ${ch.title}` : ch.title,
        nomor_halaman: idx + 1
      }))

      await supabase.from('document_chapters').insert(chapterRows)
    } catch (chErr) {
      console.warn('Peringatan saat menyinkronkan document_chapters:', chErr)
    }

    // 8. Update status dokumen di tabel documents
    const docUpdatePayload: Record<string, any> = {
      source: 'uploaded_editable',
      extraction_status: 'completed',
      extraction_completed_at: new Date().toISOString(),
      extraction_error: null
    }

    if (extractionResult.document_title && (!document.title || document.title.includes('.pdf'))) {
      docUpdatePayload.title = extractionResult.document_title
    }
    if (extractionResult.author && !document.author) {
      docUpdatePayload.author = extractionResult.author
    }

    await supabase
      .from('documents')
      .update(docUpdatePayload)
      .eq('id', documentId)

    return {
      success: true,
      document_id: documentId,
      total_chapters: blocksToInsert.length,
      extracted_title: extractionResult.document_title || document.title,
      blocks: blocksToInsert
    }
  } catch (err: any) {
    console.error(`[extract-pdf-literature] Gagal memproses dokumen ${documentId}:`, err)

    await supabase
      .from('documents')
      .update({
        extraction_status: 'failed',
        extraction_error: err?.message || 'Gagal mengekstrak struktur PDF.'
      })
      .eq('id', documentId)

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Gagal mengekstrak struktur PDF secara lokal.'
    })
  }
})
