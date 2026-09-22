import { defineEventHandler, readBody, createError, setHeader } from 'h3'
import { buildConclusionPrompt } from '../../utils/ai/buildBookGenerationPrompt'
import { streamGeminiContent } from '../../utils/ai/streamGeminiContent'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY belum dikonfigurasi di server.'
    })
  }

  const body = await readBody<{
    title?: string
    summaries?: string
  }>(event).catch(() => null)

  const title = (body?.title || '').trim()
  const summaries = (body?.summaries || '').trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul karya wajib diisi.'
    })
  }

  // Set SSE Headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

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
          // Closed
        }
      }

      try {
        const conclusionPromptData = buildConclusionPrompt(title, summaries)
        let accumulatedText = ''

        for await (const token of streamGeminiContent({
          apiKey: geminiApiKey,
          systemInstruction: conclusionPromptData.systemInstruction,
          contents: conclusionPromptData.contents,
          signal: abortController.signal,
          temperature: 0.3
        })) {
          if (abortController.signal.aborted) break
          accumulatedText += token
          sendEvent('token', { text: token })
        }

        if (!abortController.signal.aborted) {
          sendEvent('done', {
            title: 'Kesimpulan dan Rekomendasi',
            text: accumulatedText
          })
        }
      } catch (err: any) {
        console.error('[ai/conclusion-stream] Error saat menulis kesimpulan:', err)
        sendEvent('error', {
          message: err?.message || 'Gagal menulis bab kesimpulan.'
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Closed
        }
      }
    },
    cancel() {
      abortController.abort()
    }
  })

  return stream
})
