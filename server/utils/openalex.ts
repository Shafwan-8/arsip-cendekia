import axios from 'axios'
import type { SearchParams, LiteratureResult } from '~/types/literature'

export interface RawOpenAlexItem {
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
  cited_by_count?: number
  abstract_inverted_index?: Record<string, number[]> | null
}

/**
 * Merekonstruksi teks abstrak lengkap dari format inverted index OpenAlex
 */
export function reconstructAbstract(invertedIndex?: Record<string, number[]> | null): string | null {
  if (!invertedIndex || typeof invertedIndex !== 'object') return null
  const entries: [number, string][] = []
  
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (Array.isArray(positions)) {
      for (const pos of positions) {
        entries.push([pos, word])
      }
    }
  }

  if (entries.length === 0) return null
  entries.sort((a, b) => a[0] - b[0])
  return entries.map(e => e[1]).join(' ')
}

/**
 * Melakukan pencarian 5 literatur ke API OpenAlex Works
 */
export async function searchOpenAlexWorks(
  params: SearchParams,
  apiKey?: string
): Promise<Array<Omit<LiteratureResult, 'analysis'>>> {
  const url = 'https://api.openalex.org/works'
  const searchParams = new URLSearchParams()

  searchParams.set('search', params.keywords)
  searchParams.set('per-page', '5')

  // Filter rentang tahun
  if (params.start_year && params.end_year) {
    if (params.start_year === params.end_year) {
      searchParams.set('filter', `publication_year:${params.start_year}`)
    } else {
      searchParams.set('filter', `from_publication_date:${params.start_year}-01-01,to_publication_date:${params.end_year}-12-31`)
    }
  } else if (params.start_year) {
    searchParams.set('filter', `from_publication_date:${params.start_year}-01-01`)
  } else if (params.end_year) {
    searchParams.set('filter', `to_publication_date:${params.end_year}-12-31`)
  }

  if (apiKey) {
    searchParams.set('api_key', apiKey)
  } else {
    searchParams.set('mailto', 'admin@cendekia.ac.id') // OpenAlex Polite Pool
  }

  const response = await axios.get<{ results?: RawOpenAlexItem[] }>(url, {
    params: searchParams,
    timeout: 12000
  })

  const rawResults = response.data?.results || []

  return rawResults.map(item => {
    const authors = (item.authorships || [])
      .map(a => a.author?.display_name)
      .filter((name): name is string => Boolean(name))

    const abstract = reconstructAbstract(item.abstract_inverted_index)

    return {
      id: item.id,
      title: item.title || item.display_name || 'Tanpa Judul',
      authors,
      publicationYear: item.publication_year || null,
      journal: item.primary_location?.source?.display_name || null,
      doi: item.doi || null,
      url: item.primary_location?.landing_page_url || item.doi || item.id,
      citedByCount: item.cited_by_count || 0,
      abstract
    }
  })
}
