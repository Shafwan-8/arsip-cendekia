import { defineEventHandler, readBody, createError } from 'h3'
import { getGeminiClient, getGeminiFallbackModels, setGeminiWorkingModel } from '../../utils/ai/geminiClient'
import { buildOutlinePrompt } from '../../utils/ai/buildBookGenerationPrompt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY belum dikonfigurasi di server.'
    })
  }

  const body = await readBody<{ title?: string; category?: 'buku' | 'jurnal' | 'skripsi' }>(event).catch(() => null)
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

  const outlinePrompt = buildOutlinePrompt(title, category)
  const ai = getGeminiClient(geminiApiKey)
  const models = getGeminiFallbackModels()

  let chapters: string[] = []
  let lastError: any = null

  for (const model of models) {
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
        chapters = parsed.chapters.map(c => c.trim()).filter(Boolean).slice(0, 5)
        setGeminiWorkingModel(model)
        break
      }
    } catch (mErr) {
      lastError = mErr
      console.warn(`[ai/outline] Model ${model} gagal membuat outline:`, mErr)
    }
  }

  if (chapters.length === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: lastError?.message || 'Gagal menyusun daftar isi/outline dengan AI.'
    })
  }

  const daftarIsiMarkdown = `# Daftar Isi\n\n` +
    chapters.map((ch, idx) => `${idx + 1}. ${ch}`).join('\n') +
    `\n${chapters.length + 1}. Kesimpulan dan Rekomendasi\n${chapters.length + 2}. Daftar Pustaka`

  return {
    chapters,
    daftarIsiMarkdown
  }
})
