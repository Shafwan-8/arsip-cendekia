import type { LiteratureReference } from '~/types/literatureReference'
import { truncateWords } from '../text/truncateText'

/**
 * Membangun teks konteks RAG terstruktur dengan penomoran indeks stabil [1] s.d. [5]
 * dan pembatasan abstract maksimal 200 kata per literatur.
 */
export function buildLiteratureContext(references: LiteratureReference[]): string {
  if (!references || references.length === 0) {
    return 'TIDAK ADA LITERATUR YANG DITEMUKAN.'
  }

  const sections = references.map(ref => {
    const authorsStr = ref.authors.length > 0 ? ref.authors.join(', ') : 'Penulis tidak diketahui'
    const journalStr = ref.journal || 'Jurnal tidak terdata'
    const yearStr = ref.year ? String(ref.year) : 'Tahun tidak terdata'
    const doiStr = ref.doi || 'Tidak ada DOI'
    const abstractStr = ref.abstract
      ? truncateWords(ref.abstract, 200)
      : 'Abstrak tidak tersedia (hanya metadata bibliografis).'

    return `[${ref.index}]
Title: ${ref.title}
Authors: ${authorsStr}
Year: ${yearStr}
Journal: ${journalStr}
DOI: ${doiStr}
Abstract:
${abstractStr}`
  })

  return sections.join('\n\n')
}
