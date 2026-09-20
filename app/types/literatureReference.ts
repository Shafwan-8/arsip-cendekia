/**
 * Tipe referensi literatur akademik dari basis data OpenAlex.
 * Digunakan untuk grounding daftar pustaka pada dokumen hasil AI.
 */
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
