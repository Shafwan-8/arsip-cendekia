import { getGeminiClient, getGeminiFallbackModels } from './geminiClient'

export interface StreamResearchAnswerOptions {
  apiKey?: string
  systemInstruction: string
  contents: string
  signal?: AbortSignal
}

/**
 * Melakukan streaming narasi sintesis riset dari Gemini sebagai Async Generator
 * Dilengkapi dengan fallback otomatis ke model lain jika terjadi 503 (high demand)
 */
export async function* streamResearchAnswer(
  options: StreamResearchAnswerOptions
): AsyncGenerator<string, void, unknown> {
  const ai = getGeminiClient(options.apiKey)
  const models = getGeminiFallbackModels()

  let lastError: unknown = null

  for (const model of models) {
    if (options.signal?.aborted) return

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: 0.2
        }
      })

      let yieldedAny = false
      for await (const chunk of responseStream) {
        if (options.signal?.aborted) return
        const text = chunk.text
        if (text) {
          yield text
          yieldedAny = true
        }
      }

      // Jika berhasil streaming sampai selesai, return sukses
      if (yieldedAny) {
        return
      }
    } catch (err: any) {
      lastError = err
      const status = err?.status || err?.code
      console.warn(`[streamResearchAnswer] Model ${model} gagal (${status}). Mencoba model cadangan jika ada...`)
      // Lanjut ke model berikutnya
    }
  }

  // Jika seluruh model gagal, throw error terakhir
  throw lastError || new Error('Semua model AI sedang tidak dapat diakses.')
}
