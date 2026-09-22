export interface OpenAlexAuthor {
  author: {
    id: string
    display_name: string
  }
}

export interface OpenAlexLocation {
  source?: {
    display_name?: string
    issn_l?: string
    type?: string
  }
  pdf_url?: string
  landing_page_url?: string
}

export interface OpenAlexWork {
  id: string
  doi?: string
  title?: string
  display_name?: string
  publication_year: number
  publication_date?: string
  type: string
  authorships?: OpenAlexAuthor[]
  primary_location?: OpenAlexLocation
  open_access?: {
    is_oa: boolean
    oa_status?: string
    oa_url?: string
  }
  cited_by_count?: number
  best_oa_location?: OpenAlexLocation
}
