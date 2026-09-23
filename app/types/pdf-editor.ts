import type { DocumentCategoryConfig, DocumentItem } from '~/types/document'

export type PdfTool =
  | 'select'
  | 'text'
  | 'highlight'
  | 'image'
  | 'signature'
  | 'draw'
  | 'rect'

export type PdfElementType =
  | 'text'
  | 'highlight'
  | 'image'
  | 'signature'
  | 'draw'
  | 'rect'

export interface Point {
  x: number
  y: number
}

export interface BasePdfElement {
  id: string
  type: PdfElementType
  page: number // 1-based page index
  x: number // Relative position in CSS pixels at scale 1
  y: number // Relative position in CSS pixels at scale 1
  width: number
  height: number
  rotation?: number
}

export interface TextPdfElement extends BasePdfElement {
  type: 'text'
  text: string
  fontSize: number // in points / px
  color: string
  bold?: boolean
  italic?: boolean
}

export interface HighlightPdfElement extends BasePdfElement {
  type: 'highlight'
  color: string
  opacity: number
}

export interface ImagePdfElement extends BasePdfElement {
  type: 'image'
  dataUrl: string
  mimeType: 'image/png' | 'image/jpeg'
  aspectRatio: number
}

export interface SignaturePdfElement extends BasePdfElement {
  type: 'signature'
  dataUrl: string
  aspectRatio: number
}

export interface DrawPdfElement extends BasePdfElement {
  type: 'draw'
  points: Point[]
  strokeWidth: number
  color: string
}

export interface RectPdfElement extends BasePdfElement {
  type: 'rect'
  strokeColor: string
  strokeWidth: number
  fillColor?: string
}

export type PdfEditorElement =
  | TextPdfElement
  | HighlightPdfElement
  | ImagePdfElement
  | SignaturePdfElement
  | DrawPdfElement
  | RectPdfElement

export interface PdfDocumentInfo {
  id: string | number
  title: string
  author?: string
  publisher?: string
  fileName: string
  fileUrl: string
  category: string
  pages?: number
  source?: 'upload' | 'ai_generated' | 'uploaded_editable'
}

export interface PdfEditorState {
  isLoading: boolean
  isSaving: boolean
  error: string
  currentPage: number
  totalPages: number
  zoom: number
  selectedTool: PdfTool
  selectedElementId: string | null
  elements: PdfEditorElement[]
}
