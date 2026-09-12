## PROMPT REFACTORING KODE

Saya memiliki halaman Vue/Nuxt dengan file utama `index.vue` untuk menampilkan dan mengelola dokumen kategori **Buku** menggunakan Supabase.

Saya ingin kamu melakukan **refactoring menyeluruh terhadap kode yang saya berikan**, dengan fokus utama:

1. Mengurangi duplikasi kode.
2. Memperjelas struktur dan tanggung jawab setiap bagian kode.
3. Mempermudah maintenance dan pengembangan.
4. Memisahkan logic yang reusable dari logic yang khusus untuk kategori tertentu.
5. Memungkinkan logic yang sama digunakan kembali pada halaman:
   - `/buku`
   - `/jurnal`
   - `/skripsi`
6. **Jangan mengubah perilaku akhir aplikasi.**
7. Tampilan/UI yang sekarang harus tetap sama atau semirip mungkin.
8. Jangan mengubah struktur database Supabase kecuali benar-benar diperlukan.
9. Jangan mengubah nama field database yang sudah digunakan.
10. Jangan menghilangkan fitur yang sudah ada.

### KONDISI KODE SAAT INI

File utama saat ini memiliki beberapa tanggung jawab sekaligus:

- Interface/type data dokumen.
- Inisialisasi Supabase.
- Mendapatkan user aktif.
- Fetch data dokumen.
- Filter pencarian.
- Sorting.
- Pagination.
- Upload PDF.
- Drag & drop file.
- Validasi form.
- Upload ke Supabase Storage.
- Insert data ke tabel `documents`.
- Delete file dari Supabase Storage.
- Delete record dari database.
- Toast notification.
- Modal upload.
- Modal delete.
- Navigasi Read.
- Navigasi Edit.
- Seluruh template UI.

Contoh kategori saat ini masih hard-coded sebagai:

```ts
category: 'buku'
```

dan query juga masih menggunakan:

```ts
.eq('category', 'buku')
```

Selain itu beberapa pesan, route, nama variabel, judul, placeholder, dan label masih menggunakan kata "Buku".

## TUJUAN ARSITEKTUR

Saya ingin struktur akhirnya kurang lebih seperti ini:

```text
components/
├── document/
│   ├── DocumentHeader.vue
│   ├── DocumentToolbar.vue
│   ├── DocumentTable.vue
│   ├── DocumentRow.vue
│   ├── DocumentPagination.vue
│   ├── DocumentUploadModal.vue
│   ├── DocumentDeleteModal.vue
│   └── DocumentEmptyState.vue
│
composables/
├── useDocuments.ts
├── useDocumentUpload.ts
├── useDocumentDelete.ts
├── useDocumentFilter.ts
├── useDocumentPagination.ts
└── useToast.ts
│
types/
└── document.ts
│
utils/
└── document.ts
│
pages/
├── buku/
│   └── index.vue
├── jurnal/
│   └── index.vue
└── skripsi/
    └── index.vue
```

Struktur tersebut hanya contoh. Jika menurut kamu ada struktur yang lebih baik untuk Nuxt 3 + Vue 3 + TypeScript, gunakan struktur yang lebih tepat.

---

# 1. BUAT TYPE YANG REUSABLE

Pisahkan interface `BukuItem` menjadi type/interface umum seperti:

```ts
DocumentItem
```

karena data tersebut nantinya digunakan untuk Buku, Jurnal, dan Skripsi.

Contoh:

```ts
export interface DocumentItem {
  id: string | number
  title: string
  author: string
  publisher: string
  category: string
  year: number | string
  file_name: string
  file_size: string
  file_url: string
  pages: number
  uploaded_at: string
  status: string
  user_id?: string
}
```

Jika ada field yang sebenarnya tidak cocok untuk semua kategori, analisis terlebih dahulu sebelum mengubahnya.

Jangan mengubah struktur data secara sembarangan.

---

# 2. BUAT CONFIGURATION UNTUK SETIAP KATEGORI

Jangan membuat tiga halaman dengan kode yang hampir sama.

Buat konfigurasi kategori sehingga halaman dapat menentukan:

```ts
buku
jurnal
skripsi
```

