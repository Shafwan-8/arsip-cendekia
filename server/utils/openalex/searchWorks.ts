import axios from 'axios'
import type { LiteratureReference } from '~/types/literatureReference'
import { normalizeWork, type RawOpenAlexWork } from './normalizeWork'

export interface SearchWorksOptions {
  apiKey?: string
  mailto?: string
}

/**
 * Mendeteksi kemungkinan tahun atau rentang tahun dari query pengguna
 */
function extractYearRangeFromQuery(query: string): { startYear?: number; endYear?: number; cleanQuery: string } {
  let startYear: number | undefined
  let endYear: number | undefined
  let cleanQuery = query

  // Pola: "2020 sampai 2024", "2020-2024", "dari tahun 2020 hingga 2024"
  const rangeMatch = query.match(/(?:dari\s+tahun\s+|tahun\s+)?(\b(?:19|20)\d{2}\b)\s*(?:-|sampai|hingga|to)\s*(\b(?:19|20)\d{2}\b)/i)
  if (rangeMatch) {
    const y1 = parseInt(rangeMatch[1], 10)
    const y2 = parseInt(rangeMatch[2], 10)
    startYear = Math.min(y1, y2)
    endYear = Math.max(y1, y2)
    cleanQuery = query.replace(rangeMatch[0], ' ').replace(/\s+/g, ' ').trim()
  } else {
    // Pola satu tahun: "tahun 2024"
    const singleMatch = query.match(/(?:tahun\s+)(\b(?:19|20)\d{2}\b)/i)
    if (singleMatch) {
      startYear = parseInt(singleMatch[1], 10)
      endYear = startYear
      cleanQuery = query.replace(singleMatch[0], ' ').replace(/\s+/g, ' ').trim()
    }
  }

  return { startYear, endYear, cleanQuery: cleanQuery || query }
}

/**
 * Mencari maksimal 5 literatur teratas dari basis data OpenAlex
 */
export async function searchWorks(
  query: string,
  options: SearchWorksOptions = {}
): Promise<LiteratureReference[]> {
  const url = 'https://api.openalex.org/works'
  const { startYear, endYear, cleanQuery } = extractYearRangeFromQuery(query)

  const params = new URLSearchParams()
  params.set('search', cleanQuery)
  params.set('per-page', '5')

  // Filter tahun di OpenAlex
  if (startYear && endYear) {
    if (startYear === endYear) {
      params.set('filter', `publication_year:${startYear}`)
    } else {
      params.set('filter', `from_publication_date:${startYear}-01-01,to_publication_date:${endYear}-12-31`)
    }
  } else if (startYear) {
    params.set('filter', `from_publication_date:${startYear}-01-01`)
  }

  // OpenAlex Authentication / Polite Pool
  if (options.apiKey) {
    params.set('api_key', options.apiKey)
  } else {
    params.set('mailto', options.mailto || 'admin@cendekia.ac.id')
  }

  try {
    const response = await axios.get<{ results?: RawOpenAlexWork[] }>(url, {
      params,
      timeout: 12000
    })

    const rawResults = response.data?.results || []
    return rawResults.slice(0, 5).map((work, index) => normalizeWork(work, index + 1))
  } catch (err: any) {
    console.error('Error saat menghubungi OpenAlex Works API:', err?.response?.status, err?.message)
    throw err
  }
}
