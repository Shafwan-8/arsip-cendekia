import { defineEventHandler, readBody, createError, setHeader } from 'h3'
import type { SearchRequest, LiteratureReference } from '~/types/aiSearch'
import { searchWorks } from '../utils/openalex/searchWorks'
import { buildLiteratureContext } from '../utils/openalex/buildLiteratureContext'
import { buildResearchPrompt } from '../utils/ai/buildResearchPrompt'
import { streamResearchAnswer } from '../utils/ai/streamResearchAnswer'
import { analyzeLiteratures } from '../utils/ai/analyzeLiteratures'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY
  const openalexApiKey = config.public?.openalexApiKey || process.env.OPENALEX_API_KEY

  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY belum dikonfigurasi di server.'
    })
  }

  // 1. Validasi Input Query
  let body: SearchRequest
  try {
    body = await readBody<SearchRequest>(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format request tidak valid.'
    })
  }

  const rawQuery = body?.query
  if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query pencarian wajib diisi.'
    })
  }

  const query = rawQuery.trim()
  if (query.length > 1000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query pencarian melebihi batas maksimal 1000 karakter.'
    })
  }

  // Set SSE Headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no') // Nginx buffering off

  const abortController = new AbortController()
  if (event.node?.req) {
    event.node.req.on('close', () => {
      abortController.abort()
    })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (eventType: string, data: Record<string, any>) => {
        try {
          const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        } catch {
          // Controller might be closed
        }
      }

      try {
        // 2. OpenAlex Retrieval (Maksimal 5 literatur)
        let references: LiteratureReference[] = []
        try {
          references = await searchWorks(query, {
            apiKey: openalexApiKey
          })
        } catch (openAlexErr: any) {
          const status = openAlexErr?.response?.status
          if (status === 429) {
            sendEvent('error', {
              code: 'OPENALEX_RATE_LIMIT',
              message: 'Pencarian basis data OpenAlex sedang mencapai batas permintaan. Silakan coba lagi.'
            })
          } else {
            sendEvent('error', {
              code: 'OPENALEX_ERROR',
              message: 'Terjadi kendala saat mencari literatur di basis data OpenAlex. Silakan coba lagi.'
            })
          }
          controller.close()
          return
        }

        // Kirim event pertama: references (Optimistic UI di frontend)
        sendEvent('references', { references })

        if (references.length === 0) {
          sendEvent('token', {
            text: 'Tidak ditemukan literatur akademik yang relevan dengan kata kunci pencarian Anda pada basis data OpenAlex. Silakan coba gunakan kata kunci yang lebih umum atau periksa rentang tahun.'
          })
          sendEvent('done', { success: true })
          controller.close()
          return
        }

        // 3. Bangun Konteks RAG & Prompt
        const literatureContext = buildLiteratureContext(references)
        const { systemInstruction, contents } = buildResearchPrompt(query, literatureContext, references.length)

        // 4. Streaming Jawaban Riset Sintesis dari Gemini
        try {
          for await (const token of streamResearchAnswer({
            apiKey: geminiApiKey,
            systemInstruction,
            contents,
            signal: abortController.signal
          })) {
            if (abortController.signal.aborted) break
            sendEvent('token', { text: token })
          }
        } catch (geminiErr: any) {
          console.error('[ai-search-stream] Gemini streaming error:', geminiErr)
          const status = geminiErr?.status || geminiErr?.code
          const errMsg = String(geminiErr?.message || '')
          if (status === 429 || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            sendEvent('error', {
              code: 'GEMINI_RATE_LIMIT',
              message: 'Layanan AI sedang mencapai batas kapasitas. Silakan coba lagi beberapa saat.'
            })
          } else if (status === 503 || errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
            sendEvent('error', {
              code: 'GEMINI_RATE_LIMIT',
              message: 'Server AI sedang mengalami lonjakan trafik. Silakan klik Cari lagi untuk mencoba ulang.'
            })
          } else {
            sendEvent('error', {
              code: 'GEMINI_ERROR',
              message: 'Terjadi kendala pada layanan AI saat mensintesis jawaban riset.'
            })
          }
          controller.close()
          return
        }

        // 5. Analisis Terstruktur untuk Summary & Insight (Single Batch Request)
        if (!abortController.signal.aborted) {
          try {
            const analysisMap = await analyzeLiteratures(query, references, geminiApiKey)
            const analyses = Array.from(analysisMap.values())
            sendEvent('analysis', { analyses })
          } catch (analysisErr) {
            console.warn('Gagal analisis tambahan literatur:', analysisErr)
          }
        }

        // 6. Selesai
        sendEvent('done', { success: true })
      } catch (fatalErr: any) {
        console.error('Fatal streaming error:', fatalErr)
        sendEvent('error', {
          code: 'INTERNAL_ERROR',
          message: 'Terjadi kendala internal saat memproses pencarian.'
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    },
    cancel() {
      abortController.abort()
    }
  })

  return stream
})
