# IMPLEMENTASI NAVIGASI BAB PDF OTOMATIS DENGAN ADOBE PDF EXTRACT API

Saya memiliki project **Nuxt 3 + Vue 3 + TypeScript + Supabase** yang sudah memiliki sistem penyimpanan file PDF di **Supabase Storage**.

Saya ingin menambahkan fitur **navigasi BAB PDF otomatis**.

Tujuan utamanya adalah:

> User membuka sebuah PDF → sistem menganalisis struktur PDF menggunakan Adobe PDF Extract API → sistem mendeteksi judul BAB/heading beserta nomor halamannya → hasil ekstraksi disimpan ke Supabase → ketika PDF dibuka, sidebar menampilkan daftar BAB → user dapat mengklik BAB tertentu → PDF viewer langsung berpindah ke halaman BAB tersebut.

Implementasi harus dibuat **modular, reusable, aman, dan mudah di-maintain**.

Kategori dokumen yang harus dapat menggunakan fitur ini:

```text
Buku
Jurnal
Skripsi
```

Jangan membuat tiga implementasi berbeda untuk masing-masing kategori.

Gunakan satu logic utama yang reusable.

---

# 1. ANALISIS PROJECT TERLEBIH DAHULU

Sebelum menulis atau mengubah kode:

1. Periksa struktur project Nuxt.
2. Periksa konfigurasi Supabase yang sudah digunakan.
3. Periksa tabel `documents` yang sudah ada.
4. Periksa Supabase Storage bucket yang digunakan untuk PDF.
5. Periksa bagaimana `file_url`, `file_name`, atau storage path saat ini disimpan.
6. Periksa component PDF viewer yang sudah ada.
7. Periksa routing halaman Buku, Jurnal, dan Skripsi.
8. Periksa apakah sudah terdapat composable untuk Supabase.
9. Periksa apakah sudah ada sistem notification/toast.
10. Periksa environment variable yang sudah digunakan.

**Jangan membuat implementasi yang bertentangan dengan architecture project yang sudah ada.**

Jika project sudah memiliki utility/composable yang dapat digunakan kembali, gunakan kembali daripada membuat duplikat.

---

# 2. TUJUAN FITUR

Contoh alur:

```text
User membuka:
Buku → Read PDF

        ↓

PDF ditampilkan

        ↓

Sistem mengecek:
Apakah document_chapters sudah tersedia?

        ↓
       Ya
        ↓
Tampilkan daftar BAB

atau

       Tidak
        ↓
Jalankan ekstraksi Adobe PDF Extract API
        ↓
Simpan hasil ke Supabase
        ↓
Tampilkan daftar BAB
```

Sidebar harus menampilkan sesuatu seperti:

```text
DAFTAR ISI

BAB I Pendahuluan
BAB II Landasan Teori
BAB III Metodologi Penelitian
BAB IV Hasil dan Pembahasan
BAB V Kesimpulan
```

Ketika user menekan:

```text
BAB III Metodologi Penelitian
```

PDF viewer langsung berpindah ke halaman yang disimpan pada:

```text
document_chapters.nomor_halaman
```

---

# 3. DATABASE SUPABASE

## 3.1 Tabel `documents`

Project kemungkinan sudah memiliki tabel `documents`.

**Jangan membuat ulang tabel jika tabel tersebut sudah ada.**

Periksa schema existing terlebih dahulu.

Jika tabel belum memiliki status ekstraksi, tambahkan field yang diperlukan menggunakan migration yang aman.

Contoh rancangan:

```sql
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_status TEXT
DEFAULT 'pending';

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_error TEXT;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_started_at TIMESTAMPTZ;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_completed_at TIMESTAMPTZ;
```

Status yang digunakan:

```text
pending
processing
completed
failed
```

Jangan membuat status yang terlalu banyak jika tidak diperlukan.

---

# 4. TABEL `document_chapters`

Buat tabel:

