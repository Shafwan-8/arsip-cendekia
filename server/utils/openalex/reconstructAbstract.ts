/**
 * Merekonstruksi teks abstrak dari format inverted index OpenAlex secara aman.
 * Menghasilkan string abstrak normal atau null jika tidak ada data.
 */
export function reconstructAbstract(invertedIndex?: Record<string, number[]> | null): string | null {
  if (!invertedIndex || typeof invertedIndex !== 'object') return null

  try {
    const entries: [number, string][] = []
    for (const [word, positions] of Object.entries(invertedIndex)) {
      if (Array.isArray(positions)) {
        for (const pos of positions) {
          if (typeof pos === 'number' && !isNaN(pos)) {
            entries.push([pos, word])
          }
        }
      }
    }

    if (entries.length === 0) return null
    entries.sort((a, b) => a[0] - b[0])
    return entries.map(e => e[1]).join(' ')
  } catch (err) {
    console.warn('Gagal merekonstruksi abstrak OpenAlex:', err)
    return null
  }
}
