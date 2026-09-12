import type { DocumentCategoryConfig } from '~/types/document'

/**
 * Format ukuran berkas dalam bytes menjadi format yang mudah dibaca (B, KB, MB, GB).
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Ekstrak relative path berkas di bucket storage Supabase dari public URL.
 */
export const extractStoragePath = (fileUrl: string, bucketName: string = 'arsip_pdf'): string | null => {
  if (!fileUrl) return null
  const marker = `/${bucketName}/`
  const idx = fileUrl.indexOf(marker)
  if (idx !== -1) {
    const rawPath = fileUrl.substring(idx + marker.length)
    return decodeURIComponent(rawPath.split('?')[0])
  }
  return null
}

/**
 * Membersihkan nama berkas dari karakter yang tidak didukung dalam path storage.
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Membuat storage path unik dengan timestamp.
 */
export const createStoragePath = (folder: string, fileName: string): string => {
  const cleanName = sanitizeFileName(fileName)
  return `${folder}/${Date.now()}_${cleanName}`
}

/**
 * Konfigurasi dokumen berdasarkan kategori (Buku, Jurnal, Skripsi).
 */
export const documentCategoryConfig: Record<'buku' | 'jurnal' | 'skripsi', DocumentCategoryConfig> = {
  buku: {
    label: 'Buku',
    pluralLabel: 'Buku',
    category: 'buku',
    basePath: '/buku',
    storageFolder: 'buku',
    color: 'rose',
    pageTitle: 'Koleksi Buku Literatur - Arsip Cendekia',
    headerTitle: 'Buku Literatur',
    headerDescription: 'Daftar buku literatur yang telah Anda upload',
    uploadBtnText: 'Upload Buku Baru',
    uploadModalTitle: 'Upload Buku ke Arsip',
    deleteModalTitle: 'Hapus Buku Literatur?',
    emptyTitle: 'Belum ada buku di Supabase',
    emptyDescription: 'Belum ada data dokumen kategori buku. Klik tombol di bawah untuk mengunggah buku pertama Anda.',
    searchPlaceholder: 'Cari judul buku, penulis, penerbit, atau nama file...',
    theme: {
      badgeBg: 'bg-rose-500/10',
      badgeBorder: 'border-rose-500/20',
      badgeText: 'text-rose-400',
      primaryBtn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20',
      primaryText: 'text-rose-400',
      focusBorder: 'focus:border-rose-500/80',
      activePage: 'bg-rose-500 text-white shadow-rose-500/20',
      accentBg: 'bg-rose-500/5',
      accentBorder: 'border-rose-500'
    }
  },

  jurnal: {
    label: 'Jurnal',
    pluralLabel: 'Jurnal',
    category: 'jurnal',
    basePath: '/jurnal',
    storageFolder: 'jurnal',
    color: 'blue',
    pageTitle: 'Koleksi Jurnal Ilmiah - Arsip Cendekia',
    headerTitle: 'Jurnal Ilmiah',
    headerDescription: 'Daftar jurnal ilmiah yang telah Anda upload',
    uploadBtnText: 'Upload Jurnal Baru',
    uploadModalTitle: 'Upload Jurnal ke Arsip',
    deleteModalTitle: 'Hapus Jurnal Ilmiah?',
    emptyTitle: 'Belum ada jurnal di Supabase',
    emptyDescription: 'Belum ada data dokumen kategori jurnal. Klik tombol di bawah untuk mengunggah jurnal pertama Anda.',
    searchPlaceholder: 'Cari judul jurnal, penulis, penerbit, atau nama file...',
    theme: {
      badgeBg: 'bg-blue-500/10',
      badgeBorder: 'border-blue-500/20',
      badgeText: 'text-blue-400',
      primaryBtn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20',
      primaryText: 'text-blue-400',
      focusBorder: 'focus:border-blue-500/80',
      activePage: 'bg-blue-500 text-white shadow-blue-500/20',
      accentBg: 'bg-blue-500/5',
      accentBorder: 'border-blue-500'
    }
  },

  skripsi: {
    label: 'Skripsi',
    pluralLabel: 'Skripsi',
    category: 'skripsi',
    basePath: '/skripsi',
    storageFolder: 'skripsi',
    color: 'violet',
    pageTitle: 'Koleksi Skripsi & Tugas Akhir - Arsip Cendekia',
    headerTitle: 'Skripsi & Tugas Akhir',
    headerDescription: 'Daftar skripsi dan tugas akhir yang telah Anda upload',
    uploadBtnText: 'Upload Skripsi Baru',
    uploadModalTitle: 'Upload Skripsi ke Arsip',
    deleteModalTitle: 'Hapus Skripsi?',
    emptyTitle: 'Belum ada skripsi di Supabase',
    emptyDescription: 'Belum ada data dokumen kategori skripsi. Klik tombol di bawah untuk mengunggah skripsi pertama Anda.',
    searchPlaceholder: 'Cari judul skripsi, penulis, institusi, atau nama file...',
    theme: {
      badgeBg: 'bg-violet-500/10',
      badgeBorder: 'border-violet-500/20',
      badgeText: 'text-violet-400',
      primaryBtn: 'bg-violet-500 hover:bg-violet-600 shadow-violet-500/20',
      primaryText: 'text-violet-400',
      focusBorder: 'focus:border-violet-500/80',
      activePage: 'bg-violet-500 text-white shadow-violet-500/20',
      accentBg: 'bg-violet-500/5',
      accentBorder: 'border-violet-500'
    }
  }
}
