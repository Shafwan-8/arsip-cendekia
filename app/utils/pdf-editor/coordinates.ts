import type { Point } from '~/types/pdf-editor'

/**
 * Konversi koordinat elemen editor (basis skala 1, origin kiri-atas)
 * ke koordinat native PDF (origin kiri-bawah).
 */
export const screenToPdfCoords = (
  x: number,
  y: number,
  width: number,
  height: number,
  baseWidth: number,
  baseHeight: number,
  pdfWidth: number,
  pdfHeight: number
) => {
  const ratioX = pdfWidth / baseWidth
  const ratioY = pdfHeight / baseHeight

  return {
    x: x * ratioX,
    // PDF Y berakar di kiri-bawah halaman
    y: (baseHeight - (y + height)) * ratioY,
    width: width * ratioX,
    height: height * ratioY
  }
}

/**
 * Konversi satu titik garis (draw) ke koordinat native PDF.
 */
export const pointToPdfCoords = (
  point: Point,
  baseWidth: number,
  baseHeight: number,
  pdfWidth: number,
  pdfHeight: number
): Point => {
  const ratioX = pdfWidth / baseWidth
  const ratioY = pdfHeight / baseHeight

  return {
    x: point.x * ratioX,
    y: (baseHeight - point.y) * ratioY
  }
}

/**
 * Konversi warna hex (#rrggbb atau #rrggbbaa) menjadi nilai RGB 0-1 untuk pdf-lib
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  let cleanHex = hex.replace('#', '').trim()
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map(char => char + char)
      .join('')
  }

  const num = parseInt(cleanHex.substring(0, 6), 16)
  if (isNaN(num)) {
    return { r: 0, g: 0, b: 0 }
  }

  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  }
}
