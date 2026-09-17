<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAiSearchStore } from '~/stores/useAiSearchStore'

const props = defineProps<{
  content?: string
  isStreaming?: boolean
}>()

const store = useAiSearchStore()
const containerRef = ref<HTMLDivElement | null>(null)

// Konfigurasi marked
marked.setOptions({
  gfm: true,
  breaks: true
})

/**
 * Format timestamp jam:menit
 */
function formatTime(timestamp?: number): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Mengubah token citation [1] s.d. [5] menjadi elemen button interaktif tersanitasi
 */
function renderMessageHtml(text: string): string {
  if (!text) return ''

  // 1. Render markdown
  let rawHtml = marked.parse(text) as string

  // 2. Ganti [1], [2], dst. dengan button citation interaktif
  rawHtml = rawHtml.replace(/\[([1-5])\]/g, (match, p1) => {
    const isActive = store.activeCitation === Number(p1)
    const activeClass = isActive
      ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/50 scale-105 shadow-sm shadow-rose-950/40'
      : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500 hover:text-white hover:border-rose-400'

    return `<button type="button" data-citation-index="${p1}" class="citation-badge inline-flex items-center justify-center font-bold font-mono text-[10.5px] px-1.5 py-0.5 mx-0.5 rounded cursor-pointer transition-all border align-super ${activeClass}" title="Lihat literatur rujukan [${p1}]">[${p1}]</button>`
  })

  // 3. Sanitasi dengan DOMPurify (XSS Protection ketat)
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['button'],
    ADD_ATTR: ['data-citation-index', 'target', 'rel', 'class', 'title', 'type']
  })
}

/**
 * Event delegation untuk klik badge sitasi di dalam HTML yang di-render
 */
function handleContainerClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-citation-index]') as HTMLElement | null
  if (target && target.dataset.citationIndex) {
    const index = Number(target.dataset.citationIndex)
    store.setActiveCitation(index)

    // Jika pesan memiliki referensi tersimpan, sinkronkan ke panel kanan
    const msgEl = target.closest('[data-message-id]') as HTMLElement | null
    if (msgEl && msgEl.dataset.messageId) {
      const msg = store.chatHistory.find(m => m.id === msgEl.dataset.messageId)
      if (msg?.references && msg.references.length > 0) {
        store.setActiveReferences(msg.references)
      }
    }

    const card = document.querySelector(`[data-reference-index="${index}"]`)
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
}

/**
 * Auto-scroll jika user berada dekat dengan bagian bawah container
 */
const scrollToBottomIfNear = async () => {
  await nextTick()
  const el = containerRef.value
  if (!el) return

  const threshold = 180
  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold

  if (isNearBottom) {
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth'
    })
  }
}

watch(
  () => [store.currentResponse, store.chatHistory.length],
  () => {
    scrollToBottomIfNear()
  },
  { deep: true }
)
</script>

