import type { DocumentChapter } from '~/types/documentChapter'

export interface AdobeExtractElement {
  Path?: string
  Text?: string
  Page?: number
  Font?: {
    name?: string
    size?: number
    weight?: number
  }
  Bounds?: number[]
  attributes?: {
    LineHeight?: number
    TextAlign?: string
  }
}

export interface AdobeExtractJson {
  version?: {
    json?: string
    pdf?: string
  }
  extended_metadata?: {
    page_count?: number
  }
  elements?: AdobeExtractElement[]
}

// Pola BAB utama: "BAB I", "BAB 1", "BAB I. PENDAHULUAN", "BAB II: LANDASAN TEORI"
const BAB_REGEX = /^BAB\s+([0-9IVXLCDM]+)([\s:.-]+(.*))?$/i

// Pola Bagian Awal & Akhir Standar Dokumen Akademik / Buku / Karya Ilmiah
interface SectionDefinition {
  key: string
  pattern: RegExp
  label: string
  isToc?: boolean
}

const STANDARD_SECTIONS: SectionDefinition[] = [
  { key: 'JUDUL', pattern: /^(HALAMAN\s+JUDUL|COVER|JUDUL\s+SKRIPSI|JUDUL\s+TESIS|JUDUL\s+DISERTASI)$/i, label: 'HALAMAN JUDUL' },
  { key: 'PERSETUJUAN', pattern: /^(LEMBAR\s+PERSETUJUAN(\s+PEMBIMBING)?|HALAMAN\s+PERSETUJUAN|PERSETUJUAN\s+PEMBIMBING)$/i, label: 'LEMBAR PERSETUJUAN' },
  { key: 'PENGESAHAN', pattern: /^(HALAMAN\s+PENGESAHAN|LEMBAR\s+PENGESAHAN(\s+PENGUJI)?|PENGESAHAN\s+TIM\s+PENGUJI|PENGESAHAN\s+SKRIPSI)$/i, label: 'HALAMAN PENGESAHAN' },
  { key: 'PERNYATAAN', pattern: /^(PERNYATAAN\s+KEASLIAN(\s+TUGAS\s+AKHIR)?(\s+SKRIPSI)?|SURAT\s+PERNYATAAN(\s+KEASLIAN)?|PERNYATAAN\s+BEBAS\s+PLAGIASI)$/i, label: 'PERNYATAAN KEASLIAN' },
  { key: 'MOTTO', pattern: /^(MOTTO|MOTTO\s+DAN\s+PERSEMBAHAN)$/i, label: 'MOTTO' },
  { key: 'PERSEMBAHAN', pattern: /^(PERSEMBAHAN|LEMBAR\s+PERSEMBAHAN|HALAMAN\s+PERSEMBAHAN)$/i, label: 'PERSEMBAHAN' },
  { key: 'PENGANTAR', pattern: /^(KATA\s+PENGANTAR|PRAKATA|UCAPAN\s+TERIMA\s+KASIH)$/i, label: 'KATA PENGANTAR' },
  { key: 'ABSTRAK', pattern: /^(ABSTRAK|ABSTRACT)$/i, label: 'ABSTRAK' },
  { key: 'DAFTAR_ISI', pattern: /^(DAFTAR\s+ISI|TABLE\s+OF\s+CONTENTS)$/i, label: 'DAFTAR ISI', isToc: true },
  { key: 'DAFTAR_TABEL', pattern: /^DAFTAR\s+TABEL$/i, label: 'DAFTAR TABEL', isToc: true },
  { key: 'DAFTAR_GAMBAR', pattern: /^DAFTAR\s+GAMBAR$/i, label: 'DAFTAR GAMBAR', isToc: true },
  { key: 'DAFTAR_LAMPIRAN', pattern: /^DAFTAR\s+LAMPIRAN$/i, label: 'DAFTAR LAMPIRAN', isToc: true },
  { key: 'DAFTAR_SINGKATAN', pattern: /^(DAFTAR\s+SINGKATAN|DAFTAR\s+SIMBOL|DAFTAR\s+ISTILAH)$/i, label: 'DAFTAR SINGKATAN', isToc: true },
  { key: 'PUSTAKA', pattern: /^(DAFTAR\s+PUSTAKA|REFERENSI|BIBLIOGRAFI)$/i, label: 'DAFTAR PUSTAKA' },
  { key: 'LAMPIRAN', pattern: /^(LAMPIRAN|LAMPIRAN\s*-\s*LAMPIRAN)$/i, label: 'LAMPIRAN' },
  { key: 'BIODATA', pattern: /^(RIWAYAT\s+HIDUP|BIOGRAFI\s+PENULIS|BIODATA\s+PENULIS|TENTANG\s+PENULIS)$/i, label: 'RIWAYAT HIDUP' }
]

