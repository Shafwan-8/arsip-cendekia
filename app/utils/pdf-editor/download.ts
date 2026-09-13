/**
 * Format nama berkas hasil edit dengan suffix yang aman.
 * Menghindari undefined-edited.pdf, null-edited.pdf, dsb.
 */
export const formatEditedFileName = (
  originalFileName?: string | null,
  fallbackTitle?: string | null
): string => {
  let baseName = ''

  if (originalFileName && originalFileName.trim() && originalFileName !== 'undefined' && originalFileName !== 'null') {
    baseName = originalFileName.replace(/\.pdf$/i, '').trim()
  } else if (fallbackTitle && fallbackTitle.trim() && fallbackTitle !== 'undefined' && fallbackTitle !== 'null') {
    baseName = fallbackTitle
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .trim()
  }

  if (!baseName) {
    baseName = 'dokumen'
  }

  return `${baseName}_document-edited.pdf`
}

/**
 * Memicu browser download untuk Blob PDF yang sudah dibuat.
 */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  if (typeof window === 'undefined') return

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Bersihkan object URL setelah sedikit delay
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 2000)
}
