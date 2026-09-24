export interface LocalExtractedSubsection {
  code: string
  title: string
  content_html: string
}

export interface LocalExtractedChapter {
  number: string
  title: string
  section_type?: 'daftar_isi' | 'bab' | 'kesimpulan' | 'daftar_pustaka'
  standalone?: boolean
  intro_html?: string
  content_html?: string
  subsections: LocalExtractedSubsection[]
}

export interface LocalExtractedPdfResult {
  document_title?: string
  author?: string
  chapters: LocalExtractedChapter[]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Pembersih karakter transliterasi rusak dari font Word/PDF dan penataan kata
 */
function cleanTextLine(rawText: string): string {
  let text = rawText.replace(/[ \t]+/g, ' ').trim()
  if (!text) return ''

  // Perbaikan transliterasi Arab/Indonesia yang terfragmentasi pada font akademik
  text = text
    .replace(/Alhamdulillahirabbil\s+a\s*l\s*m\s*n/gi, 'Alhamdulillahirabbil ‘Alamin')
    .replace(/Allah\s+u\s*h\s*n\s*hu\s*la/gi, 'Allah Subhanahu Wa Ta’ala')
    .replace(/Shallallhu\s*[„"']?\s*Al\s*ihi\s*s\s*l\s*m/gi, 'Shallallahu ‘Alaihi Wasallam')
    .replace(/\bu\s*h\s*n\s*hu\s*la\b/gi, 'Subhanahu Wa Ta’ala')
    .replace(/\ba\s*l\s*m\s*n\b/gi, '‘Alamin')
    .replace(/Subhana\s*hu\s*wa\s*ta['’]?\s*ala/gi, 'Subhanahu Wa Ta’ala')
    .replace(/Rasulullah\s+s\s*a\s*w/gi, 'Rasulullah SAW')

  return text
}

/**
 * Mengubah array baris teks menjadi paragraf HTML rapi
 */
function linesToHtml(lines: string[]): string {
  if (!lines || lines.length === 0) return '<p></p>'

  const paragraphs: string[] = []
  let currentPara: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim()
    if (!rawLine) {
      if (currentPara.length > 0) {
        paragraphs.push(`<p>${escapeHtml(currentPara.join(' '))}</p>`)
        currentPara = []
      }
      continue
    }

    // Jika baris saat ini berakhiran tanda hubung pemenggal kata (hyphenation wrap)
    if (rawLine.endsWith('-') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim()
      const firstWordNext = nextLine.split(' ')[0]
      const baseWord = rawLine.slice(0, -1)
      if (/^[a-z]/.test(firstWordNext)) {
        currentPara.push(baseWord + firstWordNext)
        lines[i + 1] = nextLine.substring(firstWordNext.length).trim()
        continue
      }
    }

    currentPara.push(rawLine)

    const endsSentence = /[.!?:]$/.test(rawLine)
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''
    const nextIsNewSentence = /^[A-Z0-9(]/.test(nextLine)

    if (endsSentence && (rawLine.length < 55 || !nextLine || nextIsNewSentence)) {
      paragraphs.push(`<p>${escapeHtml(currentPara.join(' '))}</p>`)
      currentPara = []
    }
  }

  if (currentPara.length > 0) {
    paragraphs.push(`<p>${escapeHtml(currentPara.join(' '))}</p>`)
  }

  return paragraphs.length > 0 ? paragraphs.join('\n') : '<p></p>'
}

/**
 * Filter penolak false positive untuk sub-bab
 */
function isFalseSubsection(code: string, title: string): boolean {
  // 1. Waktu / jam: contoh "07.15. Wib"
  if (/^\d{2}\.\d{2}/.test(code) || /\b(WIB|WITA|WIT)\b/i.test(title)) return true

  // 2. Format footnote / sitasi daftar pustaka / referensi buku
  if (/\b(h\.|hlm\.|halaman|cet\.|penerbit|jakarta:|bandung:|yogyakarta:|surabaya:)\b/i.test(title)) {
    return true
  }

  // 3. Nama orang dengan gelar haji / inisial atau narasi putusan
  if (/^(H\.\s+[A-Z]|Haji|Drs|Dr\.|Prof\.)/i.test(title) || /\b(sebagaimana diurai|sebagaimana dijelaskan|terdakwa|bahwa)\b/i.test(title)) {
    return true
  }

  // 4. Memiliki 2 atau lebih koma (tipikal sitasi footnote: pengarang, judul, penerbit)
  if ((title.match(/,/g) || []).length >= 2) return true

  // 5. Terlalu panjang untuk judul sub-bab
  if (title.length > 80) return true

  return false
}

/**
 * Parsing teks dokumen ilmiah/literatur ke dalam struktur Bab dan Sub-bab secara lokal
 */
export async function parsePdfToLiteratureStructure(
  buffer: Buffer,
  fallbackTitle?: string
): Promise<LocalExtractedPdfResult> {
  const { getDocumentProxy } = await import('unpdf')
  const uint8Array = new Uint8Array(buffer)

  const pdfDoc = await getDocumentProxy(uint8Array)
  const numPages = pdfDoc.numPages

  if (numPages === 0) {
    throw new Error('Berkas PDF tidak memiliki halaman yang dapat dibaca.')
  }

  interface LineInfo {
    text: string
    y: number
    x: number
    height: number
  }

  const pages: { pageNumber: number; lines: LineInfo[] }[] = []

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i)
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1.0 })
    const pageHeight = viewport.height

    const lineBuckets: {
      y: number
      items: { x: number; y: number; w: number; h: number; str: string }[]
    }[] = []

    for (const item of textContent.items as any[]) {
      if (!item.str) continue
      const y = item.transform ? item.transform[5] : 0
      const x = item.transform ? item.transform[4] : 0
      const w = item.width || 0
      const h = item.height || 0

      const existing = lineBuckets.find((b) => Math.abs(b.y - y) < 3.5)
      if (existing) {
        existing.items.push({ x, y, w, h, str: item.str })
      } else {
        lineBuckets.push({ y, items: [{ x, y, w, h, str: item.str }] })
      }
    }

    lineBuckets.sort((a, b) => b.y - a.y)

    const cleanLines: LineInfo[] = []
    for (const b of lineBuckets) {
      b.items.sort((a, b) => a.x - b.x)
      let line = ''
      let maxH = 0

      for (let j = 0; j < b.items.length; j++) {
        const it = b.items[j]
        maxH = Math.max(maxH, it.h)

        if (j > 0) {
          const prev = b.items[j - 1]
          const gap = it.x - (prev.x + prev.w)
          if (gap >= 2.5 && !line.endsWith(' ') && !it.str.startsWith(' ')) {
            line += ' '
          }
        }
        line += it.str
      }

      const text = cleanTextLine(line)
      if (!text) continue

      const isPageNumber =
        (/^\d+$/.test(text) || /^[ivxlcdm]+$/i.test(text)) &&
        (b.y < 70 || b.y > pageHeight - 60)
      if (isPageNumber) continue

      cleanLines.push({
        text,
        y: b.y,
        x: b.items[0]?.x || 0,
        height: maxH
      })
    }

    pages.push({ pageNumber: i, lines: cleanLines })
  }

  interface RawChapter {
    number: string
    title: string
    section_type: 'daftar_isi' | 'bab' | 'kesimpulan' | 'daftar_pustaka'
    standalone: boolean
    intro_lines: string[]
    subsections: {
      code: string
      title: string
      lines: string[]
    }[]
  }

  const rawChapters: RawChapter[] = []
  let currentChapter: RawChapter | null = null
  let currentSub: { code: string; title: string; lines: string[] } | null = null
  let inToc = false

  const chapterRegex = /^BAB\s+([IVXLCDM]+|\d+)([\s:\.\-]+(.*))?$/i
  const standaloneMajorHeadings = [
    'ABSTRAK',
    'ABSTRACT',
    'KATA PENGANTAR',
    'PRAKATA',
    'DAFTAR ISI',
    'DAFTAR TABEL',
    'DAFTAR GAMBAR',
    'DAFTAR PUSTAKA',
    'LAMPIRAN'
  ]
  const subAlphaRegex = /^([A-Z])[\.\)]\s+(.+)$/
  const subAlphaSoloRegex = /^([A-Z])[\.\)]\s*$/
  const subNumRegex = /^(\d+\.\d+(\.\d+)?)\s+(.+)$/

  let detectedTitle = fallbackTitle || ''
  if (!detectedTitle || detectedTitle.endsWith('.pdf')) {
    const firstPageLines = pages[0]?.lines || []
    for (const l of firstPageLines.slice(0, 8)) {
      if (l.text.length > 8 && !chapterRegex.test(l.text)) {
        detectedTitle = l.text
        break
      }
    }
  }

  for (const page of pages) {
    for (let li = 0; li < page.lines.length; li++) {
      const lineObj = page.lines[li]
      const text = lineObj.text

      // 1. Deteksi Masuk Daftar Isi (TOC)
      if (/^DAFTAR\s+ISI$/i.test(text)) {
        if (currentSub && currentChapter) {
          currentChapter.subsections.push(currentSub)
          currentSub = null
        }
        inToc = true
        currentChapter = {
          number: '',
          title: 'DAFTAR ISI',
          section_type: 'daftar_isi',
          standalone: true,
          intro_lines: [],
          subsections: []
        }
        rawChapters.push(currentChapter)
        continue
      }

      // 2. Proteksi Daftar Isi
      if (inToc) {
        const babCheck = text.match(chapterRegex)
        if (
          babCheck &&
          (babCheck[1].toUpperCase() === 'I' || babCheck[1] === '1') &&
          !/\.{3,}/.test(text) &&
          lineObj.y > 600
        ) {
          inToc = false
        } else {
          if (currentChapter) {
            currentChapter.intro_lines.push(text)
          }
          continue
        }
      }

      // 3. Deteksi Heading Bab (BAB I, BAB II, dst.)
      const chMatch = text.match(chapterRegex)
      if (chMatch) {
        const roman = chMatch[1].toUpperCase()
        const remainder = (chMatch[3] || '').trim()

        const isSentence =
          /^(ini|akan|yang|membahas|tentang|menjelaskan|pada|dalam|dapat|adalah)\b/i.test(
            remainder
          )
        const hasDots = /\.{3,}/.test(text)
        const isHeadingLike =
          (lineObj.height >= 12 || lineObj.y > 600) && text.length < 90

        if (!isSentence && !hasDots && isHeadingLike) {
          if (currentSub && currentChapter) {
            currentChapter.subsections.push(currentSub)
            currentSub = null
          }

          let chTitle = remainder
          if (!chTitle && li + 1 < page.lines.length) {
            const nextL = page.lines[li + 1]
            if (
              nextL.height >= 12 &&
              !chapterRegex.test(nextL.text) &&
              !subAlphaRegex.test(nextL.text)
            ) {
              chTitle = nextL.text
              li++
              if (li + 1 < page.lines.length) {
                const nextL2 = page.lines[li + 1]
                if (
                  nextL2.height >= 12 &&
                  !chapterRegex.test(nextL2.text) &&
                  !subAlphaRegex.test(nextL2.text) &&
                  nextL2.text === nextL2.text.toUpperCase() &&
                  nextL2.text.length < 70
                ) {
                  chTitle += ' ' + nextL2.text
                  li++
                }
              }
            }
          }

          currentChapter = {
            number: `BAB ${roman}`,
            title: chTitle || `BAB ${roman}`,
            section_type:
              roman === 'V' || /penutup|kesimpulan/i.test(chTitle)
                ? 'kesimpulan'
                : 'bab',
            standalone: false,
            intro_lines: [],
            subsections: []
          }
          rawChapters.push(currentChapter)
          continue
        }
      }

      // 4. Deteksi Heading Utama Mandiri (ABSTRAK, KATA PENGANTAR, DAFTAR PUSTAKA, dsb.)
      const matchedMajor = standaloneMajorHeadings.find((h) =>
        new RegExp(`^${h}$`, 'i').test(text)
      )
      if (
        matchedMajor &&
        lineObj.height >= 12 &&
        text.length < 50 &&
        lineObj.y > 600
      ) {
        if (currentSub && currentChapter) {
          currentChapter.subsections.push(currentSub)
          currentSub = null
        }

        currentChapter = {
          number: '',
          title: matchedMajor,
          section_type: /pustaka/i.test(matchedMajor) ? 'daftar_pustaka' : 'bab',
          standalone: true, // Bab mandiri: tidak memiliki sub-bab dan tidak menampilkan dummy '1. Pengantar'
          intro_lines: [],
          subsections: []
        }
        rawChapters.push(currentChapter)
        continue
      }

      // 5. Deteksi Sub-bab (A. Judul, 1.1 Judul) - Hanya jika BUKAN bab mandiri
      if (currentChapter && !currentChapter.standalone) {
        const subAlphaMatch = text.match(subAlphaRegex)
        const subAlphaSoloMatch = text.match(subAlphaSoloRegex)
        const subNumMatch = text.match(subNumRegex)

        let code = ''
        let subTitle = ''

        if (subAlphaMatch) {
          code = subAlphaMatch[1]
          subTitle = subAlphaMatch[2].trim()
        } else if (subAlphaSoloMatch && li + 1 < page.lines.length) {
          // A. di baris tersendiri, judul sub-bab di baris berikutnya
          code = subAlphaSoloMatch[1]
          subTitle = page.lines[li + 1].text.trim()
          li++ // lewati baris judul
        } else if (subNumMatch) {
          code = subNumMatch[1]
          subTitle = subNumMatch[3].trim()
        }

        if (code && subTitle && subTitle.length < 90 && !/\.{3,}/.test(subTitle)) {
          if (!isFalseSubsection(code, subTitle)) {
            if (currentSub) {
              currentChapter.subsections.push(currentSub)
            }

            currentSub = {
              code,
              title: subTitle,
              lines: []
            }
            continue
          }
        }
      }

      // 6. Baris Konten Isi
      if (currentSub) {
        currentSub.lines.push(text)
      } else if (currentChapter) {
        // Baris sebelum sub-bab pertama (atau isi bab mandiri) disimpan di intro_lines
        currentChapter.intro_lines.push(text)
      } else {
        currentChapter = {
          number: '',
          title: 'Bagian Awal',
          section_type: 'bab',
          standalone: true,
          intro_lines: [text],
          subsections: []
        }
        rawChapters.push(currentChapter)
      }
    }
  }

  if (currentSub && currentChapter) {
    currentChapter.subsections.push(currentSub)
  }

  // Fallback pengaman jika tidak ada bab sama sekali
  if (rawChapters.length === 0) {
    const allLines = pages.flatMap((p) => p.lines.map((l) => l.text))
    rawChapters.push({
      number: 'BAB I',
      title: 'Isi Dokumen Lengkap',
      section_type: 'bab',
      standalone: true,
      intro_lines: allLines,
      subsections: []
    })
  }

  // Transformasi ke format akhir dengan HTML yang rapi
  const finalChapters: LocalExtractedChapter[] = rawChapters.map((ch) => ({
    number: ch.number,
    title: ch.title,
    section_type: ch.section_type,
    standalone: ch.standalone,
    intro_html: ch.intro_lines.length > 0 ? linesToHtml(ch.intro_lines) : undefined,
    content_html: ch.standalone && ch.intro_lines.length > 0 ? linesToHtml(ch.intro_lines) : undefined,
    subsections: ch.subsections.map((sub) => ({
      code: sub.code,
      title: sub.title,
      content_html: linesToHtml(sub.lines)
    }))
  }))

  return {
    document_title: detectedTitle,
    chapters: finalChapters
  }
}
