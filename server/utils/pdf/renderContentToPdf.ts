import puppeteer from 'puppeteer'
import { marked } from 'marked'
import type { DocumentContentBlock } from '~/types/documentContentBlock'

export interface RenderPdfMeta {
  title: string
  author?: string
  category?: string
  year?: string | number
}

/**
 * Mengubah konten blok dokumen (TipTap JSON / Markdown) menjadi potongan HTML bersih
 */
function convertBlockContentToHtml(block: DocumentContentBlock): string {
  if (!block.content) return ''

  // 1. Jika konten memiliki string HTML langsung
  if (typeof block.content.html === 'string' && block.content.html.trim()) {
    return block.content.html
  }

  // 2. Jika konten memiliki raw markdown
  if (typeof block.content.raw_markdown === 'string' && block.content.raw_markdown.trim()) {
    return marked.parse(block.content.raw_markdown) as string
  }

  // 3. Jika konten merupakan TipTap JSON Object
  if (block.content.type === 'doc' && Array.isArray(block.content.content)) {
    try {
      // Dynamic import atau fallback serializer jika @tiptap/html dimuat
      return serializeTipTapJsonToHtml(block.content)
    } catch {
      return '<p>Konten tidak dapat dirender.</p>'
    }
  }

  // 4. Jika content adalah string
  if (typeof block.content === 'string') {
    return marked.parse(block.content) as string
  }

  return ''
}

/**
 * Serializer mandiri untuk TipTap JSON Node komprehensif tanpa ketergantungan DOM eksternal
 */
function serializeTipTapJsonToHtml(node: any): string {
  if (!node) return ''

  if (node.type === 'text') {
    let text = escapeHtml(node.text || '')
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        if (mark.type === 'italic') text = `<em>${text}</em>`
        if (mark.type === 'code') text = `<code>${text}</code>`
        if (mark.type === 'strike') text = `<s>${text}</s>`
        if (mark.type === 'subscript') text = `<sub>${text}</sub>`
        if (mark.type === 'superscript') text = `<sup>${text}</sup>`
        if (mark.type === 'textStyle' && mark.attrs?.fontFamily) {
          text = `<span style="font-family: ${escapeHtml(mark.attrs.fontFamily)}">${text}</span>`
        }
      }
    }
    return text
  }

  const innerHtml = Array.isArray(node.content)
    ? node.content.map(serializeTipTapJsonToHtml).join('')
    : ''

  const alignStyle = node.attrs?.textAlign ? ` style="text-align: ${escapeHtml(node.attrs.textAlign)}"` : ''

  switch (node.type) {
    case 'doc':
      return innerHtml
    case 'paragraph':
      return `<p${alignStyle}>${innerHtml || '<br>'}</p>`
    case 'heading': {
      const level = node.attrs?.level || 2
      return `<h${level}${alignStyle}>${innerHtml}</h${level}>`
    }
    case 'bulletList':
      return `<ul>${innerHtml}</ul>`
    case 'orderedList':
      return `<ol>${innerHtml}</ol>`
    case 'listItem':
      return `<li>${innerHtml}</li>`
    case 'blockquote':
      return `<blockquote>${innerHtml}</blockquote>`
    case 'horizontalRule':
      return '<hr>'
    case 'table':
      return `<table><tbody>${innerHtml}</tbody></table>`
    case 'tableRow':
      return `<tr>${innerHtml}</tr>`
    case 'tableHeader':
      return `<th>${innerHtml}</th>`
    case 'tableCell':
      return `<td>${innerHtml}</td>`
    case 'image': {
      const src = escapeHtml(node.attrs?.src || '')
      const alt = escapeHtml(node.attrs?.alt || '')
      return `<img src="${src}" alt="${alt}" />`
    }
    default:
      return innerHtml
  }
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
 * Menyusun keseluruhan HTML dokumen buku/jurnal/skripsi dengan styling CSS cetak A4
 */
