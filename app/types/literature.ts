export interface LiteratureAnalysis {
  summary: string
  relevance: string
  insight: string
}

export interface LiteratureResult {
  id: string
  title: string
  authors: string[]
  publicationYear: number | null
  journal: string | null
  doi: string | null
  url: string | null
  citedByCount: number
  abstract: string | null
  analysis: LiteratureAnalysis | null
}

export interface SearchParams {
  keywords: string
  start_year: number | null
  end_year: number | null
}

export interface SearchChatRequest {
  message: string
}

export interface SearchChatResponse {
  success: boolean
  query?: SearchParams
  results?: LiteratureResult[]
  error?: string
  message?: string
}
