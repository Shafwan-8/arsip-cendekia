import { getGeminiClient, getGeminiFallbackModels, setGeminiWorkingModel } from './geminiClient'

export interface StreamGeminiContentOptions {
  apiKey?: string
  systemInstruction: string
  contents: string
  signal?: AbortSignal
  temperature?: number
}

/**
 * Melakukan streaming konten AI dari Gemini sebagai Async Generator
 * Dilengkapi dengan fallback otomatis ke model lain jika terjadi 503 (high demand)
 */
export async function* streamGeminiContent(
  options: StreamGeminiContentOptions
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
          temperature: options.temperature ?? 0.3
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

      // Jika berhasil streaming sampai selesai, return sukses dan cache model yang bekerja
      if (yieldedAny) {
        setGeminiWorkingModel(model)
        return
      }
    } catch (err: any) {
      lastError = err
      const status = err?.status || err?.code
      console.warn(`[streamGeminiContent] Model ${model} gagal (${status}). Mencoba model cadangan jika ada...`)
      // Lanjut ke model berikutnya
    }
  }

  // Jika seluruh model gagal, throw error terakhir
  throw lastError || new Error('Semua model AI sedang tidak dapat diakses.')
}
