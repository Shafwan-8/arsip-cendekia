# IMPLEMENTASI PDF EDITOR DAN REFACTORING ARSITEKTUR

Saya ingin menambahkan fitur **PDF Editor** ke dalam aplikasi arsip dokumen berbasis **Nuxt/Vue + TypeScript** yang sudah memiliki kategori:

- Buku
- Jurnal
- Skripsi

Fitur ini harus terintegrasi dengan struktur aplikasi yang sudah ada dan **tidak boleh merusak behavior, UI, routing, maupun fitur yang sudah berjalan**.

File utama yang berkaitan dengan fitur ini adalah:

```text
app/components/document/DocumentReadPage.vue
app/pages/buku/edit.vue
```

Namun, sebelum melakukan perubahan apa pun, **periksa terlebih dahulu seluruh kode yang berkaitan dengan kedua file tersebut dan struktur project yang relevan**.

Jangan langsung membuat implementasi berdasarkan asumsi.

---

# 1. TUJUAN UTAMA

Ketika user sedang membaca sebuah PDF pada:

```text
DocumentReadPage.vue
```

dan menekan tombol:

```text
Edit PDF
```

maka user harus diarahkan ke halaman editor PDF yang sesuai dengan **kategori dokumen yang sedang dibuka**.

Contoh:

```text
Buku
→ /buku/edit

Jurnal
→ /jurnal/edit

Skripsi
→ /skripsi/edit
```

Jangan membuat satu halaman editor yang hanya bekerja untuk Buku.

Logic editor harus dirancang agar dapat digunakan kembali untuk semua kategori.

---

# 2. ALUR YANG DIINGINKAN

Implementasikan alur berikut:

```text
Document List
      ↓
DocumentReadPage.vue
      ↓
User menekan "Edit PDF"
      ↓
Identifikasi kategori dokumen
      ↓
Redirect ke halaman edit kategori
      ↓
PDF Editor dibuka
      ↓
PDF asli dimuat
      ↓
User melakukan perubahan
      ↓
User menekan "Simpan"
      ↓
PDF hasil edit diproses
      ↓
PDF hasil edit langsung di-download
      ↓
File tersimpan di device user
```

Contoh:

```text
/buku/read?id=123
        ↓
Klik Edit PDF
        ↓
/buku/edit?id=123
        ↓
PDF Editor
        ↓
Edit
        ↓
Simpan
        ↓
Download buku-edited.pdf
```

Untuk jurnal:

```text
/jurnal/read?id=123
        ↓
/jurnal/edit?id=123
```

Untuk skripsi:

```text
/skripsi/read?id=123
        ↓
/skripsi/edit?id=123
```

---

# 3. JANGAN HARD-CODE KATEGORI

Jangan membuat logic seperti:

```ts
if (category === 'buku') {
  navigateTo('/buku/edit')
}
```

lalu membuat kondisi lain secara manual untuk jurnal dan skripsi jika hal tersebut dapat dihindari.

Gunakan configuration atau helper reusable.

Contoh konsep:

```ts
const documentCategoryConfig = {
  buku: {
    basePath: '/buku'
  },

  jurnal: {
    basePath: '/jurnal'
  },

  skripsi: {
    basePath: '/skripsi'
  }
}
```

Kemudian route dapat dibentuk secara dinamis:

```ts
`${config.basePath}/edit`
```

Sesuaikan implementasinya dengan architecture project yang sudah ada.

---

# 4. DATA PDF HARUS DITERUSKAN DENGAN AMAN

Saat user berpindah dari `DocumentReadPage.vue` ke halaman edit, editor harus mengetahui PDF mana yang sedang diedit.

Gunakan mekanisme yang sudah digunakan oleh aplikasi jika tersedia, misalnya:

```text
query parameter
route parameter
document ID
file URL
```

Prioritaskan menggunakan:

```text
document ID
```

untuk mengambil data dokumen dari sumber yang sudah digunakan aplikasi.

Jangan memasukkan data PDF yang panjang ke URL jika sebenarnya document ID sudah cukup.

Contoh:

```text
/buku/edit?id=123
```

Kemudian halaman editor dapat mengambil informasi:

```text
title
author
file_url
file_name
category
```

dari data dokumen yang sesuai.

Jika project saat ini sudah menggunakan pola lain, pertahankan pola tersebut selama tidak menimbulkan masalah.

---

# 5. PDF EDITOR