```sql
CREATE TABLE IF NOT EXISTS document_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL
        REFERENCES documents(id)
        ON DELETE CASCADE,

    judul_bab TEXT NOT NULL,

    nomor_halaman INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Tambahkan index:

```sql
CREATE INDEX IF NOT EXISTS idx_document_chapters_document_id
ON document_chapters(document_id);
```

Jika diperlukan:

```sql
CREATE INDEX IF NOT EXISTS idx_document_chapters_document_page
ON document_chapters(document_id, nomor_halaman);
```

---

# 5. VALIDASI DATA BAB

Pastikan:

```text
nomor_halaman >= 1
```

dan:

```text
document_id
```

harus merupakan document yang valid.

Jangan menyimpan duplicate chapter secara tidak sengaja.

Jika extraction dijalankan ulang:

```text
DELETE existing chapters
        ↓
INSERT hasil terbaru
```

atau gunakan transaction/upsert strategy yang aman.

Prioritaskan agar hasil extraction tidak menghasilkan:

```text
BAB I
BAB I
BAB I
```

secara berulang.

---

# 6. ROW LEVEL SECURITY

Periksa RLS yang sudah digunakan pada:

```text
documents
document_chapters
```

Jika aplikasi menggunakan authentication, pastikan user hanya dapat mengakses chapter dari document yang memang dapat mereka akses.

Jangan menonaktifkan RLS hanya agar fitur bekerja.

Jika perlu policy baru, buat policy yang mengikuti authorization existing project.

---

# 7. BACKEND NUXT

Buat server route:

```text
server/api/extract-pdf.post.ts
```

atau:

```text
server/api/extract-pdf.ts
```

sesuai convention project.

API menerima:

```json
{
  "document_id": "...",
  "file_path": "..."
}
```

Tetapi:

**Jangan mempercayai `file_path` dari client secara penuh.**

Jika `document_id` sudah diberikan, idealnya server memvalidasi document tersebut terlebih dahulu dan mengambil storage path dari database.

---

# 8. VALIDASI REQUEST

Backend harus memvalidasi:

```text
document_id
file_path
```

Pastikan:

```text
document_id valid
document exists
file_path valid
file benar-benar PDF
user memiliki akses
```

Jika data tidak valid:

```text
400 Bad Request
```

Jika document tidak ditemukan:

```text
404 Not Found
```

Jika user tidak memiliki akses:

```text
403 Forbidden
```

Jangan mengembalikan informasi sensitif.

---

# 9. SUPABASE STORAGE

PDF berasal dari:

```text
Supabase Storage
```

yang sudah digunakan project.

Jangan meminta user meng-upload PDF ulang.

Backend harus:

```text
document_id
    ↓
ambil metadata document
    ↓
ambil storage path
    ↓
download PDF
    ↓
Adobe PDF Extract API
```

Gunakan Supabase server client dengan credentials yang sesuai.

**Jangan pernah mengekspos service role key ke frontend.**

---

# 10. DOWNLOAD PDF KE SERVER

Backend perlu mengambil file PDF dari Supabase Storage.

Gunakan buffer atau temporary file sesuai kebutuhan Adobe SDK.

Contoh konsep:

```text
Supabase Storage
       ↓
ArrayBuffer / Buffer
       ↓
Temporary file
       ↓
