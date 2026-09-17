/**
 * Membatasi panjang teks berdasarkan jumlah kata maksimal secara aman.
 */
export function truncateWords(text: string, maxWords: number = 200): string {
  if (!text) return ''
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) {
    return text.trim()
  }
  return words.slice(0, maxWords).join(' ') + '...'
}
