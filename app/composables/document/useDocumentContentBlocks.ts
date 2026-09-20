import { ref, computed } from 'vue'
import type { DocumentContentBlock } from '~/types/documentContentBlock'

/**
 * Composable client-side untuk mengelola CRUD blok konten dokumen AI
 * langsung menggunakan Supabase JS client dengan RLS (konsisten dengan useDocumentUpload.ts).
 */
export function useDocumentContentBlocks() {
  const { client } = useSupabase()

  const blocks = ref<DocumentContentBlock[]>([])
  const activeBlockId = ref<string | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref('')
  const hasUnsavedChanges = ref(false)

  const activeBlock = computed(() => {
    if (!activeBlockId.value) return blocks.value[0] || null
    return blocks.value.find(b => b.id === activeBlockId.value) || blocks.value[0] || null
  })

  /**
   * Mengambil semua blok konten milik satu dokumen langsung dari Supabase
   */
  const fetchBlocks = async (documentId: string | number) => {
    if (!documentId || !client) return []

    isLoading.value = true
    errorMessage.value = ''

    try {
      const { data, error } = await client
        .from('document_content_blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('block_order', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      blocks.value = (data || []) as DocumentContentBlock[]
      if (blocks.value.length > 0 && !activeBlockId.value) {
        activeBlockId.value = blocks.value[0].id
      }
      hasUnsavedChanges.value = false
      return blocks.value
    } catch (err: any) {
      console.error('[useDocumentContentBlocks] Gagal mengambil blok konten dokumen:', err)
      errorMessage.value = err?.message || 'Gagal mengambil konten dokumen.'
      return []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Memperbarui konten blok aktif di memory dan menandai ada perubahan belum disimpan
   */
  const updateBlockContent = (blockId: string, newContent: Record<string, any>) => {
    const target = blocks.value.find(b => b.id === blockId)
    if (target) {
      target.content = newContent
      hasUnsavedChanges.value = true
    }
  }

  /**
   * Menyimpan / memperbarui semua blok konten langsung ke tabel document_content_blocks
   * serta menandai pdf_cache_stale = true pada tabel documents
   */
  const saveBlocks = async (
    documentId: string | number,
    meta?: { userId?: string | null; author?: string | null }
  ): Promise<boolean> => {
    if (!documentId || !client || blocks.value.length === 0) return false

    isSaving.value = true
    errorMessage.value = ''

    try {
      // 1. Upsert blok konten ke Supabase
      const upsertRows = blocks.value.map(b => ({
        id: b.id,
        document_id: documentId,
        block_order: b.block_order,
        section_type: b.section_type,
        title: b.title,
        content: b.content,
        updated_at: new Date().toISOString()
      }))

      const { error: upsertError } = await client
        .from('document_content_blocks')
        .upsert(upsertRows, { onConflict: 'id' })

      if (upsertError) {
        throw new Error(`Gagal menyimpan blok konten: ${upsertError.message}`)
      }

      // 2. Perbarui metadata dokumen: tandai cache PDF telah usang (stale)
      const docUpdates: Record<string, any> = {
        pdf_cache_stale: true
      }
      if (meta?.userId) docUpdates.user_id = meta.userId
      if (meta?.author) docUpdates.author = meta.author

      await client
        .from('documents')
        .update(docUpdates)
        .eq('id', documentId)

      hasUnsavedChanges.value = false
      return true
    } catch (err: any) {
      console.error('[useDocumentContentBlocks] Gagal menyimpan perubahan konten:', err)
      errorMessage.value = err?.message || 'Gagal menyimpan perubahan konten.'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Memilih blok aktif untuk diedit di TipTap editor
   */
  const selectBlock = (blockId: string) => {
    activeBlockId.value = blockId
  }

  return {
    blocks,
    activeBlockId,
    activeBlock,
    isLoading,
    isSaving,
    errorMessage,
    hasUnsavedChanges,
    fetchBlocks,
    updateBlockContent,
    saveBlocks,
    selectBlock
  }
}