Adobe PDF Extract API
```

Jika Adobe SDK membutuhkan file lokal, gunakan temporary directory.

Nama file harus aman dan unik.

Contoh:

```text
/tmp/pdf-extract-{document_id}-{timestamp}.pdf
```

---

# 11. CLEANUP TEMPORARY FILE

Ini WAJIB.

Temporary file harus dihapus:

```text
ketika extraction berhasil
```

maupun:

```text
ketika extraction gagal
```

Gunakan:

```ts
try {
    // extraction
} catch (error) {
    // error handling
} finally {
    // cleanup temporary file
}
```

Jangan meninggalkan PDF di server.

---

# 12. ADOBE PDF EXTRACT API

Gunakan:

```text
Adobe PDF Extract API
```

untuk melakukan ekstraksi struktur PDF.

Gunakan SDK/API resmi Adobe yang kompatibel dengan Node.js.

Sebelum implementasi:

1. Periksa package Adobe yang sudah terpasang.
2. Jika belum ada, gunakan package resmi yang sesuai.
3. Jangan menggunakan package tidak resmi jika API resmi tersedia.

Credential Adobe harus berada di:

```text
.env
```

Contoh konsep:

```env
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
```

Jangan pernah menaruh credential di:

```text
app/
components/
pages/
public/
frontend code
```

Jangan commit credential ke Git.

---

# 13. PROSES ASYNCHRONOUS ADOBE

Ini bagian penting.

Adobe PDF Extract API dapat menggunakan proses asynchronous.

Jangan membuat server route yang:

```text
submit extraction
↓
langsung menganggap hasil tersedia
```

Pastikan lifecycle API diikuti dengan benar:

```text
Download PDF
      ↓
Submit extraction job
      ↓
Tunggu / polling status sesuai mekanisme Adobe
      ↓
Job selesai
      ↓
Ambil hasil extraction
      ↓
Parse JSON
      ↓
Simpan ke Supabase
```

Gunakan mekanisme asynchronous yang direkomendasikan SDK/API Adobe.

---

# 14. HINDARI SERVER TIMEOUT

Jangan membuat request HTTP frontend menunggu proses extraction yang sangat lama tanpa strategi.

Jika extraction membutuhkan waktu lama, desain endpoint menggunakan job-based approach.

Contoh architecture yang lebih baik:

```text
POST /api/extract-pdf
        ↓
Buat extraction job
        ↓
Return:
{
  "job_id": "...",
  "status": "processing"
}
```

Kemudian:

```text
GET /api/extract-pdf/:jobId
```

untuk mengecek:

```text
processing
completed
failed
```

Jika project/server environment mampu menangani asynchronous processing secara aman dalam satu request, pendekatan tersebut boleh digunakan.

Tetapi **jangan melakukan polling tanpa batas**.

Gunakan:

```text
maximum polling duration
maximum retry
exponential backoff jika diperlukan
```

---

# 15. EXTRACTION STATUS

Update:

```text
documents.extraction_status
```

sesuai lifecycle:

```text
pending
    ↓
processing
    ↓
completed
```

atau:

```text
processing
    ↓
failed
```

Jika gagal:

```text
documents.extraction_error
```

dapat menyimpan pesan error yang aman dan ringkas.

Jangan menyimpan API credential atau data sensitif ke database.

---

# 16. PARSING HASIL ADOBE

Setelah Adobe mengembalikan JSON:

```text
Adobe Extract JSON
        ↓
Parse elements
        ↓
Identifikasi heading
        ↓
Identifikasi halaman
        ↓
Filter BAB
        ↓
Normalize
        ↓
Deduplicate
        ↓
