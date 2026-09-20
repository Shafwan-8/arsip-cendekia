import type { LiteratureReference } from '~/types/literatureReference'
import { reconstructAbstract } from './reconstructAbstract'

export interface RawOpenAlexWork {
  id: string
  title?: string
  display_name?: string
  publication_year?: number
  doi?: string
  authorships?: Array<{ author?: { display_name?: string } }>
  primary_location?: {
    source?: { display_name?: string }
    landing_page_url?: string
    pdf_url?: string
  }
  open_access?: {
    is_oa?: boolean
    oa_url?: string
  }
  cited_by_count?: number
  abstract_inverted_index?: Record<string, number[]> | null
}

/**
 * Menormalisasi response OpenAlex menjadi tipe LiteratureReference dengan index stabil (1-5)
 * dan prioritas link: PDF URL > DOI > Landing page.
 */
export function normalizeWork(work: RawOpenAlexWork, index: number): LiteratureReference {
  const authors = (work.authorships || [])
    .map(a => a.author?.display_name?.trim())
    .filter((name): name is string => Boolean(name))

  const abstract = reconstructAbstract(work.abstract_inverted_index)

  // Prioritas PDF URL
  let pdfUrl: string | null = null
  if (work.primary_location?.pdf_url) {
    pdfUrl = work.primary_location.pdf_url
  } else if (work.open_access?.oa_url && work.open_access.oa_url.toLowerCase().endsWith('.pdf')) {
    pdfUrl = work.open_access.oa_url
  }

  // Prioritas Landing Page
  const landingPageUrl =
    work.primary_location?.landing_page_url ||
    (work.doi ? (work.doi.startsWith('http') ? work.doi : `https://doi.org/${work.doi}`) : null) ||
    work.id ||
    null

  const doi = work.doi
    ? work.doi.startsWith('http')
      ? work.doi
      : `https://doi.org/${work.doi}`
    : null

  return {
    index,
    id: work.id,
    title: work.title?.trim() || work.display_name?.trim() || 'Tanpa Judul',
    authors,
    year: work.publication_year || null,
    journal: work.primary_location?.source?.display_name?.trim() || null,
    doi,
    pdfUrl,
    landingPageUrl,
    abstract,
    aiSummary: null,
    aiInsight: null
  }
}
