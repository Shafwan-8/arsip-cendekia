import { defineEventHandler, readBody, createError, setHeader } from 'h3'
import type { GenerateBookRequest } from '~/types/documentContentBlock'
import type { LiteratureReference } from '~/types/literatureReference'
import { getGeminiClient, getGeminiFallbackModels } from '../utils/ai/geminiClient'
import { buildOutlinePrompt, buildChapterPrompt, buildConclusionPrompt } from '../utils/ai/buildBookGenerationPrompt'
import { streamGeminiContent } from '../utils/ai/streamGeminiContent'
import { searchWorks } from '../utils/openalex/searchWorks'
import { formatApaCitation } from '../utils/openalex/formatCitation'

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

  // 1. Validasi Input Request
  let body: GenerateBookRequest
  try {
    body = await readBody<GenerateBookRequest>(event)
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format payload request tidak valid.'
    })
  }

  const rawTitle = body?.title
  const category = (body?.category || 'buku') as 'buku' | 'jurnal' | 'skripsi'

  if (typeof rawTitle !== 'string' || !rawTitle.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul karya literatur wajib diisi.'
    })
  }

  const title = rawTitle.trim()
  if (title.length > 300) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul melebihi batas maksimal 300 karakter.'
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
          // Stream controller might be closed
        }
      }

      try {
        // 2. Generate Outline Bab (Daftar Isi) via Gemini
        const outlinePrompt = buildOutlinePrompt(title, category)
        const ai = getGeminiClient(geminiApiKey)
        const models = getGeminiFallbackModels()

        let chapters: string[] = []
        let lastError: any = null

        for (const model of models) {
          if (abortController.signal.aborted) break
          try {
            const outlineRes = await ai.models.generateContent({
              model,
              contents: outlinePrompt.contents,
              config: {
                systemInstruction: outlinePrompt.systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: outlinePrompt.responseSchema
              }
            })

            const outlineText = outlineRes.text?.trim() || '{}'
            const parsed = JSON.parse(outlineText) as { chapters?: string[] }
            if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
              chapters = parsed.chapters.map(c => c.trim()).filter(Boolean)
              break
            }
          } catch (mErr) {
            lastError = mErr
            console.warn(`[ai-generate-book] Model ${model} gagal membuat outline:`, mErr)
          }
        }

        if (chapters.length === 0) {
          throw lastError || new Error('Gagal menyusun daftar isi/outline dengan AI.')
        }

        const daftarIsiMarkdown = `# Daftar Isi\n\n` +
          chapters.map((ch, idx) => `${idx + 1}. ${ch}`).join('\n') +
          `\n${chapters.length + 1}. Kesimpulan dan Rekomendasi\n${chapters.length + 2}. Daftar Pustaka`

        sendEvent('outline', {
          chapters,
          daftarIsiMarkdown
        })

        // 3. Loop Penulisan Bab demi Bab
        const chapterSummaries: string[] = []

        for (let i = 0; i < chapters.length; i++) {
          if (abortController.signal.aborted) break

          const chapterTitle = chapters[i]
          sendEvent('chapter_start', { index: i, title: chapterTitle })

          const prevSummary = chapterSummaries.length > 0 ? chapterSummaries.slice(-2).join('\n') : null
          const chapterPromptData = buildChapterPrompt(title, chapterTitle, prevSummary)

          let chapterAccumulatedText = ''

          for await (const token of streamGeminiContent({
            apiKey: geminiApiKey,
            systemInstruction: chapterPromptData.systemInstruction,
            contents: chapterPromptData.contents,
            signal: abortController.signal,
            temperature: 0.35
          })) {
            if (abortController.signal.aborted) break
            chapterAccumulatedText += token
            sendEvent('chapter_token', { index: i, text: token })
          }

          if (abortController.signal.aborted) break

          chapterSummaries.push(`- ${chapterTitle}: Membahas aspek fundamental dan analisis lanjutan mengenai topik tersebut.`)

          sendEvent('chapter_done', {
            index: i,
            title: chapterTitle,
            text: chapterAccumulatedText
          })
        }

        if (abortController.signal.aborted) return

        // 4. Penulisan Bab Kesimpulan
        const conclusionIndex = chapters.length
        const conclusionTitle = 'Kesimpulan dan Rekomendasi'
        sendEvent('chapter_start', { index: conclusionIndex, title: conclusionTitle })

        const conclusionPromptData = buildConclusionPrompt(title, chapterSummaries.join('\n'))
        let conclusionAccumulatedText = ''

        for await (const token of streamGeminiContent({
          apiKey: geminiApiKey,
          systemInstruction: conclusionPromptData.systemInstruction,
          contents: conclusionPromptData.contents,
          signal: abortController.signal,
          temperature: 0.3
        })) {
          if (abortController.signal.aborted) break
          conclusionAccumulatedText += token
          sendEvent('chapter_token', { index: conclusionIndex, text: token })
        }

        sendEvent('chapter_done', {
          index: conclusionIndex,
          title: conclusionTitle,
          text: conclusionAccumulatedText
        })

        // 5. Grounding Daftar Pustaka dari OpenAlex
        sendEvent('references_start', {})
        let references: LiteratureReference[] = []
        try {
          references = await searchWorks(title, { apiKey: openalexApiKey })
        } catch (openAlexErr) {
          console.warn('Pencarian referensi OpenAlex gagal, melanjutkan tanpa pustaka luar:', openAlexErr)
        }

        let referencesMarkdown = '# Daftar Pustaka\n\n'
        if (references.length > 0) {
          referencesMarkdown += references
            .map(ref => formatApaCitation(ref))
            .join('\n\n')
        } else {
          referencesMarkdown += '*Referensi bibliografis disusun berdasarkan studi literatur dan metodologi akademik Cendekia.*'
        }

        sendEvent('references_done', {
          count: references.length,
          markdown: referencesMarkdown
        })

        // 6. Sinyal Keseluruhan Pembuatan Selesai Murni Streaming
        sendEvent('done', { success: true })
      } catch (fatalErr: any) {
        console.error('[ai-generate-book-stream] Error:', fatalErr)

        sendEvent('error', {
          code: 'GENERATION_ERROR',
          message: fatalErr?.message || 'Gagal memproses pembuatan literatur AI.'
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