Pada halaman edit, tampilkan editor PDF yang memungkinkan user melakukan perubahan terhadap PDF.

Fitur minimal yang diharapkan:

### Text

User dapat:

- menambahkan teks
- menghapus teks jika library yang digunakan mendukung penghapusan/editing teks PDF
- mengubah teks jika memungkinkan
- mengatur ukuran teks
- mengatur posisi teks

### Highlight

User dapat:

- membuat highlight
- mengubah posisi highlight
- menghapus highlight

### Image

User dapat:

- memasukkan gambar ke PDF
- memindahkan gambar
- mengubah ukuran gambar
- menghapus gambar

### Signature

User dapat:

- menambahkan signature
- meletakkan signature pada posisi tertentu
- mengubah ukuran signature
- memindahkan signature
- menghapus signature

### Annotation lainnya

Jika library PDF editor yang digunakan mendukung:

- drawing
- underline
- strikethrough
- shapes
- notes
- rectangle
- circle

boleh ditambahkan selama tidak membuat implementasi terlalu kompleks.

Prioritaskan fitur yang benar-benar dibutuhkan.

---

# 6. PENTING: BEDAKAN PDF VIEWER DAN PDF EDITOR

Jangan hanya membuat PDF viewer kemudian menambahkan overlay HTML seolah-olah PDF sudah diedit.

Hasil akhir harus benar-benar menghasilkan:

```text
PDF baru
```

yang sudah mengandung perubahan user.

Misalnya:

```text
Original PDF
    +
Text
    +
Highlight
    +
Image
    +
Signature
    ↓
Edited PDF
```

Kemudian file tersebut harus dapat dibuka kembali sebagai PDF normal.

Jika library yang digunakan memiliki konsep canvas/overlay, pastikan perubahan tersebut benar-benar dirender ke PDF ketika proses export dilakukan.

---

# 7. LIBRARY PDF

Sebelum memilih library, periksa terlebih dahulu dependencies yang sudah digunakan project.

Jangan menambahkan library baru jika project sebenarnya sudah memiliki library yang dapat digunakan.

Jika memang diperlukan library baru, pilih library yang:

- kompatibel dengan Nuxt/Vue
- kompatibel dengan TypeScript
- berjalan di browser
- dapat melakukan editing/export PDF
- tidak membutuhkan backend untuk fitur dasar
- memiliki API yang jelas
- tidak membuat architecture project menjadi rumit

Jika terdapat keterbatasan teknis, jelaskan dengan jelas.

Jangan berpura-pura bahwa sebuah library dapat melakukan editing native PDF jika sebenarnya hanya menyediakan viewer atau annotation overlay.

---

# 8. DOWNLOAD HASIL EDIT

Ketika user menekan:

```text
Simpan
```

maka:

1. Ambil PDF asli.
2. Terapkan seluruh perubahan.
3. Generate PDF baru.
4. Buat Blob/File hasil.
5. Trigger browser download.
6. Jangan otomatis mengubah file asli di Supabase.
7. Jangan mengganti file asli di database kecuali saya meminta hal tersebut.

Perilaku yang diinginkan:

```text
PDF asli
      ↓
diedit
      ↓
Simpan
      ↓
PDF baru
      ↓
Download ke device
```

Contoh nama file:

```text
nama-file-edited.pdf
```

Jika nama file asli sudah tersedia, gunakan nama tersebut dan tambahkan suffix:

```text
_document-edited.pdf
```

Hindari nama file yang menghasilkan:

```text
undefined-edited.pdf
null-edited.pdf
-edited.pdf
```

---

# 9. JANGAN MENGUBAH FILE ASLI

Secara default, tombol Simpan hanya melakukan:

```text
Generate → Download
```

Bukan:

```text
Generate → Upload → Replace original
```

File asli yang ada di storage harus tetap aman.

---

# 10. STATE EDITOR

Editor harus memiliki state yang jelas.

Minimal:

```ts
isLoading
isSaving
error
pdfDocument
currentPage
totalPages
selectedTool
zoom
```

Jika diperlukan:

```ts
selectedElement
history
canUndo
canRedo
```

Jangan membuat reactive state yang tidak digunakan.

---

# 11. TOOLBAR

Buat toolbar editor yang jelas.

Contoh:

```text
[Undo] [Redo]

[Select]
[Text]
[Highlight]
[Image]
[Signature]
[Draw]

Zoom:
[-] 100% [+]

                    [Batal] [Simpan]
```

