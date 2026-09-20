import type { LiteratureReference } from '~/types/literatureReference'

/**
 * Mengubah satu objek LiteratureReference (OpenAlex) menjadi teks sitasi standar format APA 7th Edition.
 * Contoh: Smith, J. D., & Doe, A. (2022). Title of the work. Journal Name, https://doi.org/xxx
 */
export function formatApaCitation(ref: LiteratureReference): string {
  // 1. Format Penulis
  let authorStr = 'Anonim'
  if (ref.authors && ref.authors.length > 0) {
    if (ref.authors.length === 1) {
      authorStr = formatAuthorName(ref.authors[0])
    } else if (ref.authors.length === 2) {
      authorStr = `${formatAuthorName(ref.authors[0])}, & ${formatAuthorName(ref.authors[1])}`
    } else {
      authorStr = `${formatAuthorName(ref.authors[0])}, et al.`
    }
  }

  // 2. Tahun
  const yearStr = ref.year ? `(${ref.year})` : '(n.d.)'

  // 3. Judul (Pastikan diakhiri titik jika belum)
  let titleStr = ref.title ? ref.title.trim() : 'Tanpa Judul'
  if (!/[.!?]$/.test(titleStr)) {
    titleStr += '.'
  }

  // 4. Jurnal / Sumber
  let journalStr = ''
  if (ref.journal) {
    journalStr = ` *${ref.journal.trim()}*.`
  }

  // 5. DOI atau URL
  let linkStr = ''
  if (ref.doi) {
    linkStr = ` ${ref.doi.startsWith('http') ? ref.doi : `https://doi.org/${ref.doi}`}`
  } else if (ref.landingPageUrl) {
    linkStr = ` ${ref.landingPageUrl}`
  }

  return `${authorStr} ${yearStr}. ${titleStr}${journalStr}${linkStr}`.trim()
}

/**
 * Format nama penulis menjadi "NamaBelakang, Inisial." jika memungkinkan
 */
function formatAuthorName(name: string): string {
  if (!name || !name.trim()) return 'Anonim'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]

  const lastName = parts[parts.length - 1]
  const initials = parts
    .slice(0, -1)
    .map(p => `${p.charAt(0).toUpperCase()}.`)
    .join(' ')

  return `${lastName}, ${initials}`
}
