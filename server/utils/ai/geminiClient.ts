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

let activeModelCache: string | null = null

export function getGeminiModelName(): string {
  return activeModelCache || process.env.GEMINI_MODEL || 'gemini-3.5-flash'
}

export function setGeminiWorkingModel(model: string): void {
  activeModelCache = model
}

/**
 * Model-model cadangan berkecepatan tinggi jika model utama mengalami 503 (high demand)
 */
export function getGeminiFallbackModels(): string[] {
  const primary = getGeminiModelName()
  const candidates = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ]
  return [primary, ...candidates.filter(m => m !== primary)]
}
