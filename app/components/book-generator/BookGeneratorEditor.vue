<script setup lang="ts">
import { watch, onBeforeUnmount, ref, nextTick } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import { FileHandler } from '@tiptap/extension-file-handler'
import { TextStyle } from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { marked } from 'marked'
import type { DocumentContentBlock, DocumentSubsection } from '~/types/documentContentBlock'
import { useContentImageUpload } from '~/composables/document/useContentImageUpload'

const props = defineProps<{
  block: DocumentContentBlock | null
  documentTitle?: string
  category?: 'buku' | 'jurnal' | 'skripsi' | string
  activeSubsection?: DocumentSubsection | null
  activeSubsectionId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update', content: Record<string, any>): void
}>()

const isInternalUpdate = ref(false)
const imageInputRef = ref<HTMLInputElement | null>(null)
const { isUploading, uploadError, uploadImage } = useContentImageUpload()

// Handler unggah gambar untuk drop, paste, & picker manual
const handleImageFiles = async (files: File[], insertPos?: number) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    const publicUrl = await uploadImage(file)
    if (publicUrl && editor.value) {
      if (typeof insertPos === 'number') {
        editor.value.chain().focus().insertContentAt(insertPos, {
          type: 'image',
          attrs: { src: publicUrl }
        }).run()
      } else {
        editor.value.chain().focus().setImage({ src: publicUrl }).run()
      }
    }
  }
}

const onManualImageSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await handleImageFiles(Array.from(target.files))
    target.value = ''
  }
}

const triggerImagePicker = () => {
  imageInputRef.value?.click()
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Placeholder.configure({
      placeholder: 'Mulai ketikkan atau edit isi bagian ini...'
    }),
    TableKit.configure({
      table: {
        resizable: true
      }
    }),
    Image.configure({
      inline: true,
      allowBase64: true
    }),
    TextStyle,
    FontFamily,
    TextAlign.configure({
      types: ['heading', 'paragraph']
    }),
    Subscript,
    Superscript,
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
      onDrop: (_currentEditor, files, pos) => {
        handleImageFiles(files, pos)
      },
      onPaste: (_currentEditor, files) => {
        handleImageFiles(files)
      }
    })
  ],
  content: '',
  editorProps: {
    attributes: {
      class: 'prose prose-invert max-w-none focus:outline-none min-h-[420px] px-6 py-5 text-slate-200 text-sm leading-relaxed'
    }
  },
  onUpdate: () => {
    if (!editor.value || isInternalUpdate.value || !props.block) return
    const json = editor.value.getJSON()
    const html = editor.value.getHTML()
    emit('update', {
      ...json,
      html
    })
  }
})

// Sinkronisasi konten saat blok yang dipilih berubah
const loadBlockContent = (targetBlock: DocumentContentBlock | null) => {
  if (!editor.value || !targetBlock) return

  isInternalUpdate.value = true

  try {
    const c = targetBlock.content

    if (!c || Object.keys(c).length === 0) {
      editor.value.commands.setContent('')
    } else if (typeof c.html === 'string' && c.html.trim()) {
      editor.value.commands.setContent(c.html)
    } else if (typeof c.raw_markdown === 'string' && c.raw_markdown.trim()) {
      const htmlFromMarkdown = marked.parse(c.raw_markdown) as string
      editor.value.commands.setContent(htmlFromMarkdown)
    } else if (c.type === 'doc') {
      editor.value.commands.setContent(c)
    } else {
      editor.value.commands.setContent('')
    }
  } catch (err) {
    console.warn('Gagal memuat konten ke TipTap editor:', err)
  } finally {
    isInternalUpdate.value = false
  }
}

watch(
  () => props.block?.id,
  () => {
    loadBlockContent(props.block)
  },
  { immediate: true }
)

watch(
  () => editor.value,
  (newEditor) => {
    if (newEditor && props.block) {
      loadBlockContent(props.block)
    }
  }
)

// Navigasi & Auto-Scroll Langsung ke Sub-bab yang dipilih di Sidebar
const scrollToActiveSubsection = (sub: DocumentSubsection | null) => {
  if (!sub) return
  nextTick(() => {
    let targetEl: Element | null = null

    // 1. Coba cari elemen dengan id atau data-sub-id
    if (sub.id) {
      targetEl = document.querySelector(`[data-sub-id="${sub.id}"]`) || document.getElementById(sub.id)
    }

    // 2. Fallback: Cari heading dengan teks judul sub-bab
    if (!targetEl) {
      const headings = document.querySelectorAll('.prose h2, .prose h3, .prose h4')
      const targetTitle = (sub.title || '').trim().toLowerCase()
      const targetCode = (sub.code || '').trim().toLowerCase()

      for (const h of headings) {
        const txt = (h.textContent || '').trim().toLowerCase()
        if (
          (targetTitle && txt.includes(targetTitle)) ||
          (targetCode && (txt.startsWith(targetCode + '.') || txt.startsWith(targetCode + ' ')))
        ) {
          targetEl = h
          break
        }
      }
    }

    if (targetEl) {
      // Scroll secara halus dan posisikan heading di tengah/atas layar editor
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Efek visual highlight pulsing
      targetEl.classList.remove('sub-highlight')
      void (targetEl as HTMLElement).offsetWidth
      targetEl.classList.add('sub-highlight')

      setTimeout(() => {
        targetEl?.classList.remove('sub-highlight')
      }, 3000)

      // Arahkan kursor TipTap langsung ke posisi awal sub-bab tersebut
      if (editor.value) {
        try {
          const domPos = editor.value.view.posAtDOM(targetEl, 0)
          if (domPos >= 0) {
            editor.value.commands.setTextSelection(domPos)
            editor.value.commands.focus()
          }
        } catch {
          // ignore selection errors
        }
      }
    }
  })
}