Simpan database
```

Jangan hanya melakukan:

```ts
text.startsWith('BAB')
```

karena format dokumen dapat berbeda-beda.

Gunakan beberapa indikator.

---

# 17. DETEKSI BAB

Prioritaskan struktur heading dari Adobe jika tersedia.

Misalnya:

```text
H1
H2
```

atau struktur heading lain yang diberikan Adobe.

Kemudian gunakan text matching sebagai fallback.

Contoh pola yang dapat dipertimbangkan:

```text
BAB I
BAB II
BAB III
BAB IV
BAB V
BAB 1
BAB 2
BAB 3
BAB I PENDAHULUAN
BAB II LANDASAN TEORI
```

Selain itu dapat mengenali heading umum seperti:

```text
PENDAHULUAN
LATAR BELAKANG
METODOLOGI
METODE PENELITIAN
HASIL DAN PEMBAHASAN
KESIMPULAN
```

Namun jangan memasukkan setiap kata tersebut secara otomatis jika jelas merupakan isi paragraf biasa.

---

# 18. FALSE POSITIVE

Perhatikan false positive.

Contoh isi:

```text
Pada BAB I telah dijelaskan...
```

tidak boleh dianggap sebagai chapter baru.

Prioritaskan heading berdasarkan:

```text
heading structure
font/style information jika tersedia
posisi
text pattern
```

Jika Adobe memberikan informasi style/heading, manfaatkan informasi tersebut.

---

# 19. NOMOR HALAMAN

Ambil halaman dari metadata Adobe.

Pastikan memahami perbedaan:

```text
PDF page index
```

dengan:

```text
human-readable page number
```

Database:

```text
document_chapters.nomor_halaman
```

harus menyimpan **nomor halaman PDF yang digunakan oleh viewer**.

Jika library viewer menggunakan index mulai dari `0`, lakukan konversi:

```text
database page = 1
viewer index = 0
```

Jangan sampai user klik:

```text
BAB II
```

tetapi viewer malah berpindah satu halaman dari seharusnya.

---

# 20. NORMALIZATION JUDUL BAB

Normalisasi judul sebelum disimpan.

Contoh hasil:

```text
BAB I PENDAHULUAN
```

bukan:

```text
BAB I


PENDAHULUAN
```

Hilangkan:

```text
extra whitespace
line break berlebihan
```

tetapi jangan mengubah makna judul.

---

# 21. SORTING

Chapter harus disimpan/ditampilkan berdasarkan:

```text
nomor_halaman ASC
```

Contoh:

```text
BAB I        → halaman 5
BAB II       → halaman 18
BAB III      → halaman 35
BAB IV       → halaman 60
BAB V        → halaman 85
```

---

# 22. FRONTEND PDF VIEWER

Gunakan:

```text
vue-pdf-embed
```

dan:

```text
TailwindCSS
```

Gunakan:

```vue
<script setup lang="ts">
```

dengan Composition API.

---

# 23. KOMPONEN VIEWER

Jangan membuat seluruh logic di halaman:

```text
pages/buku/read.vue
```

Jika PDF viewer sudah berada di:

```text
DocumentReadPage.vue
```

gunakan component reusable.

Contoh:

```text
components/document/
├── DocumentReadPage.vue
└── PdfDocumentViewer.vue
```

Kemudian:

```text
PdfDocumentViewer.vue
```

bertanggung jawab terhadap:

- PDF rendering
- page navigation
- current page
- zoom
- chapter jump

Sedangkan:

```text
DocumentReadPage.vue
```

tetap menangani konteks document.

---

# 24. SIDEBAR BAB

Tampilan:

```text
┌─────────────────────┬─────────────────────────────┐
│ DAFTAR BAB          │                             │
│                     │                             │
│ BAB I Pendahuluan   │                             │
│                     │       PDF VIEWER            │
│ BAB II Landasan     │                             │
│ Teori               │                             │
│                     │                             │
│ BAB III Metodologi  │                             │
│                     │                             │
│ BAB IV Hasil        │                             │
│                     │                             │
│ BAB V Kesimpulan    │                             │
│                     │                             │
└─────────────────────┴─────────────────────────────┘
```

Gunakan layout responsive:

```text
grid
flex
```

sesuai kebutuhan.

Sidebar harus memiliki:

```text
overflow-y-auto
```

jika daftar chapter panjang.

---

# 25. FETCH CHAPTER

Frontend harus mengambil:

```text
document_chapters
```

berdasarkan:

```text
document_id
```

Contoh:

```ts
const { data } = await supabase
  .from('document_chapters')
  .select('*')
  .eq('document_id', documentId)
  .order('nomor_halaman', { ascending: true })
