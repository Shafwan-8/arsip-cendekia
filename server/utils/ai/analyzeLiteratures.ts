import { Type } from '@google/genai'
import type { LiteratureReference, LiteratureAnalysis } from '~/types/aiSearch'
import { getGeminiClient, getGeminiFallbackModels } from './geminiClient'
import { truncateWords } from '../text/truncateText'

/**
 * Menghasilkan AI Summary (2-3 kalimat) dan AI Insight (1-2 kalimat)
 * untuk seluruh literatur dalam 1 kali request terstruktur tunggal.
 */
export async function analyzeLiteratures(
  query: string,
  references: LiteratureReference[],
  apiKey?: string
): Promise<Map<number, LiteratureAnalysis>> {
  const analysisMap = new Map<number, LiteratureAnalysis>()
  if (!references || references.length === 0) return analysisMap

  const models = getGeminiFallbackModels()
  const ai = getGeminiClient(apiKey)

  const systemInstruction = `You are an academic literature screening assistant.
Analyze each retrieved literature based ONLY on the provided title, abstract, and metadata.
Do not invent findings, methodologies, datasets, conclusions, or claims not supported by the provided text.
For each literature, provide:
- summary: exactly 2 to 3 concise sentences summarizing the research topic and main focus based on the abstract. If the abstract is missing, state: "Ringkasan detail tidak tersedia karena abstrak penelitian tidak ditemukan."
- insight: exactly 1 to 2 concise sentences explaining why this paper is relevant to the user's research query. If the abstract is missing, state: "Insight terbatas karena informasi yang tersedia hanya metadata."
All outputs must be in clean Indonesian (Bahasa Indonesia).`

  const papersPayload = references.map(ref => ({
    index: ref.index,
    title: ref.title,
    authors: ref.authors.slice(0, 3).join(', '),
    year: ref.year,
    journal: ref.journal,
    abstract: ref.abstract ? truncateWords(ref.abstract, 150) : null
  }))

  const prompt = `Research query: "${query}"

Papers to analyze:
${JSON.stringify(papersPayload, null, 2)}`

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analyses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    index: { type: Type.INTEGER, description: '1-based index matching paper reference index' },
                    summary: { type: Type.STRING, description: '2-3 sentences summary' },
                    insight: { type: Type.STRING, description: '1-2 sentences relevance insight' }
                  },
                  required: ['index', 'summary', 'insight']
                }
              }
            },
            required: ['analyses']
          }
        }
      })

      const text = response.text?.trim() || '{}'
      const parsed = JSON.parse(text) as { analyses?: LiteratureAnalysis[] }

      if (Array.isArray(parsed.analyses)) {
        for (const item of parsed.analyses) {
          if (typeof item.index === 'number') {
            analysisMap.set(item.index, {
              index: item.index,
              summary: item.summary,
              insight: item.insight
            })
          }
        }
      }

      if (analysisMap.size > 0) {
        return analysisMap
      }
    } catch (err) {
      console.warn(`[analyzeLiteratures] Model ${model} gagal menganalisis literatur:`, err)
    }
  }

  return analysisMap
}