// Pantau perubahan sub-bab aktif dan jalankan scroll otomatis
watch(
  () => [props.activeSubsectionId, props.block?.id],
  ([newSubId, newBlockId], [oldSubId, oldBlockId]) => {
    if (newSubId && props.activeSubsection) {
      const delay = newBlockId !== oldBlockId ? 300 : 60
      setTimeout(() => {
        scrollToActiveSubsection(props.activeSubsection!)
      }, delay)
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="flex-1 bg-[#0e1117] border border-slate-800/90 rounded-2xl flex flex-col shadow-lg overflow-hidden">
    <!-- Toolbar Format TipTap Lengkap -->
    <div v-if="editor" class="flex flex-wrap items-center gap-1 p-2.5 bg-[#0d0f14] border-b border-slate-800/80">
      <!-- Heading Levels -->
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="[
          'px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('heading', { level: 1 })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Heading 1"
      >
        H1
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="[
          'px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('heading', { level: 2 })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Heading 2"
      >
        H2
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="[
          'px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('heading', { level: 3 })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Heading 3"
      >
        H3
      </button>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Font Family Selector -->
      <select
        @change="(e: any) => {
          const val = e.target.value
          if (val) editor.chain().focus().setFontFamily(val).run()
          else editor.chain().focus().unsetFontFamily().run()
        }"
        class="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
        title="Pilih Jenis Font"
      >
        <option value="">Font Bawaan</option>
        <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans</option>
        <option value="Inter, sans-serif">Inter</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Merriweather, serif">Merriweather</option>
        <option value="monospace">Monospace</option>
      </select>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Text formatting: Bold, Italic, Strike -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('bold')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Tebal (Bold)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('italic')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Miring (Italic)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4h6M8 20h6M14 4l-4 16" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('strike')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Coret (Strike)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M16 6a4 4 0 00-7.33-2M9 18a4 4 0 007.33 2" />
        </svg>
      </button>

      <!-- Subscript & Superscript -->
      <button
        type="button"
        @click="editor.chain().focus().toggleSubscript().run()"
        :class="[
          'px-1.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
          editor.isActive('subscript')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Subskrip (X₂)"
      >
        X<sub class="text-[10px]">2</sub>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleSuperscript().run()"
        :class="[
          'px-1.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
          editor.isActive('superscript')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Superskrip (X²)"
      >
        X<sup class="text-[10px]">2</sup>
      </button>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Text Alignment -->
      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('left').run()"
        :class="[
          'p-1.5 rounded-lg text-xs transition-colors cursor-pointer',
          editor.isActive({ textAlign: 'left' })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Rata Kiri"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('center').run()"
        :class="[
          'p-1.5 rounded-lg text-xs transition-colors cursor-pointer',
          editor.isActive({ textAlign: 'center' })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Rata Tengah"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M5 18h14" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('right').run()"
        :class="[
          'p-1.5 rounded-lg text-xs transition-colors cursor-pointer',
          editor.isActive({ textAlign: 'right' })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Rata Kanan"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M6 18h14" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().setTextAlign('justify').run()"
        :class="[
          'p-1.5 rounded-lg text-xs transition-colors cursor-pointer',
          editor.isActive({ textAlign: 'justify' })
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Rata Kanan Kiri (Justify)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Lists -->
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('bulletList')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Daftar Poin (Bullet List)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16M2 6h.01M2 12h.01M2 18h.01" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('orderedList')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Daftar Angka (Ordered List)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h13M7 12h13M7 18h13M3 6h1v4M3 14h2l-2 3h2" />
        </svg>
      </button>

      <button
        type="button"
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="[
          'p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
          editor.isActive('blockquote')
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        ]"
        title="Kutipan (Blockquote)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Table Tools -->
      <button
        type="button"
        @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        class="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        title="Sisipkan Tabel (3x3)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
      </button>

      <!-- Context Table Actions (hanya muncul saat kursor berada di dalam tabel) -->
      <template v-if="editor.isActive('table')">
        <button
          type="button"
          @click="editor.chain().focus().addRowAfter().run()"
          class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          title="Tambah Baris"
        >
          + Baris
        </button>
        <button
          type="button"
          @click="editor.chain().focus().addColumnAfter().run()"
          class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
          title="Tambah Kolom"
        >
          + Kolom
        </button>
        <button
          type="button"
          @click="editor.chain().focus().deleteRow().run()"
          class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-rose-400 hover:bg-rose-500/20"
          title="Hapus Baris"
        >
          - Baris
        </button>
        <button
          type="button"
          @click="editor.chain().focus().deleteColumn().run()"
          class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-rose-400 hover:bg-rose-500/20"
          title="Hapus Kolom"
        >
          - Kolom
        </button>
        <button
          type="button"
          @click="editor.chain().focus().deleteTable().run()"
          class="px-2 py-0.5 rounded text-[11px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
          title="Hapus Seluruh Tabel"
        >
          Hapus Tabel
        </button>
      </template>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Sisipkan Gambar via File Input -->
      <input
        ref="imageInputRef"
        type="file"
        accept="image/png, image/jpeg, image/webp"
        class="hidden"
        @change="onManualImageSelect"
      />
      <button
        type="button"
        :disabled="isUploading"
        @click="triggerImagePicker"
        class="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
        title="Sisipkan Gambar (PNG, JPG, WebP)"
      >
        <svg v-if="isUploading" class="animate-spin w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-[11px] font-medium hidden sm:inline">{{ isUploading ? 'Mengunggah...' : 'Gambar' }}</span>
      </button>

      <div class="w-px h-4 bg-slate-800 mx-1"></div>

      <!-- Undo / Redo -->
      <button
        type="button"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="Undo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l6-6M3 10l6 6" />
        </svg>
      </button>

      <button
        type="button"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="Redo"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2M21 10l-6-6M21 10l-6 6" />
        </svg>
      </button>
    </div>

    <!-- Error Upload Alert -->
    <div v-if="uploadError" class="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
      <span>⚠️ {{ uploadError }}</span>
    </div>

    <!-- Title of Active Section Header -->
    <div v-if="block" class="px-6 py-3 border-b border-slate-800/80 bg-[#090b0e]/50 flex items-center justify-between gap-3">
      <div class="space-y-0.5 min-w-0">
        <span class="text-[10px] font-bold uppercase tracking-wider text-rose-400">
          Sedang Mengedit Bagian
        </span>
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="text-base font-bold text-white truncate">
            {{ block.title }}
          </h2>
          <button
            v-if="activeSubsection"
            type="button"
            @click="scrollToActiveSubsection(activeSubsection)"
            class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer truncate"
            title="Klik untuk scroll ke posisi sub-bab ini di editor"
          >
            <span>Sub-bab: {{ activeSubsection.code }}. {{ activeSubsection.title }}</span>
            <svg class="w-3 h-3 text-rose-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

    </div>

    <!-- TipTap Editor Content Container wrapped in ClientOnly -->
    <div class="flex-1 overflow-y-auto bg-[#090b0e]/30">
      <ClientOnly>
        <EditorContent :editor="editor" />
        <template #fallback>
          <div class="p-8 text-center text-slate-500 text-xs">
            Memuat rich text editor...
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style>
/* Efek visual highlight saat navigasi ke sub-bab */
.sub-highlight {
  animation: highlightPulse 2.8s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: rgba(244, 63, 94, 0.15) !important;
  border-left: 4px solid #f43f5e !important;
  padding-left: 10px !important;
  border-radius: 6px !important;
}

@keyframes highlightPulse {
  0% {
    background-color: rgba(244, 63, 94, 0.45);
  }
  70% {
    background-color: rgba(244, 63, 94, 0.15);
  }
  100% {
    background-color: transparent;
  }
}

/* Prose dark styles for TipTap */
.prose h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.prose h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(51, 65, 85, 0.4);
  padding-bottom: 0.35rem;
}

