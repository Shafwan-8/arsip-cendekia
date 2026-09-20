import { Type } from '@google/genai'

export interface OutlinePromptResult {
  systemInstruction: string
  contents: string
  responseSchema: any
}

export interface GenerationPromptResult {
  systemInstruction: string
  contents: string
}

/**
 * Membangun prompt untuk menyusun Daftar Isi (Outline) buku/jurnal/skripsi
 * Menggunakan responseSchema terstruktur untuk konsistensi bab.
 */
export function buildOutlinePrompt(
  judul: string,
  kategori: 'buku' | 'jurnal' | 'skripsi' = 'buku'
): OutlinePromptResult {
  const kategoriLabel = kategori === 'jurnal' ? 'Artikel Jurnal Ilmiah' : kategori === 'skripsi' ? 'Skripsi Akademik' : 'Buku Akademik'

  const chapterCountGuideline =
    kategori === 'jurnal'
      ? 'Buat 4 sampai 5 bagian utama (contoh: Pendahuluan, Tinjauan Pustaka, Metodologi Penelitian, Hasil dan Pembahasan).'
      : kategori === 'skripsi'
        ? 'Buat 5 bab standar skripsi (Bab I Pendahuluan, Bab II Tinjauan Pustaka, Bab III Metode Penelitian, Bab IV Hasil dan Pembahasan, Bab V Penutup).'
        : 'Buat 5 sampai 7 bab berurutan yang komprehensif, mencakup pengantar fundamental hingga aplikasi dan analisis mendalam.'

  const systemInstruction = `Anda adalah seorang akademisi, penulis buku, dan editor literatur ilmiah profesional tingkat tinggi.
Tugas Anda adalah merancang struktur Daftar Isi (Outline Bab) yang logis, koheren, mendalam, dan bernilai ilmiah tinggi untuk karya bertema "${kategoriLabel}".

ATURAN UTAMA:
1. Susun daftar judul bab yang jelas, akademis, dan informatif.
2. Jangan menyertakan kata "Daftar Isi", "Kesimpulan", atau "Daftar Pustaka" ke dalam array bab, karena bagian-bagian tersebut akan dibuat dan dikelola secara terpisah oleh sistem.
3. ${chapterCountGuideline}
4. Setiap judul bab harus berbobot akademis dalam Bahasa Indonesia yang baku dan elegan.`

  const contents = `Judul Karya: "${judul}"
Kategori: ${kategoriLabel}

Susunlah daftar bab terbaik untuk karya tersebut dalam format JSON terstruktur.`

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      chapters: {
        type: Type.ARRAY,
        description: 'Daftar judul bab yang berurutan dan koheren',
        items: {
          type: Type.STRING
        }
      }
    },
    required: ['chapters']
  }

  return {
    systemInstruction,
    contents,
    responseSchema
  }
}

/**
 * Membangun prompt untuk menulis isi lengkap satu bab buku/jurnal/skripsi dalam format Markdown
 */
export function buildChapterPrompt(
  judulKarya: string,
  judulBab: string,
  ringkasanBabSebelumnya: string | null = null
): GenerationPromptResult {
  const systemInstruction = `Anda adalah seorang akademisi dan penulis profesional.
Tugas Anda adalah menulis konten bab yang lengkap, mendalam, kaya penjelasan, dan sangat terstruktur untuk sebuah karya ilmiah/buku.

PEDOMAN PENULISAN & FORMAT (MANDATORY):
1. Format tulisan WAJIB menggunakan Markdown bersih yang mudah dikonversi ke HTML.
2. Gunakan subjudul Markdown level 2 dan level 3 (## dan ###) untuk membagi pembahasan bab menjadi 3 hingga 5 sub-bagian yang mendalam.
3. Sajikan penjelasan paragraf yang berbobot, elaboratif, dan mengalir, dilengkapi dengan daftar poin (* atau 1.) pada bagian yang membutuhkan rincian atau taksonomi konsep.
4. Jaga koherensi dan nada ilmiah akademis (formal, objektif, analitis).
5. ATURAN ANTI-HALUSINASI: Jangan mengarang data numerik statistik eksperimental atau nama peneliti fiktif seolah-olah fakta empiris nyata jika tidak ada rujukan pasti. Fokuslah pada teori established, konsep metodologis, penjelasan analitis, dan telaah komparatif.
6. Seluruh konten ditulis dalam Bahasa Indonesia yang baik dan benar.`

  const contextKarya = ringkasanBabSebelumnya
    ? `\nKonteks Pembahasan Bab Sebelumnya:\n${ringkasanBabSebelumnya}\n`
    : ''

  const contents = `Karya: "${judulKarya}"
Judul Bab yang Harus Ditulis: "${judulBab}"
${contextKarya}
Instruksi: Tuliskan isi bab "${judulBab}" secara utuh, mendalam, dan komprehensif dari awal hingga akhir bab menggunakan format Markdown terstruktur.`

  return {
    systemInstruction,
    contents
  }
}

/**
 * Membangun prompt untuk menulis bab Kesimpulan dan Rekomendasi
 */
export function buildConclusionPrompt(
  judulKarya: string,
  ringkasanSemuaBab: string
): GenerationPromptResult {
  const systemInstruction = `Anda adalah seorang akademisi dan editor senior.
Tugas Anda adalah menyusun bab "Kesimpulan dan Rekomendasi" yang merangkum esensi keseluruhan karya secara tajam, berwawasan luas, dan visioner.

PEDOMAN:
1. Gunakan Markdown terstruktur (## dan ###).
2. Awali dengan sintesis konseptual dari seluruh bab yang telah dibahas.
3. Sajikan poin-poin kesimpulan utama (Key Takeaways).
4. Sertakan implikasi teoritis dan praktis, serta rekomendasi atau arah penelitian/pengembangan di masa depan.
5. Gunakan Bahasa Indonesia akademis yang formal dan tegas.`

  const contents = `Karya: "${judulKarya}"

Rangkuman Topik Seluruh Bab yang Telah Dibahas:
${ringkasanSemuaBab}

Instruksi: Tuliskan bagian Kesimpulan dan Rekomendasi yang komprehensif dalam format Markdown terstruktur.`

  return {
    systemInstruction,
    contents
  }
}
