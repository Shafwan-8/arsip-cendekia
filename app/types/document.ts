export interface DocumentItem {
  id: string | number
  title: string
  author: string
  publisher: string
  category: string
  year: number | string
  file_name: string
  file_size: string
  file_url: string
  pages: number
  uploaded_at: string
  status: string
  user_id?: string
  extraction_status?: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_error?: string | null
  extraction_started_at?: string | null
  extraction_completed_at?: string | null
}

export type BukuItem = DocumentItem

export type DocumentSortOption = 'latest' | 'oldest' | 'title' | 'size'

export interface DocumentCategoryTheme {
  badgeBg: string
  badgeBorder: string
  badgeText: string
  primaryBtn: string
  primaryText: string
  focusBorder: string
  activePage: string
  accentBg: string
  accentBorder: string
}

export interface DocumentCategoryConfig {
  label: string
  pluralLabel: string
  category: string
  basePath: string
  storageFolder: string
  color: string
  pageTitle: string
  headerTitle: string
  headerDescription: string
  uploadBtnText: string
  uploadModalTitle: string
  deleteModalTitle: string
  emptyTitle: string
  emptyDescription: string
  searchPlaceholder: string
  theme: DocumentCategoryTheme
}

export interface DocumentUploadForm {
  title: string
  author: string
  publisher: string
  category: string
  year: number | string
  file_name: string
  file_size: string
  pages: number | string
  status: string
}