melalui konfigurasi.

Contoh konsep:

```ts
export const documentCategoryConfig = {
  buku: {
    label: 'Buku',
    pluralLabel: 'Buku',
    category: 'buku',
    basePath: '/buku',
    storageFolder: 'buku',
    color: 'rose'
  },

  jurnal: {
    label: 'Jurnal',
    pluralLabel: 'Jurnal',
    category: 'jurnal',
    basePath: '/jurnal',
    storageFolder: 'jurnal',
    color: 'blue'
  },

  skripsi: {
    label: 'Skripsi',
    pluralLabel: 'Skripsi',
    category: 'skripsi',
    basePath: '/skripsi',
    storageFolder: 'skripsi',
    color: 'violet'
  }
}
```

Sesuaikan struktur tersebut dengan kebutuhan kode sebenarnya.

Tujuannya agar logic seperti:

```ts
.eq('category', 'buku')
```

menjadi dinamis berdasarkan kategori.

---

# 3. BUAT `useDocuments()`

Pisahkan seluruh logic yang berhubungan dengan mengambil data dari Supabase ke composable.

Contohnya:

```ts
const {
  documents,
  isLoading,
  error,
  fetchDocuments,
  deleteDocument
} = useDocuments({
  category: 'buku'
})
```

Composable ini bertanggung jawab terhadap:

- fetch data
- user filtering
- query Supabase
- delete database record
- refresh data
- error handling yang berhubungan dengan data

Jangan mencampurkan logic UI ke dalam composable.

---

# 4. BUAT `useDocumentUpload()`

Pisahkan logic upload file dari halaman.

Logic yang harus dipindahkan antara lain:

- selected file
- drag & drop
- validasi PDF
- format ukuran file
- generate nama/path file
- upload ke Supabase Storage
- mendapatkan public URL
- insert record ke tabel `documents`
- reset form
- status uploading

Contoh penggunaan yang diinginkan:

```ts
const {
  form,
  selectedFile,
  isUploading,
  uploadError,
  isDragging,
  processFile,
  handleDrop,
  submitUpload,
  reset
} = useDocumentUpload({
  category: 'buku'
})
```

Pastikan composable dapat digunakan untuk:

```ts
useDocumentUpload({ category: 'buku' })
useDocumentUpload({ category: 'jurnal' })
useDocumentUpload({ category: 'skripsi' })
```

tanpa melakukan copy-paste logic.

---

# 5. BUAT `useDocumentDelete()`

Pisahkan logic delete.

Logic ini harus menangani:

1. Mendapatkan storage path dari `file_url`.
2. Menghapus file dari bucket `arsip_pdf`.
3. Menghapus record dari tabel `documents`.
4. Membatasi delete berdasarkan `user_id` jika memang logic tersebut digunakan saat ini.
5. Error handling.

Fungsi seperti:

```ts
extractStoragePath()
```

juga sebaiknya dipindahkan ke utility jika memang reusable.

---

# 6. BUAT `useDocumentFilter()`

Pisahkan:

- search
- sorting
- filtering

Pastikan pencarian tetap bekerja pada field yang sekarang digunakan:

```text
title
author
publisher
file_name
```

Jangan mengubah perilaku pencarian.

Sorting yang sekarang tersedia:

```text
latest
oldest
title
size
```

harus tetap tersedia dan menghasilkan perilaku yang sama.

---

# 7. BUAT `useDocumentPagination()`

Pisahkan logic:

```ts
currentPage
itemsPerPage
totalPages
paginatedDocuments
startItemIndex
endItemIndex
goToPage()
```

Pagination harus tetap memiliki perilaku yang sama seperti kode sebelumnya.

Pastikan ketika filter/search berubah, halaman kembali ke halaman pertama.

---

# 8. BUAT COMPONENT REUSABLE

Pisahkan template besar menjadi component yang memiliki tanggung jawab jelas.

Minimal pertimbangkan:

```text
DocumentHeader.vue
DocumentToolbar.vue
DocumentTable.vue
DocumentPagination.vue
DocumentUploadModal.vue
DocumentDeleteModal.vue
DocumentEmptyState.vue
```