Tidak harus persis seperti contoh tersebut.

Sesuaikan dengan design system/UI aplikasi yang sudah ada.

**Jangan melakukan redesign besar terhadap aplikasi.**

---

# 12. PAGE NAVIGATION

Jika PDF memiliki banyak halaman, editor harus mendukung navigasi halaman.

Minimal:

```text
← Previous
Page 1 / 10
Next →
```

Jika memungkinkan:

```text
Thumbnail halaman
```

boleh digunakan.

User harus dapat melakukan editing pada halaman PDF yang dipilih.

---

# 13. ZOOM

PDF editor harus memiliki zoom.

Minimal:

```text
Zoom Out
Zoom Level
Zoom In
```

Opsional:

```text
Fit Width
Fit Page
```

Pastikan zoom hanya mempengaruhi tampilan editor dan tidak menyebabkan koordinat elemen menjadi salah ketika PDF diekspor.

---

# 14. UNDO DAN REDO

Jika library atau architecture yang digunakan memungkinkan, tambahkan:

```text
Undo
Redo
```

untuk perubahan seperti:

```text
add text
move text
add highlight
move image
add signature
delete element
```

Jika implementasi undo/redo terlalu kompleks untuk library yang dipilih, jangan memaksakan implementasi yang tidak stabil.

---

# 15. SIGNATURE

Untuk signature, jangan menyimpan signature hanya sebagai teks.

Signature harus dapat berupa:

```text
gambar
drawing
signature pad
```

User dapat menggambar signature jika fitur tersebut tersedia.

Setelah selesai:

```text
signature
    ↓
image/annotation
    ↓
diletakkan di PDF
    ↓
export
```

---

# 16. IMAGE

Saat user menambahkan gambar:

```text
Upload Image
```

maka:

1. User memilih gambar dari device.
2. Gambar dimuat.
3. Gambar muncul di halaman PDF.
4. User dapat memindahkan.
5. User dapat resize.
6. User dapat menghapus.
7. Gambar ikut masuk ke PDF hasil export.

Gunakan file input biasa untuk pemilihan file.

---

# 17. HIGHLIGHT

Highlight harus mengikuti koordinat halaman PDF.

Jangan membuat highlight berdasarkan posisi absolut terhadap seluruh browser.

Koordinat harus relatif terhadap:

```text
PDF page
```

sehingga hasil export tetap berada di lokasi yang benar.

---

# 18. TEXT

Untuk penambahan teks, user harus dapat:

```text
Klik Text
↓
Klik area PDF
↓
Masukkan teks
↓
Teks muncul
↓
Teks dapat dipindahkan
```

Minimal dapat mengatur:

```text
font size
position
```

Jika mudah diterapkan:

```text
bold
italic
alignment
```

boleh ditambahkan.

---

# 19. DELETE ELEMENT

Setiap elemen yang ditambahkan user harus dapat dihapus.

Contoh:

```text
Text
Image
Highlight
Signature
Drawing
Shape
```

Gunakan mekanisme selection yang jelas.

Misalnya:

```text
Klik element
→ element selected
→ tekan Delete
```

atau tombol:

```text
Delete
```

pada toolbar.

---

# 20. RESPONSIVE

Editor harus tetap usable pada:

```text
Desktop
Tablet
```

Prioritaskan desktop karena aplikasi merupakan aplikasi pengelolaan arsip.

Jangan merusak responsive behavior halaman yang sudah ada.

---

# 21. REFACTORING WAJIB

Selain implementasi fitur, lakukan refactoring.

**Jangan memasukkan seluruh PDF editor ke dalam `edit.vue`.**

Pisahkan berdasarkan tanggung jawab.

Contoh architecture:

```text
app/
├── components/
│   └── document/
│       ├── DocumentReadPage.vue
│       │
│       └── editor/
│           ├── PdfEditor.vue
│           ├── PdfEditorToolbar.vue
│           ├── PdfEditorCanvas.vue
│           ├── PdfPage.vue
│           ├── PdfPageNavigation.vue
│           ├── PdfEditorElement.vue
│           ├── PdfTextTool.vue
│           ├── PdfHighlightTool.vue
│           ├── PdfImageTool.vue
│           ├── PdfSignatureTool.vue
│           └── PdfEditorActions.vue
│
├── composables/
│   └── pdf-editor/
│       ├── usePdfEditor.ts
│       ├── usePdfDocument.ts
│       ├── usePdfHistory.ts
│       ├── usePdfSelection.ts
│       ├── usePdfExport.ts
│       └── usePdfTools.ts
│
├── types/
│   └── pdf-editor.ts
│
├── utils/
│   └── pdf-editor/
│       ├── coordinates.ts
│       ├── file.ts
│       └── download.ts
│
└── pages/
    ├── buku/
    │   └── edit.vue
    ├── jurnal/
    │   └── edit.vue
    └── skripsi/
        └── edit.vue
```