```

Sesuaikan dengan Supabase client yang sudah digunakan project.

Jangan melakukan query jika `documentId` belum tersedia.

---

# 26. PUBLIC PDF URL

PDF viewer harus menggunakan file PDF dari:

```text
Supabase Storage
```

Jika bucket public:

```text
public URL
```

Jika bucket private:

gunakan:

```text
signed URL
```

Jangan mengubah bucket menjadi public hanya agar viewer bekerja.

Pertahankan security model existing project.

---

# 27. CHAPTER CLICK

Ketika user menekan chapter:

```ts
function goToChapter(chapter) {
    goToPage(chapter.nomor_halaman)
}
```

PDF viewer harus berpindah ke halaman tersebut.

Jika `vue-pdf-embed` tidak menyediakan API langsung untuk melakukan:

```text
scroll to page
```

buat wrapper/logic yang benar menggunakan element/page rendering yang tersedia.

Jangan hanya mengubah:

```ts
currentPage
```

tanpa benar-benar menggeser viewer.

---

# 28. CURRENT CHAPTER

Jika memungkinkan, buat chapter aktif berdasarkan halaman yang sedang dibaca.

Contoh:

```text
User berada di halaman 25

BAB I       halaman 5
BAB II      halaman 18  ← ACTIVE
BAB III     halaman 40
```

Sidebar menandai:

```text
BAB II
```

sebagai chapter aktif.

Gunakan logic:

```text
currentPage >= chapterPage
dan
currentPage < nextChapterPage
```

Jika fitur ini terlalu kompleks untuk implementasi awal, prioritaskan chapter click terlebih dahulu.

---

# 29. AUTO EXTRACTION

Ketika PDF dibuka, jangan selalu memanggil Adobe Extract API.

Gunakan database sebagai cache.

Flow:

```text
Load document
      ↓
Fetch document_chapters
      ↓
Apakah ada chapter?
      ↓
YES → tampilkan
      ↓
NO
      ↓
Cek extraction_status
      ↓
pending/failed → jalankan extraction
processing → tampilkan processing
completed tapi data kosong → tampilkan empty state
```

Tujuannya agar Adobe API tidak dipanggil berulang-ulang setiap kali PDF dibuka.

---

# 30. EXTRACTION TRIGGER

Jika chapter belum tersedia, frontend dapat memanggil:

```text
POST /api/extract-pdf
```

dengan:

```json
{
  "document_id": "..."
}
```

Lebih baik server mengambil storage path dari database berdasarkan `document_id`.

Jika existing architecture mengharuskan `file_path`, validasi terlebih dahulu bahwa file path tersebut memang milik document tersebut.

---

# 31. UX SAAT EXTRACTION

Ketika extraction sedang berjalan:

```text
Menganalisis struktur PDF...
```

Tampilkan loading state.

Jika berhasil:

```text
Daftar BAB berhasil dibuat.
```

Jika gagal:

```text
Daftar BAB belum dapat dibuat.
```

Berikan opsi:

```text
Coba lagi
```

jika sesuai dengan UX aplikasi.

---

# 32. EMPTY STATE

Tidak semua PDF memiliki BAB.

Jika tidak ditemukan:

```text
Tidak ada struktur BAB yang ditemukan pada dokumen ini.
```

Jangan menganggap extraction gagal hanya karena:

```text
chapters.length === 0
```

Bisa saja PDF memang tidak memiliki heading yang dapat dideteksi.

---

# 33. REFACTORING WAJIB

Semua implementasi harus mengikuti prinsip:

```text
Single Responsibility
DRY
Reusable Components
Reusable Composables
Type Safety
```

Jangan membuat:

```text
pages/buku/read.vue
pages/jurnal/read.vue
pages/skripsi/read.vue
```

dengan logic PDF viewer yang diduplikasi.

Gunakan:

```text
PdfDocumentViewer.vue
```

yang reusable.

---

# 34. RECOMMENDED STRUCTURE

Gunakan struktur yang kira-kira seperti:

```text
app/
├── components/
│   └── document/
│       ├── DocumentReadPage.vue
│       │
│       └── pdf/
│           ├── PdfDocumentViewer.vue
│           ├── PdfChapterSidebar.vue
│           ├── PdfChapterItem.vue
│           ├── PdfToolbar.vue
│           └── PdfLoadingState.vue
│
├── composables/
│   └── document/
│       ├── useDocumentChapters.ts
│       └── usePdfNavigation.ts
│
├── types/
│   ├── document.ts
│   └── documentChapter.ts
│
└── pages/
    ├── buku/
    │   └── read.vue
    ├── jurnal/
    │   └── read.vue
    └── skripsi/
        └── read.vue

