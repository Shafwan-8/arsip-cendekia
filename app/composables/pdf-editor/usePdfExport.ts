import { ref } from 'vue'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type {
  PdfEditorElement,
  TextPdfElement,
  HighlightPdfElement,
  ImagePdfElement,
  SignaturePdfElement,
  DrawPdfElement,
  RectPdfElement
} from '~/types/pdf-editor'
import { hexToRgb } from '~/utils/pdf-editor/coordinates'
import { formatEditedFileName, downloadBlob } from '~/utils/pdf-editor/download'

export interface ExportPdfOptions {
  originalPdfBytes: ArrayBuffer
  elements: PdfEditorElement[]
  originalFileName?: string
  documentTitle?: string
}

export const usePdfExport = () => {
  const isSaving = ref(false)
  const exportError = ref('')

  /**
   * Helper konversi Data URL ke Uint8Array
   */
  const dataUrlToBytes = (dataUrl: string): Uint8Array => {
    const base64 = dataUrl.split(',')[1]
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  /**
   * Terapkan seluruh elemen ke PDF dan unduh ke perangkat user
   */
  const exportAndDownload = async (options: ExportPdfOptions): Promise<boolean> => {
    if (isSaving.value) return false

    isSaving.value = true
    exportError.value = ''

    try {
      if (!options.originalPdfBytes || options.originalPdfBytes.byteLength === 0) {
        throw new Error('Data berkas PDF asli tidak tersedia untuk di-export.')
      }

      // 1. Muat PDF asli menggunakan pdf-lib
      const pdfDoc = await PDFDocument.load(options.originalPdfBytes)
      const pages = pdfDoc.getPages()

      // Muat font standar yang didukung secara native oleh PDF spec
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const helveticaObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
      const helveticaBoldObliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

      // 2. Iterasi elemen per halaman
      for (const elem of options.elements) {
        const pageIdx = elem.page - 1
        if (pageIdx < 0 || pageIdx >= pages.length) continue

        const targetPage = pages[pageIdx]
        const { width: pdfWidth, height: pdfHeight } = targetPage.getSize()

        // Koordinat tersimpan di skala 1: origin kiri-atas -> PDF origin kiri-bawah
        const pdfX = elem.x
        const pdfW = elem.width
        const pdfH = elem.height
        const pdfY = pdfHeight - (elem.y + elem.height)

        if (elem.type === 'text') {
          const textElem = elem as TextPdfElement
          let selectedFont = helveticaFont
          if (textElem.bold && textElem.italic) {
            selectedFont = helveticaBoldObliqueFont
          } else if (textElem.bold) {
            selectedFont = helveticaBoldFont
          } else if (textElem.italic) {
            selectedFont = helveticaObliqueFont
          }

          const color = hexToRgb(textElem.color || '#000000')

          targetPage.drawText(textElem.text, {
            x: pdfX,
            // Offset sedikit agar baseline teks berada rapi di dalam kotak
            y: pdfY + 2,
            size: textElem.fontSize || 14,
            font: selectedFont,
            color: rgb(color.r, color.g, color.b)
          })
        } else if (elem.type === 'highlight') {
          const hlElem = elem as HighlightPdfElement
          const color = hexToRgb(hlElem.color || '#facc15')

          targetPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(color.r, color.g, color.b),
            opacity: hlElem.opacity ?? 0.35
          })
        } else if (elem.type === 'image' || elem.type === 'signature') {
          const imgElem = elem as (ImagePdfElement | SignaturePdfElement)
          if (!imgElem.dataUrl) continue

          const isJpg = imgElem.dataUrl.startsWith('data:image/jpeg') || imgElem.dataUrl.startsWith('data:image/jpg')
          const imgBytes = dataUrlToBytes(imgElem.dataUrl)

          let embeddedImage
          if (isJpg) {
            embeddedImage = await pdfDoc.embedJpg(imgBytes)
          } else {
            embeddedImage = await pdfDoc.embedPng(imgBytes)
          }

          targetPage.drawImage(embeddedImage, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH
          })
        } else if (elem.type === 'draw') {
          const drawElem = elem as DrawPdfElement
          if (drawElem.points && drawElem.points.length > 1) {
            const color = hexToRgb(drawElem.color || '#000000')
            for (let i = 0; i < drawElem.points.length - 1; i++) {
              const p1 = drawElem.points[i]
              const p2 = drawElem.points[i + 1]

              targetPage.drawLine({
                start: { x: p1.x, y: pdfHeight - p1.y },
                end: { x: p2.x, y: pdfHeight - p2.y },
                thickness: drawElem.strokeWidth || 2,
                color: rgb(color.r, color.g, color.b)
              })
            }
          }
        } else if (elem.type === 'rect') {
          const rectElem = elem as RectPdfElement
          const stroke = hexToRgb(rectElem.strokeColor || '#2563eb')
          const fill = rectElem.fillColor ? hexToRgb(rectElem.fillColor) : undefined

          targetPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            borderColor: rgb(stroke.r, stroke.g, stroke.b),
            borderWidth: rectElem.strokeWidth || 2,
            color: fill ? rgb(fill.r, fill.g, fill.b) : undefined
          })
        }
      }

      // 3. Simpan perubahan ke binary Uint8Array
      const modifiedBytes = await pdfDoc.save()

      // 4. Buat Blob dan picu browser download
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' })
      const fileName = formatEditedFileName(options.originalFileName, options.documentTitle)

      downloadBlob(blob, fileName)
      return true
    } catch (err: any) {
      console.error('Gagal melakukan export PDF:', err)
      exportError.value = err?.message || 'Gagal menghasilkan berkas PDF yang telah diedit.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  return {
    isSaving,
    exportError,
    exportAndDownload
  }
}