// Pola narasi / false positive yang bukan judul bagian
const NARRATIVE_FALSE_POSITIVE = /^(pada|dalam|sebagaimana|seperti|merujuk|berdasarkan|dijelaskan|diuraikan|lihat|oleh\s+karena|dengan\s+demikian)/i

/**
 * Mendeteksi apakah baris teks merupakan entri daftar isi / memiliki titik-titik indeks
 * Contoh: "HALAMAN JUDUL....................... i" atau "BAB I. PENDAHULUAN ......... 1"
 */
export const isTocEntryText = (text: string): boolean => {
  // 1. Titik-titik berulang berturutan
  if (/\.{2,}|…|_\s*_\s*_|\.\s*\.\s*\./.test(text)) {
    return true
  }
  // 2. Berakhir dengan nomor halaman romawi atau angka yang didahului tab/spasi panjang
  if (/\s{3,}(?:[0-9]+|[ivxlcdm]+)$/i.test(text)) {
    return true
  }
  return false
}

/**
 * Membersihkan dan menormalisasi teks judul BAB atau bagian dokumen.
 */
export const normalizeChapterTitle = (rawText: string): string => {
  return rawText
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[:.\s-]+/, '')
    .replace(/[:.\s-]+$/, '')
    .trim()
}

/**
 * Mem-parse dan mengekstrak daftar BAB & bagian penting dokumen dari Adobe Extract API JSON.
 * Menggunakan pendekatan 2-pass untuk mengeliminasi false positive dari halaman Daftar Isi.
 */
