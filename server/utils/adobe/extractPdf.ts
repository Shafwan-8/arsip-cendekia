import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import AdmZip from 'adm-zip'
import {
  MimeType,
  ExtractPDFJob,
  ExtractPDFParams,
  ExtractElementType,
  ExtractPDFResult
} from '@adobe/pdfservices-node-sdk'
import { getAdobePdfServices } from './adobeClient'
import { parseChaptersFromAdobeJson, type AdobeExtractJson } from './parseChapters'
import { getSupabaseServerClient } from '../supabase/serverClient'
import type { DocumentChapter } from '~/types/documentChapter'

export interface ExtractResult {
  chapters: DocumentChapter[]
  pageCount?: number
}

/**
 * Mengunduh berkas PDF dari Supabase Storage menjadi Buffer di memori server.
 */
export const downloadPdfFromSupabase = async (storagePath: string, bucket: string = 'arsip_pdf'): Promise<Buffer> => {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase.storage.from(bucket).download(storagePath)

  if (error || !data) {
    throw new Error(`Gagal mengunduh berkas PDF dari Supabase Storage (${bucket}/${storagePath}): ${error?.message || 'Data kosong'}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Pipeline utama ekstraksi struktur dan navigasi BAB menggunakan Adobe PDF Extract API.
 * Menjamin pembersihan berkas temporer di blok finally.
 */
export const extractPdfChapters = async (
  documentId: string | number,
  storagePath: string
): Promise<ExtractResult> => {
  const tempDir = os.tmpdir()
  const uniqueId = `${documentId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  const tempPdfPath = path.join(tempDir, `pdf-extract-${uniqueId}.pdf`)

  try {
    // 1. Unduh PDF dari Supabase Storage
    const pdfBuffer = await downloadPdfFromSupabase(storagePath)

    // 2. Tulis ke berkas temporer lokal untuk input Adobe SDK
    await fs.promises.writeFile(tempPdfPath, pdfBuffer)

    // 3. Inisialisasi Adobe PDF Services SDK
    const pdfServices = getAdobePdfServices()

    // 4. Unggah berkas ke Adobe Cloud Asset
    const readStream = fs.createReadStream(tempPdfPath)
    const inputAsset = await pdfServices.upload({
      readStream,
      mimeType: MimeType.PDF
    })

    // 5. Konfigurasi parameter ekstraksi (ekstrak teks dan informasi styling)
    const params = new ExtractPDFParams({
      elementsToExtract: [ExtractElementType.TEXT],
      getStylingInfo: true
    })

    // 6. Buat dan kirim job ekstraksi
    const job = new ExtractPDFJob({
      inputAsset,
      params
    })

    const pollingURL = await pdfServices.submit({ job })

    // 7. Polling status hasil pekerjaan ekstraksi
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: ExtractPDFResult
    })

    if (!pdfServicesResponse?.result?.resource) {
      throw new Error('Adobe PDF Extract tidak mengembalikan aset hasil ekstraksi.')
    }

    // 8. Ambil konten stream hasil arsip zip
    const resultAsset = pdfServicesResponse.result.resource
    const streamAsset = await pdfServices.getContent({ asset: resultAsset })

    // Baca stream zip ke Buffer
    const chunks: Buffer[] = []
    for await (const chunk of streamAsset.readStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const zipBuffer = Buffer.concat(chunks)

    // 9. Ekstrak file structuredData.json di memori menggunakan adm-zip
    const zip = new AdmZip(zipBuffer)
    const jsonEntry = zip.getEntry('structuredData.json')

    if (!jsonEntry) {
      throw new Error('Berkas structuredData.json tidak ditemukan dalam arsip hasil Adobe Extract.')
    }

    const jsonText = zip.readAsText(jsonEntry)
    const extractJson = JSON.parse(jsonText) as AdobeExtractJson

    // 10. Deteksi dan normalisasi daftar BAB
    const chapters = parseChaptersFromAdobeJson(extractJson, documentId)
    const pageCount = extractJson.extended_metadata?.page_count

    return {
      chapters,
      pageCount
    }
  } finally {
    // WAJIB: Bersihkan berkas temporer di server (baik sukses maupun error)
    if (fs.existsSync(tempPdfPath)) {
      try {
        await fs.promises.unlink(tempPdfPath)
      } catch (cleanErr) {
        console.warn('Gagal menghapus berkas temporer:', tempPdfPath, cleanErr)
      }
    }
  }
}
