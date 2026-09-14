export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface DocumentChapter {
  id: string
  document_id: string | number
  judul_bab: string
  nomor_halaman: number
  created_at?: string
}

export interface ExtractPdfRequest {
  document_id: string | number
  file_path?: string
  force?: boolean
}

export interface ExtractPdfResponse {
  success: boolean
  document_id: string | number
  status: ExtractionStatus
  message?: string
  chapters: DocumentChapter[]
  job_id?: string
  total_chapters?: number
}
