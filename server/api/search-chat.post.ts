import { defineEventHandler, readBody, createError } from 'h3'
import type { SearchChatRequest, SearchChatResponse, LiteratureResult } from '~/types/literature'
import { extractSearchParams, analyzeLiteratures } from '../utils/gemini'
import { searchOpenAlexWorks } from '../utils/openalex'

export default defineEventHandler(async (event): Promise<SearchChatResponse> => {
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  const openalexApiKey = config.public.openalexApiKey || process.env.OPENALEX_API_KEY

  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Konfigurasi GEMINI_API_KEY belum disetel di server.'
    })
  }

  // 1. Validasi Body Request
  let body: SearchChatRequest
  try {
    body = await readBody<SearchChatRequest>(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Permintaan tidak valid: Format JSON salah.'
    })
  }

  const rawMessage = body?.message
  if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan pencarian wajib diisi.'
    })
  }

  const message = rawMessage.trim()
  if (message.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pesan pencarian maksimal 1000 karakter.'
    })
  }

  // 2. Tahap 1: Ekstraksi Parameter Pencarian melalui Gemini
  let searchParams
  try {
    searchParams = await extractSearchParams(message, geminiApiKey)
  } catch (error: any) {
    const errorMsg = String(error?.message || '')
    const status = error?.status || error?.statusCode

    if (status === 429 || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('rate limit')) {
      return {
        success: false,
        error: 'RATE_LIMIT',
        message: 'Layanan AI sedang terlalu sibuk. Silakan coba lagi beberapa saat.'
      }
    }

    console.error('Error ekstraksi parameter Gemini:', error)
    return {
      success: false,
      error: 'GEMINI_ERROR',
      message: 'Gagal memproses permintaan dengan AI. Silakan coba formulasi kata kunci lain.'
    }
  }

  // 3. Tahap 2: Query ke Basis Data OpenAlex (Maks. 5 Karya)
  let rawWorks
  try {
    rawWorks = await searchOpenAlexWorks(searchParams, openalexApiKey)
  } catch (error: any) {
    console.error('Error saat menghubungi API OpenAlex:', error?.message || error)
    return {
      success: false,
      error: 'OPENALEX_ERROR',
      message: 'Pencarian basis data literatur sedang mengalami kendala. Silakan coba lagi.'
    }
  }

  // Jika tidak ada literatur yang cocok
  if (rawWorks.length === 0) {
    return {
      success: true,
      query: searchParams,
      results: []
    }
  }

  // 4. Tahap 3: Analisis Literatur oleh Gemini (Summary, Relevance, Insight)
  const analysisMap = await analyzeLiteratures(message, rawWorks, geminiApiKey)

  // 5. Gabungkan Metadata OpenAlex dengan Hasil Analisis AI
  const results: LiteratureResult[] = rawWorks.map(work => {
    const analysis = analysisMap.get(work.id) || null
    return {
      ...work,
      analysis
    }
  })

  return {
    success: true,
    query: searchParams,
    results
  }
})
