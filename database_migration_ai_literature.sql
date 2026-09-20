-- ==============================================================================
-- MIGRATION: IMPLEMENTASI FITUR BUAT LITERATUR AI (KONTEN TERSTRUKTUR & PDF CACHE)
-- ==============================================================================

-- 1. Perluasan tabel `documents` untuk mendukung dokumen hasil AI generation & cache PDF
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'upload'
    CHECK (source IN ('upload', 'ai_generated')),
  ADD COLUMN IF NOT EXISTS ai_generation_status TEXT
    CHECK (ai_generation_status IN ('pending', 'generating', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS ai_generation_error TEXT,
  ADD COLUMN IF NOT EXISTS ai_generation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_generation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pdf_cache_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_cache_stale BOOLEAN NOT NULL DEFAULT true;

-- 2. Buat tabel `document_content_blocks`
-- Mendeteksi tipe data ID tabel documents secara dinamis (UUID vs BIGINT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_content_blocks'
    ) THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'id') = 'uuid' THEN
            CREATE TABLE document_content_blocks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                block_order INTEGER NOT NULL,
                section_type TEXT NOT NULL CHECK (section_type IN ('daftar_isi', 'bab', 'kesimpulan', 'daftar_pustaka')),
                title TEXT NOT NULL,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        ELSE
            CREATE TABLE document_content_blocks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                block_order INTEGER NOT NULL,
                section_type TEXT NOT NULL CHECK (section_type IN ('daftar_isi', 'bab', 'kesimpulan', 'daftar_pustaka')),
                title TEXT NOT NULL,
                content JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        END IF;
    END IF;
END $$;

-- 3. Tambahkan Index untuk mempercepat query berdasarkan document_id dan urutan blok
CREATE INDEX IF NOT EXISTS idx_document_content_blocks_document_id
  ON document_content_blocks(document_id);

CREATE INDEX IF NOT EXISTS idx_document_content_blocks_doc_order
  ON document_content_blocks(document_id, block_order ASC);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE document_content_blocks ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS (Row Level Security)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'document_content_blocks' AND policyname = 'Allow select content blocks for all'
    ) THEN
        CREATE POLICY "Allow select content blocks for all"
        ON document_content_blocks
        FOR SELECT
        TO authenticated, anon
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'document_content_blocks' AND policyname = 'Allow manage content blocks for authenticated'
    ) THEN
        CREATE POLICY "Allow manage content blocks for authenticated"
        ON document_content_blocks
        FOR ALL
        TO authenticated, anon, service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 6. Hak Akses (GRANT) ke role Supabase
GRANT ALL ON TABLE public.document_content_blocks TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