.prose h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-top: 1rem;
  margin-bottom: 0.4rem;
}

.prose p {
  margin-top: 0;
  margin-bottom: 1rem;
  line-height: 1.75;
}

.prose ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.prose ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.prose li {
  margin-bottom: 0.25rem;
}

.prose blockquote {
  border-left: 3px solid #f43f5e;
  padding-left: 1rem;
  margin-left: 0;
  color: #94a3b8;
  font-style: italic;
}

.prose hr {
  border-color: #1e293b;
  margin: 1.5rem 0;
}

/* TipTap Table Styling */
.prose table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5rem 0;
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid #334155;
}

.prose table td,
.prose table th {
  min-width: 1em;
  border: 1px solid #334155;
  padding: 8px 12px;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
}

.prose table th {
  font-weight: bold;
  text-align: left;
  background-color: #1e293b;
  color: #f8fafc;
}

.prose table tr:nth-child(even) {
  background-color: rgba(30, 41, 59, 0.3);
}

.prose table .selectedCell:after {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(244, 63, 94, 0.15);
  pointer-events: none;
}

/* TipTap Image Styling */
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  margin: 1rem auto;
  display: block;
  border: 1px solid #334155;
}

/* Subscript & Superscript */
.prose sub {
  vertical-align: sub;
  font-size: 0.75em;
}

.prose sup {
  vertical-align: super;
  font-size: 0.75em;
}

/* TipTap Placeholder style */
.prose p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #64748b;
  pointer-events: none;
  height: 0;
}
</style>