server/
└── api/
    ├── extract-pdf.post.ts
    └── extract-pdf/
        └── [jobId].get.ts
```

Jika project menggunakan struktur berbeda, ikuti convention existing project.

---

# 35. COMPOSABLE `useDocumentChapters`

Buat composable reusable yang bertanggung jawab terhadap:

```text
fetch chapters
trigger extraction
extraction status
refresh chapters
```

Contoh:

```ts
const {
    chapters,
    extractionStatus,
    isLoading,
    isExtracting,
    fetchChapters,
    extractChapters
} = useDocumentChapters(documentId)
```

Jangan memasukkan UI ke composable.

---

# 36. COMPOSABLE `usePdfNavigation`

Buat composable jika diperlukan untuk:

```text
currentPage
goToPage
nextPage
previousPage
zoom
currentChapter
```

Contoh:

```ts
const {
    currentPage,
    goToPage,
    nextPage,
    previousPage
} = usePdfNavigation()
```

---

# 37. TYPE

Buat type:

```ts
export interface DocumentChapter {
    id: string
    document_id: string
    judul_bab: string
    nomor_halaman: number
    created_at?: string
}
```

Gunakan type ini di frontend.

Jangan menggunakan:

```ts
any
```

tanpa alasan.

---

# 38. SECURITY

Pastikan:

### Adobe credentials

Hanya server.

### Supabase service role

Hanya server.

### PDF storage

Hormati permission existing.

### API

Validasi user/session.

### document_id

Jangan mempercayai input client tanpa validasi.

### file path

Jangan memungkinkan user memberikan path arbitrer yang menyebabkan server mengakses file yang bukan miliknya.

---

# 39. ERROR HANDLING BACKEND

Handle:

```text
Supabase download error
Adobe authentication error
Adobe extraction error
Adobe timeout
Invalid PDF
Corrupted PDF
JSON parsing error
Database insert error
Temporary file error
```

Jangan membocorkan:

```text
API secret
internal filesystem path
stack trace
```

kepada client production.

Log detail hanya di server jika diperlukan.

---

# 40. IDEMPOTENCY

Jika endpoint extraction dipanggil dua kali untuk document yang sama secara bersamaan:

```text
request A
request B
```

jangan sampai menghasilkan data chapter duplicate.

Gunakan status:

```text
processing
```

sebagai guard.

Jika:

```text
extraction_status === 'processing'
```

response dapat memberi tahu client bahwa extraction sedang berjalan.

---

# 41. RETRY

Jangan retry tanpa batas.

Gunakan batas yang jelas:

```text
maximum retries
maximum polling time
```

Jika Adobe API mengalami transient error, retry secara terbatas.

---

# 42. DATABASE CLEANUP

Ketika extraction berhasil:

```text
delete old chapters
insert new chapters
update status completed
```

Pastikan jika insert gagal, status tidak secara keliru menjadi:

```text
completed
```

---

# 43. DOWNLOAD HASIL EXTRACTION

Tidak perlu menyimpan JSON Adobe secara keseluruhan ke database kecuali memang diperlukan.

Database hanya membutuhkan data yang diperlukan untuk navigasi:

```text
document_id
judul_bab
nomor_halaman
```

Jika membutuhkan debugging, pertimbangkan menyimpan metadata ringkas, bukan seluruh hasil extraction yang besar.

---

# 44. PERFORMACE

Jangan:

```text
extract setiap PDF setiap kali halaman dibuka
```

Gunakan cache/database.

Jangan mengirim seluruh JSON Adobe ke frontend.

Frontend hanya membutuhkan:

```json
[
  {
    "id": "...",
    "judul_bab": "BAB I Pendahuluan",
    "nomor_halaman": 5
  }
]
```

---

# 45. BUILD DAN SSR

Karena:

```text
vue-pdf-embed
PDF.js
Adobe SDK
Canvas
File API
```

dapat memiliki ketergantungan browser/server yang berbeda, pastikan implementasi kompatibel dengan Nuxt 3.

Perhatikan:

```text
SSR
Client-only components
Dynamic import
```

Jika `vue-pdf-embed` harus dijalankan client-side, gunakan pendekatan Nuxt yang tepat.

Jangan membuat:

```text
window is not defined
document is not defined
```

ketika build/server rendering.

---

# 46. JANGAN MENGUBAH FITUR EXISTING

Fitur baru ini tidak boleh merusak:

```text
PDF reader
upload PDF
delete PDF
edit PDF
search
sorting
pagination
authentication
Supabase
routing
```

Jika `DocumentReadPage.vue` sudah memiliki fitur tertentu, pertahankan semuanya.

Tambahkan chapter navigation sebagai fitur baru.

---

# 47. JANGAN MENGUBAH DATABASE YANG SUDAH ADA SECARA SEMBARANGAN

Jika `documents` sudah ada:

```text
Jangan recreate.
Jangan drop.
Jangan rename column.
Jangan menghapus data.
```

Buat migration yang aman.

Jika field yang dibutuhkan sudah tersedia dengan nama berbeda, gunakan field tersebut daripada membuat duplicate field.

---

# 48. OUTPUT YANG SAYA INGINKAN

Saya ingin implementasi lengkap, bukan sekadar contoh.

Berikan output dengan urutan:

## 1. Analisis architecture existing

Jelaskan file mana yang digunakan dan kenapa.

## 2. Database migration

Berikan SQL lengkap.

## 3. Environment variables

Berikan variable yang diperlukan.

## 4. Dependencies

Jika perlu package baru, berikan command:

```bash
npm install ...
```

## 5. Struktur folder

Tampilkan struktur final.

## 6. Backend

Berikan kode lengkap:

```text
server/api/extract-pdf.post.ts
```

dan endpoint status jika diperlukan:

```text
server/api/extract-pdf/[jobId].get.ts
```

## 7. Adobe integration

Pisahkan logic Adobe jika cukup kompleks.

Contoh:

```text
server/utils/adobe/
├── extractPdf.ts
├── parseChapters.ts
└── adobeClient.ts
```

## 8. Supabase logic

Jika perlu, pisahkan:

```text
server/utils/supabase/
```

atau gunakan utility existing project.

## 9. Types

Berikan:

```text
types/documentChapter.ts
```

## 10. Composables

Berikan:

```text
composables/document/useDocumentChapters.ts
composables/document/usePdfNavigation.ts
```

## 11. Components

Berikan kode lengkap:

```text
PdfDocumentViewer.vue
PdfChapterSidebar.vue
PdfChapterItem.vue
```

atau component lain yang memang diperlukan.

## 12. Update `DocumentReadPage.vue`

Tunjukkan perubahan yang diperlukan agar tombol/fitur navigasi BAB terhubung.

## 13. Halaman kategori

Pastikan dapat digunakan:

```text
Buku
Jurnal
Skripsi
```

tanpa copy-paste PDF viewer.

---

# 49. JANGAN MEMBERIKAN PLACEHOLDER

Jangan memberikan:

```ts
// implement this
```

atau:

```ts
// rest of code
```

atau:

```ts
// sesuaikan dengan project
```

pada bagian inti implementasi.

Berikan kode lengkap untuk file yang dibuat/diubah.

Jika terdapat bagian yang memang tidak dapat diketahui karena struktur project belum tersedia, **tandai secara eksplisit apa yang perlu disesuaikan**, jangan mengarang.

---

# 50. TESTING CHECKLIST

Setelah implementasi, lakukan pengecekan:

### Database

```text
documents memiliki extraction status
document_chapters berhasil dibuat
foreign key benar
index benar
RLS aman
```

### Adobe

```text
PDF berhasil dikirim
job asynchronous ditangani
hasil extraction berhasil diambil
heading berhasil diparse
page number berhasil didapatkan
```

### Backend

```text
validasi request
validasi document
download storage
temporary file
cleanup
error handling
```

### Frontend

```text
PDF tampil
chapter tampil
chapter dapat diklik
viewer berpindah halaman
loading tampil
error tampil
empty state tampil
```

### Cache

```text
PDF kedua kali dibuka
→ tidak perlu extraction ulang
```

### Security

```text
Adobe credentials tidak bocor
Supabase service key tidak bocor
storage path tidak dapat dimanipulasi sembarangan
```

---

# 51. HASIL AKHIR YANG DIHARAPKAN

Architecture akhir harus kurang lebih:

```text
                    SUPABASE STORAGE
                          │
                          │ PDF
                          ▼
                 ┌─────────────────┐
                 │ Nuxt Backend     │
                 │ /api/extract-pdf │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Adobe PDF       │
                 │ Extract API     │
                 └────────┬────────┘
                          │
                          ▼
                 Extracted Structure
                          │
                          ▼
                 ┌─────────────────┐
                 │ Chapter Parser  │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Supabase        │
                 │ document_       │
                 │ chapters        │
                 └────────┬────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │ PdfDocumentViewer    │
              │                      │
              │ ┌────────┐ ┌───────┐ │
              │ │ CHAPTER│ │  PDF  │ │
              │ │ SIDEBAR│ │VIEWER │ │
              │ └────────┘ └───────┘ │
              └──────────────────────┘
                          │
                          ▼
                    User clicks BAB
                          │
                          ▼
                    goToPage()