export const parseChaptersFromAdobeJson = (
  extractJson: AdobeExtractJson,
  documentId: string | number
): DocumentChapter[] => {
  if (!extractJson || !Array.isArray(extractJson.elements)) {
    return []
  }

  const elements = extractJson.elements

  // =========================================================================
  // PASS 1: Identifikasi Halaman-halaman Daftar Isi (TOC Pages)
  // =========================================================================
  const tocPages = new Set<number>()
  const tocPageHeadingElements = new Map<number, string>() // Page -> Label judul halaman tersebut

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (!el.Text || typeof el.Page !== 'number') continue

    const page = el.Page
    const cleanText = normalizeChapterTitle(el.Text)

    // Cek apakah ada judul "DAFTAR ISI", "DAFTAR TABEL", dsb.
    for (const sec of STANDARD_SECTIONS) {
      if (sec.isToc && sec.pattern.test(cleanText)) {
        tocPages.add(page)
        if (!tocPageHeadingElements.has(page)) {
          tocPageHeadingElements.set(page, sec.label)
        }
      }
    }

    // Jika halaman mengandung baris dengan titik-titik indeks
    if (isTocEntryText(el.Text)) {
      tocPages.add(page)
    }
  }

  // =========================================================================
  // PASS 2: Ekstraksi Heading Sejati (Bab, Judul, Pengantar, Abstrak, dll.)
  // =========================================================================
  const candidateChapters: Array<{ title: string; page: number; orderPriority: number }> = []

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    if (!el.Text || typeof el.Page !== 'number') continue

    const page = el.Page
    const path = el.Path || ''
    const rawText = el.Text.trim()
    const cleanText = normalizeChapterTitle(rawText)

    if (!cleanText || cleanText.length < 3) continue

    // 1. Abaikan running header & footer bawaan halaman
    if (path.includes('/Header') || path.includes('/Footer')) {
      continue
    }

    // 2. Tentukan apakah elemen berada di Halaman Daftar Isi (TOC Page)
    if (tocPages.has(page)) {
      // Di halaman daftar isi, HANYA judul utama halaman tersebut (misal "DAFTAR ISI") yang diterima sebagai chapter!
      // Semua entri di bawahnya (misal "BAB I ...", "BAB II ...") diabaikan agar tidak salah mencatat nomor halaman.
      for (const sec of STANDARD_SECTIONS) {
        if (sec.isToc && sec.pattern.test(cleanText) && !isTocEntryText(rawText)) {
          candidateChapters.push({
            title: sec.label,
            page: page + 1, // Adobe page 0-indexed -> Viewer 1-indexed
            orderPriority: 2
          })
        }
      }
      continue
    }

    // 3. Abaikan baris yang memiliki format entri daftar isi (titik-titik berulang)
    if (isTocEntryText(rawText)) {
      continue
    }

    // 4. Abaikan kalimat narasi / paragraf biasa
    if (cleanText.length > 80 || NARRATIVE_FALSE_POSITIVE.test(cleanText)) {
      continue
    }

    // 5. Cek apakah elemen merupakan Bagian Standar Awal/Akhir (HALAMAN JUDUL, KATA PENGANTAR, ABSTRAK, DAFTAR PUSTAKA, dll.)
    let matchedStandard = false
    for (const sec of STANDARD_SECTIONS) {
      if (sec.pattern.test(cleanText)) {
        candidateChapters.push({
          title: sec.label,
          page: page + 1,
          orderPriority: sec.key === 'PUSTAKA' || sec.key === 'LAMPIRAN' ? 4 : 1
        })
        matchedStandard = true
        break
      }
    }
    if (matchedStandard) continue

    // 6. Cek apakah elemen cocok dengan Pola BAB ("BAB I", "BAB 1", "BAB II", dll.)
    const babMatch = cleanText.match(BAB_REGEX)
    if (babMatch) {
      const babPrefix = `BAB ${babMatch[1].toUpperCase()}`
      let subTitle = babMatch[3] ? normalizeChapterTitle(babMatch[3]) : ''

      // Jika baris hanya berisi "BAB I" dan judulnya ada di baris berikutnya pada halaman yang sama:
      if (!subTitle && i + 1 < elements.length) {
        const nextEl = elements[i + 1]
        if (
          nextEl.Page === page &&
          nextEl.Text &&
          nextEl.Text.trim().length > 0 &&
          nextEl.Text.trim().length < 80 &&
          !nextEl.Text.trim().match(BAB_REGEX) &&
          !isTocEntryText(nextEl.Text) &&
          !NARRATIVE_FALSE_POSITIVE.test(nextEl.Text.trim())
        ) {
          subTitle = normalizeChapterTitle(nextEl.Text)
          i++ // Lewati elemen berikutnya karena sudah digabung
        }
      }

      // Format judul BAB yang rapi dan seragam (e.g. "BAB I PENDAHULUAN")
      const fullTitle = subTitle ? `${babPrefix} ${subTitle}` : babPrefix

      candidateChapters.push({
        title: fullTitle,
        page: page + 1,
        orderPriority: 3
      })
    }
  }

  // =========================================================================
  // PASS 3: Deduplikasi & Pengurutan
  // =========================================================================
  // - Pertahankan kemunculan unik berdasarkan judul normal
  // - Jika judul sama muncul di halaman berbeda (misal header berulang), ambil halaman pertama
  const seenTitles = new Map<string, { title: string; page: number }>()

  for (const item of candidateChapters) {
    const normKey = item.title.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seenTitles.has(normKey)) {
      seenTitles.set(normKey, { title: item.title, page: item.page })
    }
  }

  const finalChapters: DocumentChapter[] = Array.from(seenTitles.values()).map(item => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `chap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    document_id: documentId,
    judul_bab: item.title,
    nomor_halaman: item.page,
    created_at: new Date().toISOString()
  }))

  // Jika belum ada entri di halaman 1, pastikan Halaman Judul ada di halaman 1 jika dokumen ada
  const hasPageOne = finalChapters.some(c => c.nomor_halaman === 1)
  if (!hasPageOne && finalChapters.length > 0 && finalChapters[0].nomor_halaman > 1) {
    finalChapters.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : `chap_cover_${Date.now()}`,
      document_id: documentId,
      judul_bab: 'HALAMAN JUDUL',
      nomor_halaman: 1,
      created_at: new Date().toISOString()
    })
  }

  // Urutkan daftar berdasarkan nomor_halaman ASC
  finalChapters.sort((a, b) => a.nomor_halaman - b.nomor_halaman)

  return finalChapters
}