function buildFullDocumentHtml(blocks: DocumentContentBlock[], meta: RenderPdfMeta): string {
  const currentYear = meta.year || new Date().getFullYear()
  const authorName = meta.author || 'Tim Riset Cendekia AI'
  const categoryLabel = (meta.category || 'Buku').toUpperCase()

  const sectionsHtml = blocks
    .sort((a, b) => a.block_order - b.block_order)
    .map(block => {
      const isReferences = block.section_type === 'daftar_pustaka'
      const contentHtml = convertBlockContentToHtml(block)

      return `
        <section class="document-section ${isReferences ? 'references-section' : ''}">
          <h2 class="section-title">${escapeHtml(block.title)}</h2>
          <div class="section-body">
            ${contentHtml}
          </div>
        </section>
      `
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(meta.title)}</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm 25mm 20mm;
      @bottom-right {
        content: counter(page);
        font-size: 9pt;
        color: #64748b;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover Page */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      page-break-after: always;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #f1f5f9;
      color: #e11d48;
      border: 1px solid #fda4af;
      border-radius: 9999px;
      font-size: 10pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin: 0 0 20px 0;
      max-width: 650px;
    }

    .cover-author {
      font-size: 13pt;
      font-weight: 600;
      color: #475569;
      margin: 0 0 10px 0;
    }

    .cover-meta {
      font-size: 10pt;
      color: #64748b;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      width: 250px;
    }

    /* Section & Chapters */
    .document-section {
      page-break-before: always;
      padding-top: 10px;
    }

    .section-title {
      font-size: 17pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 2px solid #e11d48;
      padding-bottom: 8px;
      margin-top: 0;
      margin-bottom: 20px;
    }

    .section-body h2 {
      font-size: 13pt;
      font-weight: 600;
      color: #1e293b;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    .section-body h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    .section-body p {
      margin-top: 0;
      margin-bottom: 14px;
      text-align: justify;
    }

    .section-body ul, .section-body ol {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 24px;
    }

    .section-body li {
      margin-bottom: 6px;
    }

    .section-body blockquote {
      border-left: 4px solid #e11d48;
      margin: 16px 0;
      padding: 8px 16px;
      background: #f8fafc;
      color: #475569;
      font-style: italic;
    }

    /* Table Styling for Print */
    .section-body table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    .section-body th, .section-body td {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
      vertical-align: top;
    }

    .section-body th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }

    .section-body tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Image Styling for Print */
    .section-body img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px auto;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    /* Subscript and Superscript */
    .section-body sub {
      vertical-align: sub;
      font-size: 0.75em;
    }

    .section-body sup {
      vertical-align: super;
      font-size: 0.75em;
    }

    /* References Styling (APA Hanging Indent) */
    .references-section .section-body p {
      padding-left: 2em;
      text-indent: -2em;
      margin-bottom: 12px;
      font-size: 10pt;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-badge">${escapeHtml(categoryLabel)}</div>
    <h1 class="cover-title">${escapeHtml(meta.title)}</h1>
    <p class="cover-author">Oleh: ${escapeHtml(authorName)}</p>
    <div class="cover-meta">
      <p style="margin: 0; font-weight: 600;">Arsip Cendekia</p>
      <p style="margin: 4px 0 0 0;">Tahun Penerbitan: ${escapeHtml(String(currentYear))}</p>
    </div>
  </div>

  <!-- Content Sections -->
  ${sectionsHtml}
</body>
</html>`
}

/**
 * Menghasilkan PDF Buffer dari array DocumentContentBlock menggunakan Puppeteer
 */
export async function renderDocumentToPdf(
  blocks: DocumentContentBlock[],
  meta: RenderPdfMeta
): Promise<Buffer> {
  const html = buildFullDocumentHtml(blocks, meta)

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    })

    return Buffer.from(pdfUint8)
  } finally {
    await browser.close()
  }
}
