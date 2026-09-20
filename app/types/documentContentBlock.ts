export type ContentBlockSectionType = 'daftar_isi' | 'bab' | 'kesimpulan' | 'daftar_pustaka'
export type AiGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface DocumentContentBlock {
  id: string
  document_id: string | number
  block_order: number
  section_type: ContentBlockSectionType
  title: string
  content: Record<string, any> // TipTap JSON
  created_at?: string
  updated_at?: string
}

export interface GenerationChapterProgress {
  index: number
  title: string
  status: 'pending' | 'writing' | 'done'
}

export interface GenerateBookRequest {
  title: string
  category: 'buku' | 'jurnal' | 'skripsi'
  user_id?: string | null
  author?: string | null
}

export interface ContentBlocksResponse {
  success: boolean
  document_id: string | number
  blocks: DocumentContentBlock[]
}

export interface SaveContentBlocksRequest {
  document_id: string | number
  blocks: DocumentContentBlock[]
  user_id?: string | null
  author?: string | null
}

export interface RenderPdfResponse {
  success: boolean
  pdf_url: string
  from_cache?: boolean
}
