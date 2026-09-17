import { GoogleGenAI } from '@google/genai'

/**
 * Mengambil client Google Gen AI server-side
 */
export function getGeminiClient(apiKey?: string): GoogleGenAI {
  const key = apiKey || process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada server.')
  }
  return new GoogleGenAI({ apiKey: key })
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
}

/**
 * Model-model cadangan jika model utama mengalami 503 (high demand)
 */
export function getGeminiFallbackModels(): string[] {
  const primary = getGeminiModelName()
  const candidates = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest']
  return [primary, ...candidates.filter(m => m !== primary)]
}