Struktur tersebut hanyalah contoh.

**Sesuaikan dengan struktur project yang sebenarnya.**

Jangan membuat terlalu banyak file jika sebuah file memang sudah cukup bertanggung jawab terhadap satu bagian.

Prinsip utamanya:

```text
UI
↓
Component

State / business logic
↓
Composable

Pure function
↓
Utils

Data structure
↓
Types

Category-specific configuration
↓
Config
```

---

# 22. EDIT.VUE HARUS SEDERHANA

Jangan membuat:

```text
app/pages/buku/edit.vue
```

menjadi file 1000+ baris.

Idealnya:

```vue
<script setup lang="ts">

const config = documentCategoryConfig.buku

const {
  document,
  isLoading
} = useDocumentEditor({
  category: config.category
})

</script>

<template>
  <PdfEditor
    v-if="document"
    :document="document"
    :category="config.category"
  />
</template>
```

Jika architecture project membutuhkan pendekatan lain, gunakan pendekatan yang lebih baik.

---

# 23. SATU PDF EDITOR UNTUK SEMUA KATEGORI

Jangan membuat:

```text
BukuPdfEditor.vue
JurnalPdfEditor.vue
SkripsiPdfEditor.vue
```

jika perbedaannya hanya kategori.

Gunakan:

```text
PdfEditor.vue
```

yang menerima konfigurasi atau data document.

Contoh:

```ts
<PdfEditor
  :document="document"
  :config="config"
/>
```

Dengan demikian:

```text
Buku
Jurnal
Skripsi
```

menggunakan editor yang sama.

---

# 24. DATA CATEGORY

Editor harus mengetahui kategori dari dokumen yang sedang diedit.

Gunakan data yang sudah tersedia di aplikasi.

Jangan mempercayai kategori dari client secara buta jika document ID sudah dapat digunakan untuk mengambil data yang sebenarnya.

Pastikan user tidak dapat dengan mudah membuka:

```text
/buku/edit?id=id_jurnal
```

kemudian sistem memperlakukannya sebagai Buku tanpa melakukan validasi.

Jika kategori document tidak sesuai dengan route:

```text
/buku/edit
```

untuk dokumen jurnal, tangani dengan aman.

Contohnya:

```text
redirect ke /jurnal/edit?id=...
```

atau tampilkan error yang sesuai.

Pilih pendekatan yang paling konsisten dengan architecture aplikasi.

---

# 25. ERROR HANDLING

Tangani minimal:

```text
PDF gagal dimuat
PDF tidak ditemukan
Document ID tidak valid
File bukan PDF
PDF rusak
Gagal export
Gagal download
User membatalkan upload image
Signature gagal dibuat
```

Jangan membiarkan error hanya muncul di console.

Gunakan sistem toast/error UI yang sudah digunakan aplikasi jika tersedia.

---

# 26. LOADING STATE

Tampilkan loading ketika:

```text
Mengambil data document
Memuat PDF
Melakukan export PDF
```

Contoh:

```text
Memuat PDF...
```

dan ketika menyimpan:

```text
Menyimpan PDF...
```

Jangan sampai user dapat menekan tombol Simpan berkali-kali ketika proses export masih berlangsung.

Gunakan:

```ts
isSaving
```

untuk mencegah duplicate operation.

---

# 27. BATAL

Sediakan tombol:

```text
Batal
```

Jika user belum melakukan perubahan:

```text
Batal → kembali ke halaman Read
```

Jika user sudah melakukan perubahan, jangan langsung membuang pekerjaan tanpa peringatan.

Jika browser/app architecture mendukung, tampilkan konfirmasi:

```text
Perubahan belum disimpan. Yakin ingin keluar?
```

---

# 28. JANGAN MERUSAK DOCUMENT READ PAGE

`DocumentReadPage.vue` tetap harus berfungsi seperti sebelumnya.

Yang diubah hanya bagian yang diperlukan untuk tombol:

```text
Edit PDF
```

Tambahkan navigasi secara reusable.

Jangan memasukkan logic PDF editor ke dalam:

```text
DocumentReadPage.vue
```

`DocumentReadPage.vue` hanya bertugas mengarahkan user ke editor.

---

# 29. ROUTING HARUS REUSABLE

Pastikan semua kategori memiliki pola yang konsisten:

```text
/buku/read
/buku/edit

/jurnal/read
/jurnal/edit

/skripsi/read
/skripsi/edit
```

Jika nantinya kategori baru ditambahkan:

```text
prosiding
laporan
majalah
```

developer seharusnya cukup menambahkan configuration dan halaman route yang diperlukan, bukan menyalin seluruh PDF editor.

---

# 30. JANGAN DUPLIKASI PDF EDITOR

Kode seperti ini:

```text
buku/edit.vue
jurnal/edit.vue
skripsi/edit.vue
```

tidak boleh berisi tiga implementasi PDF editor yang berbeda.

Ketiganya harus menggunakan:

```text
PdfEditor.vue
```

dan composable yang sama.

---

# 31. PERFORMANCE

Perhatikan performance karena PDF dapat memiliki ukuran besar.

Hindari:

```text
render ulang seluruh PDF
```

setiap kali user:

```text
memindahkan text
memindahkan image
mengubah highlight
```

Jika library memungkinkan, gunakan rendering yang efisien.

Jangan melakukan deep watch terhadap object PDF besar tanpa alasan.

---

# 32. CLIENT-SIDE PDF LIBRARY

Karena PDF editor kemungkinan menggunakan API browser seperti:

```text
File
Blob
Canvas
URL.createObjectURL
window
document
```

pastikan kode yang bergantung pada browser hanya dijalankan di client.

Untuk Nuxt, perhatikan:

```text
SSR
Client-only rendering
Dynamic import
```

Jika library PDF tidak kompatibel dengan SSR, tangani dengan benar.

Jangan sampai aplikasi error saat:

```text
npm run build
```

atau ketika halaman dirender melalui SSR.

---

# 33. TYPE TYPESCRIPT

Buat type yang jelas untuk elemen editor.

Contoh konsep:

```ts
type PdfElementType =
  | 'text'
  | 'highlight'
  | 'image'
  | 'signature'
  | 'drawing'
```

dan:

```ts
interface PdfEditorElement {
  id: string
  type: PdfElementType
  page: number
  x: number
  y: number
  width?: number
  height?: number
}
```

Sesuaikan dengan implementasi sebenarnya.

Jangan menggunakan:

```ts
any
```

secara berlebihan.

---

# 34. EXPORT PDF

Pastikan koordinat antara:

```text
PDF viewer
```

dan:

```text
PDF output
```

dapat dikonversikan dengan benar.

Perhatikan:

```text
zoom
device pixel ratio
PDF page size
canvas size
viewport scale
```

Jangan mengandalkan koordinat pixel browser secara langsung untuk menghasilkan koordinat PDF.

Buat utility khusus jika diperlukan:

```text
coordinates.ts
```

Contohnya:

```ts
screenToPdfCoordinates()
pdfToScreenCoordinates()
```

---

# 35. FILE SEPARATE

Jika memungkinkan, buat file terpisah sesuai tanggung jawab.

Jangan menghasilkan satu file besar.

Namun jangan pula memecah file secara berlebihan.

Gunakan prinsip:

> Satu file memiliki satu tanggung jawab utama.

---

# 36. URUTAN KERJA YANG WAJIB

Kerjakan dalam urutan:

### STEP 1
Analisis struktur project.

### STEP 2
Periksa:

```text
DocumentReadPage.vue
buku/edit.vue
```

serta component/composable/utility yang berhubungan.

### STEP 3
Identifikasi:

- routing
- cara mengambil document
- cara mengambil file PDF
- kategori
- Supabase
- storage
- UI style
- component reusable yang sudah tersedia

### STEP 4
Refactor terlebih dahulu bagian yang diperlukan.

### STEP 5
Implementasikan PDF editor sebagai component/composable reusable.

### STEP 6
Hubungkan:

```text
DocumentReadPage
→ category edit route
→ PdfEditor
```

### STEP 7
Buat route untuk:

```text
Buku
Jurnal
Skripsi
```

### STEP 8
Implementasikan export dan download.

### STEP 9
Test seluruh alur.

---