<template>
  <div
    ref="containerRef"
    @click="handleContainerClick"
    class="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-200 text-xs sm:text-sm leading-relaxed chat-scrollbar"
  >
    <!-- Thread Percakapan / History -->
    <template v-for="msg in store.chatHistory" :key="msg.id">
      <!-- 1. Pesan User (Pertanyaan/Kueri) -->
      <div
        v-if="msg.role === 'user'"
        class="flex flex-col items-end space-y-1.5 max-w-[92%] sm:max-w-[85%] ml-auto"
      >
        <div class="flex items-center gap-2 text-[11px] text-slate-400 font-medium px-1">
          <span class="text-slate-300 font-semibold">Anda</span>
          <span class="w-1 h-1 rounded-full bg-slate-600"></span>
          <span>{{ formatTime(msg.createdAt) }}</span>
        </div>
        <div class="bg-gradient-to-br from-[#1e2433] to-[#161a24] border border-slate-700/80 hover:border-slate-600 text-slate-100 rounded-2xl rounded-tr-sm px-4 py-3 text-xs sm:text-[13.5px] leading-relaxed shadow-lg shadow-black/25">
          {{ msg.content }}
        </div>
      </div>

      <!-- 2. Respon Asisten AI -->
      <div
        v-else-if="msg.role === 'assistant' && msg.content && msg.content.trim()"
        :data-message-id="msg.id"
        class="flex flex-col space-y-3.5 bg-[#141822]/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm"
      >
        <!-- Header Bar AI -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-sm shadow-rose-950/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs sm:text-[13px] font-bold text-white tracking-tight">Arsip Cendekia AI</span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  Sintesis Riset RAG
                </span>
              </div>
            </div>
          </div>
          <button
            v-if="msg.references && msg.references.length > 0"
            type="button"
            @click="store.setActiveReferences(msg.references)"
            class="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-rose-300 font-medium transition-colors cursor-pointer"
            title="Tampilkan rujukan ini di panel kanan"
          >
            <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{{ msg.references.length }} Literatur</span>
          </button>
        </div>

        <!-- Markdown Body yang Eye-Friendly -->
        <div
          class="markdown-body prose prose-invert prose-rose max-w-none text-slate-200 text-xs sm:text-[13.5px] leading-relaxed sm:leading-[1.8]"
          v-html="renderMessageHtml(msg.content)"
        ></div>
      </div>
    </template>

    <!-- 3. Sesi Streaming Aktif (Sedang berlangsung) -->
    <div
      v-if="store.isStreaming"
      class="flex flex-col space-y-3.5 bg-[#141822]/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-sm"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-sm shadow-rose-950/20">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs sm:text-[13px] font-bold text-white tracking-tight">Arsip Cendekia AI</span>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20 animate-pulse">
                Sedang Mensintesis...
              </span>
            </div>
          </div>
        </div>
        <div v-if="store.currentReferences.length > 0" class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{{ store.currentReferences.length }} Literatur Terhubung</span>
        </div>
      </div>

      <!-- Teks Streaming atau Placeholder Animasi -->
      <div
        v-if="store.currentResponse"
        class="markdown-body prose prose-invert prose-rose max-w-none text-slate-200 text-xs sm:text-[13.5px] leading-relaxed sm:leading-[1.8]"
        v-html="renderMessageHtml(store.currentResponse)"
      ></div>

      <div v-else class="flex items-center gap-2 text-xs text-rose-400 font-medium py-3">
        <span class="inline-flex gap-1 items-center">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]"></span>
        </span>
        <span class="text-slate-400 text-[11px]">
          Menganalisis literatur dari OpenAlex dan menyusun sintesis riset...
        </span>
      </div>

      <!-- Indicator Typing kecil di bawah teks streaming -->
      <div v-if="store.currentResponse" class="flex items-center gap-2 text-[11px] text-rose-400/80 pt-1">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
        <span>Melanjutkan penulisan sintesis...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.markdown-body) {
  color: #cbd5e1;
  font-size: 0.85rem;
  line-height: 1.8;
}

@media (min-width: 640px) {
  :deep(.markdown-body) {
    font-size: 0.875rem;
    line-height: 1.85;
  }
}

:deep(.markdown-body h3) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fda4af; /* rose-300 */
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(244, 63, 94, 0.18);
  letter-spacing: -0.01em;
}

:deep(.markdown-body h3:first-child) {
  margin-top: 0.25rem;
}

:deep(.markdown-body p) {
  margin-top: 0.85rem;
  margin-bottom: 0.85rem;
  line-height: 1.8;
  color: #cbd5e1;
}

:deep(.markdown-body ul) {
  margin-top: 0.85rem;
  margin-bottom: 1rem;
  padding-left: 1.25rem;
  list-style-type: disc;
  display: flex;
  flex-direction: column;
  gap: 0.65rem; /* Spacing nyaman antar bullet point */
}

:deep(.markdown-body li) {
  line-height: 1.8;
  color: #e2e8f0;
}

:deep(.markdown-body li::marker) {
  color: #f43f5e; /* Rose bullet */
}

:deep(.markdown-body strong) {
  color: #ffffff;
  font-weight: 600;
}

:deep(.citation-badge) {
  transition: all 0.2s ease;
}
</style>