Jangan membuat component hanya untuk memecah kode secara paksa.

Component harus dibuat jika memang memiliki tanggung jawab yang jelas dan berpotensi digunakan kembali.

---

# 9. BUAT HALAMAN KATEGORI YANG TIPIS

Setelah refactoring, `pages/buku/index.vue` sebaiknya tidak lagi berisi ratusan baris logic.

Idealnya hanya menangani:

- menentukan kategori
- menentukan configuration
- memanggil composable
- menghubungkan component
- menentukan route

Contoh konsep:

```vue
<script setup lang="ts">

const config = documentCategoryConfig.buku

const {
  documents,
  isLoading,
  error,
  fetchDocuments
} = useDocuments({
  category: config.category
})

</script>

<template>
  <DocumentPage
    :config="config"
    :documents="documents"
    :loading="isLoading"
    :error="error"
  />
</template>
```

Kemudian halaman jurnal cukup menggunakan:

```ts
documentCategoryConfig.jurnal
```

dan skripsi:

```ts
documentCategoryConfig.skripsi
```

---

# 10. JANGAN MENGUBAH BEHAVIOR

Ini adalah bagian yang SANGAT PENTING.

Refactoring hanya boleh mengubah struktur internal kode.

Jangan mengubah:

- cara user login digunakan
- query Supabase yang sudah bekerja
- nama tabel `documents`
- nama bucket `arsip_pdf`
- field database
- behavior upload
- behavior delete
- behavior search
- behavior sorting
- behavior pagination
- behavior modal
- behavior toast
- route yang sudah digunakan
- tampilan UI
- class Tailwind
- responsive behavior

Jika menemukan kode yang terlihat kurang ideal tetapi masih diperlukan untuk mempertahankan behavior, **jangan menghapusnya hanya karena terlihat tidak bersih.**

---

# 11. PERHATIKAN ROUTING

Saat ini halaman Buku menggunakan route seperti:

```ts
/buku/read
/buku/edit
```

Saat dibuat reusable, jangan membuat route Buku menjadi rusak.

Gunakan configuration agar dapat menghasilkan:

```text
/buku/read
/buku/edit

/jurnal/read
/jurnal/edit

/skripsi/read
/skripsi/edit
```

Contoh:

```ts
navigateTo({
  path: `${config.basePath}/read`,
  query: {
    id: document.id,
    title: document.title,
    file: document.file_url,
    fileName: document.file_name
  }
})
```

---

# 12. STORAGE PATH HARUS DINAMIS

Saat upload Buku saat ini menggunakan:

```ts
buku/${Date.now()}_${cleanFileName}
```

Jangan membuatnya hard-coded.

Gunakan:

```ts
`${config.storageFolder}/${Date.now()}_${cleanFileName}`
```

sehingga:

```text
buku/...
jurnal/...
skripsi/...
```

dapat digunakan tanpa duplikasi logic.

---

# 13. PISAHKAN UTILITY

Function yang tidak membutuhkan state Vue sebaiknya dipindahkan ke utility.

Contohnya:

```ts
formatFileSize()
extractStoragePath()
sanitizeFileName()
createStoragePath()
```

Jangan memasukkan utility sederhana ke dalam composable jika tidak membutuhkan reactive state.

---

# 14. TOAST

Logic toast:

```ts
triggerToast()
```

juga sebaiknya dibuat reusable melalui:

```ts
useToast()
```

sehingga component lain dapat menggunakannya tanpa menduplikasi logic timer.

---

# 15. TEMPLATE HARUS TETAP SAMA

Walaupun component dipisah-pisah, hasil akhir harus tetap memiliki:

- header
- jumlah dokumen
- tombol upload
- error alert
- search
- sorting
- refresh
- tabel
- loading state
- empty state
- document row
- read button
- edit button
- delete button
- pagination
- upload modal
- delete modal
- toast

Jangan melakukan redesign.

Refactoring ini adalah **code refactoring, bukan UI redesign**.

---

# 16. TYPE SAFETY

Gunakan TypeScript dengan benar.

Hindari:

```ts
any
```

jika bisa digantikan dengan type yang jelas.

Contohnya error handling dapat menggunakan pendekatan yang lebih aman daripada:

```ts
catch (err: any)
```

Tetapi jangan melakukan perubahan TypeScript yang berlebihan jika berpotensi mengubah behavior.

---

# 17. HINDARI OVER-ENGINEERING

Jangan membuat abstraction yang terlalu kompleks.

Saya lebih memilih:

```text
simple
reusable
jelas
mudah dipahami
mudah diedit
```

daripada architecture yang terlalu rumit.

Jangan membuat factory, class, generic abstraction, atau pattern yang tidak benar-benar diperlukan.

---

# 18. OUTPUT YANG SAYA INGINKAN

Jangan hanya memberikan penjelasan.

Saya ingin kamu:

### A. Analisis kode asli terlebih dahulu

Identifikasi:

- kode duplikat
- logic yang terlalu besar
- logic yang seharusnya menjadi composable
- component yang dapat dipisahkan
- bagian yang khusus Buku
- bagian yang dapat digunakan Buku/Jurnal/Skripsi

### B. Buat struktur folder final

Tampilkan:

```text
project/
├── components/
├── composables/
├── types/
├── utils/
└── pages/
```

### C. Berikan isi setiap file secara terpisah

Jangan menggabungkan semua kode menjadi satu file.

Gunakan format:

```text
// composables/useDocuments.ts
```

lalu kode lengkap.

Kemudian:

```text
// composables/useDocumentUpload.ts
```

dan seterusnya.

### D. Berikan kode lengkap

Jangan menggunakan:

```ts
// ... kode lainnya
```

atau:

```ts
// sisanya sama
```

Saya membutuhkan kode yang dapat langsung digunakan.

### E. Berikan versi halaman Buku

Buat:

```text
pages/buku/index.vue
```

yang menggunakan struktur reusable.

### F. Berikan contoh halaman Jurnal

Buat contoh:

```text
pages/jurnal/index.vue
```

yang menggunakan logic yang sama tanpa copy-paste seluruh kode Buku.

### G. Berikan contoh halaman Skripsi

Buat:

```text
pages/skripsi/index.vue
```

dengan prinsip yang sama.

---

# 19. VALIDASI SETELAH REFACTORING

Setelah selesai, lakukan pengecekan secara logis terhadap kode.

Pastikan:

- Tidak ada import yang tidak digunakan.
- Tidak ada variable yang tidak digunakan.
- Tidak ada function yang hilang.
- Tidak ada component yang salah import.
- Tidak ada props yang tidak sesuai.
- Tidak ada TypeScript error yang jelas.
- Semua event tetap terhubung.
- Upload PDF tetap bekerja.
- Drag & drop tetap bekerja.
- Search tetap bekerja.
- Sorting tetap bekerja.
- Pagination tetap bekerja.
- Delete Storage tetap bekerja.
- Delete database tetap bekerja.
- User filtering tetap bekerja.
- Toast tetap bekerja.
- Modal tetap bekerja.
- Route Buku tetap bekerja.
- Struktur dapat digunakan untuk Jurnal.
- Struktur dapat digunakan untuk Skripsi.

---

# 20. PRIORITAS REFACTORING

Urutkan prioritas seperti berikut:

```text
1. Pertahankan behavior
2. Pertahankan UI
3. Pisahkan logic reusable
4. Hilangkan hard-coded category
5. Kurangi duplikasi
6. Pisahkan component
7. Perjelas TypeScript
8. Rapikan struktur folder
9. Pastikan Buku/Jurnal/Skripsi dapat menggunakan logic yang sama
```

Jika terdapat konflik antara "kode lebih bersih" dan "behavior lama tetap sama", **prioritaskan behavior lama**.

Jangan melakukan perubahan database atau migration.

Gunakan kode yang ada sebagai sumber utama. Jangan mengarang struktur database baru.

Jika ada bagian yang belum diketahui dari project, tandai bagian tersebut dan buat asumsi seminimal mungkin.

Tujuan akhirnya adalah:

> **Satu sistem document management yang reusable, dengan satu logic utama yang dapat digunakan oleh Buku, Jurnal, dan Skripsi, sementara setiap halaman hanya menyediakan konfigurasi kategori dan route masing-masing.**