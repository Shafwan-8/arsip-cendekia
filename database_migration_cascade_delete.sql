-- ==============================================================================
-- MIGRATION: CASCADE DELETION UNTUK DOCUMENT_CONTENT_BLOCKS & DOCUMENT_CHAPTERS
-- ==============================================================================

-- 1. Pastikan FK document_content_blocks -> documents menggunakan ON DELETE CASCADE
ALTER TABLE document_content_blocks
  DROP CONSTRAINT IF EXISTS document_content_blocks_document_id_fkey,
  ADD CONSTRAINT document_content_blocks_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- 2. Pastikan FK document_chapters -> documents menggunakan ON DELETE CASCADE
ALTER TABLE document_chapters
  DROP CONSTRAINT IF EXISTS document_chapters_document_id_fkey,
  ADD CONSTRAINT document_chapters_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