# 37. JANGAN MENGUBAH BEHAVIOR LAMA

Ini adalah requirement paling penting.

Refactoring dan fitur baru tidak boleh merusak:

- authentication
- authorization
- Supabase
- document fetching
- document reading
- search
- filtering
- sorting
- pagination
- upload document
- delete document
- existing routes
- existing UI
- responsive layout
- toast
- modal
- storage

Jika terdapat kode lama yang terlihat kurang ideal tetapi dibutuhkan untuk behavior lama, jangan menghapusnya tanpa alasan.

---

# 38. JANGAN MENGUBAH DATABASE

Jangan melakukan:

```text
migration
rename table
rename column
delete column
ubah schema
```

kecuali saya secara eksplisit memintanya.

Gunakan struktur database yang sudah ada.

---

# 39. OUTPUT YANG SAYA INGINKAN

Saya tidak hanya ingin penjelasan.

Setelah menganalisis project, berikan implementasi lengkap.

Tampilkan:

## A. ANALISIS

Jelaskan secara ringkas:

```text
Masalah architecture saat ini
Kode yang duplikat
Kode yang perlu dipindahkan
Bagian yang dapat dibuat reusable
```

## B. STRUKTUR FOLDER FINAL

Tampilkan struktur final.

## C. FILE YANG DIUBAH

Contoh:

```text
app/components/document/DocumentReadPage.vue
app/pages/buku/edit.vue
app/pages/jurnal/edit.vue
app/pages/skripsi/edit.vue
```

## D. FILE BARU

Contoh:

```text
app/components/document/editor/PdfEditor.vue
app/composables/pdf-editor/usePdfEditor.ts
app/composables/pdf-editor/usePdfExport.ts
app/types/pdf-editor.ts
```

## E. KODE LENGKAP

Berikan **kode lengkap setiap file**.

Jangan menggunakan placeholder seperti:

```ts
// rest of code...
```

atau:

```ts
// implement this yourself
```

atau:

```ts
// kode lainnya
```

Saya ingin kode yang dapat langsung ditempatkan ke project.

---

# 40. JIKA ADA DEPENDENCY BARU

Jika membutuhkan package baru:

Tampilkan:

```bash
npm install nama-package
```

dan jelaskan secara singkat:

```text
Mengapa package ini diperlukan.
```

Jangan menambahkan dependency yang sebenarnya tidak diperlukan.

---

# 41. VALIDASI AKHIR

Setelah implementasi selesai, lakukan review terhadap seluruh kode.

Pastikan:

### Routing

```text
/buku/edit
/jurnal/edit
/skripsi/edit
```

berfungsi.

### Read Page

```text
DocumentReadPage
→ Edit PDF
```

berfungsi.

### PDF

```text
PDF berhasil dimuat
```

### Editing

```text
Text
Highlight
Image
Signature
```

berfungsi.

### Export

```text
Simpan
→ Generate PDF
→ Download
```

berfungsi.

### Original file

```text
Tidak berubah
```

### Architecture

```text
Tidak ada PDF editor duplicate
```

### Code quality

```text
Tidak ada unused import
Tidak ada unused variable
Tidak ada dead code
Tidak ada unnecessary any
Tidak ada duplikasi logic
```

### Nuxt

Pastikan tidak menimbulkan masalah:

```text
SSR
Build
Client-side PDF library
```

---

# 42. PRINSIP AKHIR

Prioritas implementasi:

```text
1. Fitur berjalan
2. PDF hasil export benar
3. Tidak merusak behavior lama
4. Tidak mengubah database
5. Routing kategori benar
6. PDF editor reusable
7. Tidak ada duplikasi
8. Maintenance mudah
9. TypeScript aman
10. UI tetap konsisten
```

Jika harus memilih antara architecture yang sangat kompleks dengan architecture sederhana tetapi mudah dirawat, pilih yang **sederhana, modular, dan mudah dipahami**.

Jangan melakukan over-engineering.

Tujuan akhir:

```text
                ┌── Buku ────┐
                │            │
Read Page ──────┼── Jurnal ───┼──→ PDF Editor Reusable
                │            │          │
                └── Skripsi ─┘          ↓
                                   Edit PDF
                                        ↓
                                      Save
                                        ↓
                                  Download PDF
```

**Satu PDF Editor, satu logic utama, banyak kategori.**

Kategori hanya menentukan:

```text
route
category
configuration
document
```

Sedangkan seluruh logic PDF editing harus reusable.