export interface LiteratureReference {
  index: number
  id: string
  title: string
  authors: string[]
  year: number | null
  journal: string | null
  doi: string | null
  pdfUrl: string | null
  landingPageUrl: string | null
  abstract: string | null
  aiSummary: string | null
  aiInsight: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: LiteratureReference[]
  createdAt: number
}

export interface SearchRequest {
  query: string
}

export interface LiteratureAnalysis {
  index: number
  summary: string
  insight: string
}

export interface AiSearchError {
  code: string
  message: string
}

export type SseEventType = 'references' | 'token' | 'analysis' | 'done' | 'error'

export interface SseEvent<T = any> {
  event: SseEventType
  data: T
}

export interface SearchResponse {
  references: LiteratureReference[]
}
