import { defineEventHandler, readBody, createError } from 'h3'
import type { LiteratureReference } from '~/types/literatureReference'
import { searchWorks } from '../../utils/openalex/searchWorks'
import { formatApaCitation } from '../../utils/openalex/formatCitation'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const openalexApiKey = config.public?.openalexApiKey || process.env.OPENALEX_API_KEY

  const body = await readBody<{ title?: string }>(event).catch(() => null)
  const title = (body?.title || '').trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Judul karya wajib diisi untuk pencarian referensi.'
    })
  }

  let references: LiteratureReference[] = []
  try {
    references = await searchWorks(title, { apiKey: openalexApiKey })
  } catch (openAlexErr) {
    console.warn('[ai/references] Pencarian OpenAlex gagal, melanjutkan tanpa pustaka luar:', openAlexErr)
  }

  let referencesMarkdown = '# Daftar Pustaka\n\n'
  if (references.length > 0) {
    referencesMarkdown += references
      .map(ref => formatApaCitation(ref))
      .join('\n\n')
  } else {
    referencesMarkdown += '*Referensi bibliografis disusun berdasarkan studi literatur dan metodologi akademik Cendekia.*'
  }

  return {
    references,
    markdown: referencesMarkdown
  }
})
