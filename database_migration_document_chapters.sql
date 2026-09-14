-- ==============================================================================
-- MIGRATION: IMPLEMENTASI NAVIGASI BAB PDF OTOMATIS (ADOBE EXTRACT API)
-- ==============================================================================

-- 1. Tambahkan kolom status & pelacakan ekstraksi ke tabel `documents`
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending';

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_error TEXT;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_started_at TIMESTAMPTZ;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extraction_completed_at TIMESTAMPTZ;

-- 2. Buat tabel `document_chapters`
-- Catatan tipe document_id:
-- Jika tabel documents Anda menggunakan BIGINT (default Supabase), gunakan BIGINT.
-- Jika tabel documents Anda menggunakan UUID, sesuaikan kolom document_id menjadi UUID.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chapters'
    ) THEN
        -- Cek tipe data id pada tabel documents
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'id') = 'uuid' THEN
            CREATE TABLE document_chapters (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                judul_bab TEXT NOT NULL,
                nomor_halaman INTEGER NOT NULL CHECK (nomor_halaman >= 1),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ELSE
            CREATE TABLE document_chapters (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                judul_bab TEXT NOT NULL,
                nomor_halaman INTEGER NOT NULL CHECK (nomor_halaman >= 1),
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        END IF;
    END IF;
END $$;

-- 3. Tambahkan Index untuk mempercepat query berdasarkan document_id dan nomor_halaman
CREATE INDEX IF NOT EXISTS idx_document_chapters_document_id
ON document_chapters(document_id);

CREATE INDEX IF NOT EXISTS idx_document_chapters_document_page
ON document_chapters(document_id, nomor_halaman ASC);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE document_chapters ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS (Row Level Security)
-- Pengguna yang telah login (authenticated) dapat membaca bab dari dokumen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'document_chapters' AND policyname = 'Allow select chapters for authenticated'
    ) THEN
        CREATE POLICY "Allow select chapters for authenticated"
        ON document_chapters
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'document_chapters' AND policyname = 'Allow manage chapters for authenticated'
    ) THEN
        CREATE POLICY "Allow manage chapters for authenticated"
        ON document_chapters
        FOR ALL
        TO authenticated, anon, service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 6. Berikan Hak Akses (GRANT) ke role Supabase (anon, authenticated, service_role)
-- Ini penting untuk mencegah error "permission denied for table document_chapters"
GRANT ALL ON TABLE public.document_chapters TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