```

---

# 52. PRINSIP UTAMA

Selalu ikuti prinsip:

```text
ONE PDF VIEWER
ONE CHAPTER SYSTEM
ONE EXTRACTION PIPELINE
MANY DOCUMENT CATEGORIES
```

Jangan membuat:

```text
BukuChapterViewer.vue
JurnalChapterViewer.vue
SkripsiChapterViewer.vue
```

jika tidak diperlukan.

Gunakan:

```text
PdfDocumentViewer.vue
```

yang menerima:

```text
document
chapters
pdfUrl
```

---

# 53. PRIORITAS

Jika ada konflik antara requirement, gunakan prioritas:

```text
1. Security
2. PDF hasil navigasi harus akurat
3. Behavior existing tidak rusak
4. Adobe extraction benar
5. Data chapter benar
6. Performance
7. Reusability
8. Maintainability
9. UI/UX
10. Optimasi tambahan
```

Jangan mengorbankan security atau correctness hanya demi kode yang lebih pendek.

---

# FINAL REQUIREMENT

Saya ingin hasil akhir berupa sistem navigasi BAB otomatis yang:

```text
PDF dari Supabase Storage
        ↓
Adobe PDF Extract API
        ↓
Deteksi heading/BAB
        ↓
Ambil nomor halaman
        ↓
Simpan ke document_chapters
        ↓
PDF Viewer
        ↓
Sidebar daftar BAB
        ↓
Klik BAB
        ↓
Viewer langsung menuju halaman BAB
```

Sistem harus dapat digunakan untuk:

```text
Buku
Jurnal
Skripsi
```

dan dapat dikembangkan untuk kategori lain di masa depan tanpa perlu menyalin seluruh logic.

**Selalu lakukan refactoring jika menemukan duplikasi atau logic yang terlalu besar.**

Namun, jangan melakukan refactoring yang tidak berhubungan dengan fitur ini atau mengubah behavior aplikasi tanpa alasan.

Tujuan akhir bukan hanya membuat fitur berjalan, tetapi membuat architecture yang:

```text
modular
reusable
type-safe
secure
mudah di-maintain
mudah dikembangkan
```

dan tetap konsisten dengan architecture project Nuxt yang sudah ada.