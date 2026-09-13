<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type {
  PdfEditorElement,
  PdfTool,
  TextPdfElement,
  HighlightPdfElement,
  ImagePdfElement,
  SignaturePdfElement,
  DrawPdfElement,
  RectPdfElement,
  Point
} from '~/types/pdf-editor'

const props = defineProps<{
  pdfBytes: ArrayBuffer
  currentPage: number
  zoom: number
  isFitWidth: boolean
  selectedTool: PdfTool
  selectedElementId: string | null
  elements: PdfEditorElement[]
}>()

const emit = defineEmits<{
  (e: 'update:total-pages', total: number): void
  (e: 'add-element', element: PdfEditorElement): void
  (e: 'update-element', id: string, updates: Partial<PdfEditorElement>): void
  (e: 'select-element', id: string | null): void
}>()

const viewportContainerRef = ref<HTMLDivElement | null>(null)
const pageContainerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const overlayRef = ref<HTMLDivElement | null>(null)

// State Rendering PDF.js
let pdfDoc: any = null
let pdfjsLib: any = null
let currentRenderTask: any = null

const isPageRendering = ref(false)
const basePageWidth = ref(595) // Base scale 1 width in points
const basePageHeight = ref(842) // Base scale 1 height in points
const currentScale = ref(1.2)

// Inisialisasi PDF.js secara client-side
const initPdfJs = async () => {
  if (typeof window === 'undefined') return
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    }
  }
}

// Muat dokumen PDF dari binary pdfBytes
const loadPdfDocument = async () => {
  if (!props.pdfBytes || props.pdfBytes.byteLength === 0) return

  try {
    await initPdfJs()
    if (!pdfjsLib) return

    // Salin buffer agar tidak detached saat transfer worker
    const bufferCopy = props.pdfBytes.slice(0)
    const loadingTask = pdfjsLib.getDocument({ data: bufferCopy })
    pdfDoc = await loadingTask.promise

    emit('update:total-pages', pdfDoc.numPages)
    await renderPage()
  } catch (err) {
    console.error('Gagal memuat dokumen PDF di editor canvas:', err)
  }
}

// Render halaman aktif ke Canvas
const renderPage = async () => {
  if (!pdfDoc || !canvasRef.value) return

  try {
    isPageRendering.value = true
    const page = await pdfDoc.getPage(props.currentPage)

    if (currentRenderTask) {
      try {
        currentRenderTask.cancel()
      } catch {}
      currentRenderTask = null
    }

    // Ambil dimensi asli halaman pada skala 1
    const unscaledViewport = page.getViewport({ scale: 1 })
    basePageWidth.value = unscaledViewport.width
    basePageHeight.value = unscaledViewport.height

    let scale = props.zoom
    if (props.isFitWidth && viewportContainerRef.value) {
      const containerWidth = viewportContainerRef.value.clientWidth - 48
      scale = Math.max(0.6, Math.min(2.8, containerWidth / unscaledViewport.width))
    }
    currentScale.value = scale

    const viewport = page.getViewport({ scale })
    const outputScale = window.devicePixelRatio || 1

    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = `${Math.floor(viewport.width)}px`
    canvas.style.height = `${Math.floor(viewport.height)}px`

    if (pageContainerRef.value) {
      pageContainerRef.value.style.width = `${Math.floor(viewport.width)}px`
      pageContainerRef.value.style.height = `${Math.floor(viewport.height)}px`
    }

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

    currentRenderTask = page.render({
      canvasContext: ctx,
      viewport,
      transform
    })

    await currentRenderTask.promise
  } catch (err: any) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error('Error saat render halaman di editor canvas:', err)
    }
  } finally {
    isPageRendering.value = false
  }
}

// ==========================================
// INTERAKSI ELEMEN & TOOLS
// ==========================================

// State dragging elemen
const isDragging = ref(false)
const dragElementId = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const elementStartPos = ref({ x: 0, y: 0 })

// State resizing elemen
const isResizing = ref(false)
const resizeElementId = ref<string | null>(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const elementStartSize = ref({ width: 0, height: 0 })

// State pembuatan highlight / kotak / draw
const isDrawingShape = ref(false)
const shapeStartPos = ref({ x: 0, y: 0 })
const currentShapeCoords = ref<{ x: number; y: number; width: number; height: number } | null>(null)

// State pembuatan coretan bebas (draw)
const activeDrawingPoints = ref<Point[]>([])

// Helper mendapatkan koordinat relatif terhadap halaman skala 1 (base scale)
const getNormalizedPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
  if (!overlayRef.value) return { x: 0, y: 0 }
  const rect = overlayRef.value.getBoundingClientRect()

  let clientX = 0
  let clientY = 0
  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('clientX' in e) {
    clientX = e.clientX
    clientY = e.clientY
  }

  // Koordinat relatif di layar
  const screenX = clientX - rect.left
  const screenY = clientY - rect.top

  // Normalisasi ke base scale 1 (agar konsisten dengan ukuran PDF point)
  return {
    x: Math.max(0, Math.min(basePageWidth.value, screenX / currentScale.value)),
    y: Math.max(0, Math.min(basePageHeight.value, screenY / currentScale.value))
  }
}

// Klik pada kanvas overlay
const handleOverlayPointerDown = (e: MouseEvent) => {
  // Jika sedang mengklik elemen atau resize handle, jangan buat shape baru
  if ((e.target as HTMLElement).closest('.pdf-element') || (e.target as HTMLElement).closest('.resize-handle')) {
    return
  }

  const pos = getNormalizedPos(e)

  if (props.selectedTool === 'select') {
    emit('select-element', null)
    return
  }

  if (props.selectedTool === 'text') {
    // Tambahkan Text Element baru
    const newTextElem: TextPdfElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      page: props.currentPage,
      x: pos.x,
      y: pos.y,
      width: 140,
      height: 32,
      text: 'Teks Baru',
      fontSize: 14,
      color: '#000000',
      bold: false,
      italic: false
    }
    emit('add-element', newTextElem)
    return
  }

  if (props.selectedTool === 'highlight' || props.selectedTool === 'rect') {
    isDrawingShape.value = true
    shapeStartPos.value = pos
    currentShapeCoords.value = {
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0
    }
    return
  }

  if (props.selectedTool === 'draw') {
    isDrawingShape.value = true
    activeDrawingPoints.value = [pos]
    return
  }
}

const handleOverlayPointerMove = (e: MouseEvent) => {
  const pos = getNormalizedPos(e)

  // 1. Dragging Elemen
  if (isDragging.value && dragElementId.value) {
    const deltaX = pos.x - dragStartPos.value.x
    const deltaY = pos.y - dragStartPos.value.y

    const newX = Math.max(0, Math.min(basePageWidth.value - 20, elementStartPos.value.x + deltaX))
    const newY = Math.max(0, Math.min(basePageHeight.value - 20, elementStartPos.value.y + deltaY))

    emit('update-element', dragElementId.value, {
      x: Math.round(newX),
      y: Math.round(newY)
    })
    return
  }

  // 2. Resizing Elemen
  if (isResizing.value && resizeElementId.value) {
    const deltaX = pos.x - resizeStartPos.value.x
    const deltaY = pos.y - resizeStartPos.value.y

    const newWidth = Math.max(24, elementStartSize.value.width + deltaX)
    const newHeight = Math.max(16, elementStartSize.value.height + deltaY)

    emit('update-element', resizeElementId.value, {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    })
    return
  }

  // 3. Menggambar Highlight / Kotak
  if (isDrawingShape.value && (props.selectedTool === 'highlight' || props.selectedTool === 'rect')) {
    const minX = Math.min(shapeStartPos.value.x, pos.x)
    const minY = Math.min(shapeStartPos.value.y, pos.y)
    const w = Math.abs(pos.x - shapeStartPos.value.x)
    const h = Math.abs(pos.y - shapeStartPos.value.y)

    currentShapeCoords.value = {
      x: minX,
      y: minY,
      width: w,
      height: h
    }
    return
  }

  // 4. Menggambar Goresan Bebas (Draw)
  if (isDrawingShape.value && props.selectedTool === 'draw') {
    activeDrawingPoints.value.push(pos)
  }
}

const handleOverlayPointerUp = () => {
  // Selesaikan Dragging
  if (isDragging.value) {
    isDragging.value = false
    dragElementId.value = null
  }

  // Selesaikan Resizing
  if (isResizing.value) {
    isResizing.value = false
    resizeElementId.value = null
  }

  // Selesaikan Pembuatan Shape
  if (isDrawingShape.value) {
    if (props.selectedTool === 'highlight' && currentShapeCoords.value) {
      if (currentShapeCoords.value.width > 8 && currentShapeCoords.value.height > 8) {
        const newHighlight: HighlightPdfElement = {
          id: `hl_${Date.now()}`,
          type: 'highlight',
          page: props.currentPage,
          x: Math.round(currentShapeCoords.value.x),
          y: Math.round(currentShapeCoords.value.y),
          width: Math.round(currentShapeCoords.value.width),
          height: Math.round(currentShapeCoords.value.height),
          color: '#facc15',
          opacity: 0.35
        }
        emit('add-element', newHighlight)
      }
    } else if (props.selectedTool === 'rect' && currentShapeCoords.value) {
      if (currentShapeCoords.value.width > 8 && currentShapeCoords.value.height > 8) {
        const newRect: RectPdfElement = {
          id: `rect_${Date.now()}`,
          type: 'rect',
          page: props.currentPage,
          x: Math.round(currentShapeCoords.value.x),
          y: Math.round(currentShapeCoords.value.y),
          width: Math.round(currentShapeCoords.value.width),
          height: Math.round(currentShapeCoords.value.height),
          strokeColor: '#2563eb',
          strokeWidth: 2
        }
        emit('add-element', newRect)
      }
    } else if (props.selectedTool === 'draw' && activeDrawingPoints.value.length > 1) {
      const minX = Math.min(...activeDrawingPoints.value.map(p => p.x))
      const minY = Math.min(...activeDrawingPoints.value.map(p => p.y))
      const maxX = Math.max(...activeDrawingPoints.value.map(p => p.x))
      const maxY = Math.max(...activeDrawingPoints.value.map(p => p.y))

      const newDraw: DrawPdfElement = {
        id: `draw_${Date.now()}`,
        type: 'draw',
        page: props.currentPage,
        x: minX,
        y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        points: [...activeDrawingPoints.value],
        strokeWidth: 2.5,
        color: '#000000'
      }
      emit('add-element', newDraw)
    }

    isDrawingShape.value = false
    currentShapeCoords.value = null
    activeDrawingPoints.value = []
  }
}

// Mulai Drag Elemen
const startElementDrag = (elem: PdfEditorElement, e: MouseEvent) => {
  e.stopPropagation()
  emit('select-element', elem.id)

  isDragging.value = true
  dragElementId.value = elem.id
  dragStartPos.value = getNormalizedPos(e)
  elementStartPos.value = { x: elem.x, y: elem.y }
}

// Mulai Resize Elemen
const startElementResize = (elem: PdfEditorElement, e: MouseEvent) => {
  e.stopPropagation()
  isResizing.value = true
  resizeElementId.value = elem.id
  resizeStartPos.value = getNormalizedPos(e)
  elementStartSize.value = { width: elem.width, height: elem.height }
}

// Keyboard shortcuts (Delete untuk menghapus elemen terpilih)
const handleKeydown = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if ((e.key === 'Delete' || e.key === 'Backspace') && props.selectedElementId) {
    e.preventDefault()
    // Trigger delete event dari luar
  }
}

watch(() => props.currentPage, () => {
  renderPage()
})

watch(() => props.zoom, () => {
  renderPage()
})

watch(() => props.isFitWidth, () => {
  renderPage()
})

watch(() => props.pdfBytes, () => {
  loadPdfDocument()
})

onMounted(() => {
  loadPdfDocument()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel()
    } catch {}
  }
})
</script>

<template>
  <div
    ref="viewportContainerRef"
    class="relative flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center min-h-[70vh] bg-[#07090d] select-none"
    @mousemove="handleOverlayPointerMove"
    @mouseup="handleOverlayPointerUp"
  >
    <!-- Container Halaman PDF + Overlay Elemen -->
    <div
      ref="pageContainerRef"
      class="relative bg-white shadow-2xl transition-transform mx-auto rounded-sm overflow-hidden"
    >
      <!-- Canvas Render PDF.js -->
      <canvas ref="canvasRef" class="block m-0 p-0" />

      <!-- Interactive Overlay Layer -->
      <div
        ref="overlayRef"
        class="absolute inset-0 z-10"
        :class="{
          'cursor-default': selectedTool === 'select',
          'cursor-text': selectedTool === 'text',
          'cursor-crosshair': selectedTool === 'highlight' || selectedTool === 'rect' || selectedTool === 'draw'
        }"
        @mousedown="handleOverlayPointerDown"
      >
        <!-- Temporary Shape Preview saat Dragging Highlight / Kotak -->
        <div
          v-if="isDrawingShape && currentShapeCoords"
          class="absolute pointer-events-none border border-dashed"
          :class="selectedTool === 'highlight' ? 'bg-amber-400/40 border-amber-500' : 'bg-blue-500/20 border-blue-500'"
          :style="{
            left: `${currentShapeCoords.x * currentScale}px`,
            top: `${currentShapeCoords.y * currentScale}px`,
            width: `${currentShapeCoords.width * currentScale}px`,
            height: `${currentShapeCoords.height * currentScale}px`
          }"
        />

        <!-- Temporary SVG Preview saat Freehand Drawing -->
        <svg
          v-if="isDrawingShape && selectedTool === 'draw' && activeDrawingPoints.length > 1"
          class="absolute inset-0 w-full h-full pointer-events-none"
        >
          <polyline
            :points="activeDrawingPoints.map(p => `${p.x * currentScale},${p.y * currentScale}`).join(' ')"
            fill="none"
            stroke="#000000"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- Elemen-Elemen Halaman Aktif -->
        <template v-for="elem in elements.filter(e => e.page === currentPage)" :key="elem.id">
          <!-- Text Element -->
          <div
            v-if="elem.type === 'text'"
            class="pdf-element absolute group select-none transition-shadow"
            :class="selectedElementId === elem.id ? 'ring-2 ring-blue-500 ring-offset-1 rounded' : 'hover:ring-1 hover:ring-blue-400/60'"
            :style="{
              left: `${elem.x * currentScale}px`,
              top: `${elem.y * currentScale}px`,
              minWidth: `${elem.width * currentScale}px`
            }"
            @mousedown="startElementDrag(elem, $event)"
          >
            <input
              type="text"
              :value="(elem as TextPdfElement).text"
              class="w-full bg-transparent border-none focus:outline-none cursor-move px-1 py-0.5"
              :style="{
                fontSize: `${(elem as TextPdfElement).fontSize * currentScale}px`,
                color: (elem as TextPdfElement).color,
                fontWeight: (elem as TextPdfElement).bold ? 'bold' : 'normal',
                fontStyle: (elem as TextPdfElement).italic ? 'italic' : 'normal',
                lineHeight: 1.2
              }"
              @input="emit('update-element', elem.id, { text: ($event.target as HTMLInputElement).value })"
              @mousedown.stop="emit('select-element', elem.id)"
            />
          </div>

          <!-- Highlight Element -->
          <div
            v-else-if="elem.type === 'highlight'"
            class="pdf-element absolute cursor-move group transition-shadow"
            :class="selectedElementId === elem.id ? 'ring-2 ring-amber-500 ring-offset-1' : 'hover:ring-1 hover:ring-amber-400/70'"
            :style="{
              left: `${elem.x * currentScale}px`,
              top: `${elem.y * currentScale}px`,
              width: `${elem.width * currentScale}px`,
              height: `${elem.height * currentScale}px`,
              backgroundColor: (elem as HighlightPdfElement).color,
              opacity: (elem as HighlightPdfElement).opacity
            }"
            @mousedown="startElementDrag(elem, $event)"
          >
            <!-- Resize Handle -->
            <div
              v-if="selectedElementId === elem.id"
              class="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-amber-500 rounded-sm cursor-nwse-resize shadow-md -mr-1 -mb-1"
              @mousedown.stop="startElementResize(elem, $event)"
            />
          </div>

          <!-- Image & Signature Element -->
          <div
            v-else-if="elem.type === 'image' || elem.type === 'signature'"
            class="pdf-element absolute cursor-move group transition-shadow"
            :class="selectedElementId === elem.id ? 'ring-2 ring-purple-500 ring-offset-1 rounded-sm' : 'hover:ring-1 hover:ring-purple-400/70'"
            :style="{
              left: `${elem.x * currentScale}px`,
              top: `${elem.y * currentScale}px`,
              width: `${elem.width * currentScale}px`,
              height: `${elem.height * currentScale}px`
            }"
            @mousedown="startElementDrag(elem, $event)"
          >
            <img
              :src="(elem as ImagePdfElement | SignaturePdfElement).dataUrl"
              class="w-full h-full object-contain pointer-events-none"
            />
            <!-- Resize Handle -->
            <div
              v-if="selectedElementId === elem.id"
              class="resize-handle absolute bottom-0 right-0 w-3.5 h-3.5 bg-purple-600 rounded-sm cursor-nwse-resize shadow-md -mr-1 -mb-1"
              @mousedown.stop="startElementResize(elem, $event)"
            />
          </div>

          <!-- Draw (Freehand) Element -->
          <div
            v-else-if="elem.type === 'draw'"
            class="pdf-element absolute cursor-move group transition-shadow"
            :class="selectedElementId === elem.id ? 'ring-1 ring-blue-500' : ''"
            :style="{
              left: `${elem.x * currentScale}px`,
              top: `${elem.y * currentScale}px`,
              width: `${elem.width * currentScale}px`,
              height: `${elem.height * currentScale}px`
            }"
            @mousedown="startElementDrag(elem, $event)"
          >
            <svg class="w-full h-full overflow-visible pointer-events-none">
              <polyline
                :points="(elem as DrawPdfElement).points.map(p => `${(p.x - elem.x) * currentScale},${(p.y - elem.y) * currentScale}`).join(' ')"
                fill="none"
                :stroke="(elem as DrawPdfElement).color"
                :stroke-width="(elem as DrawPdfElement).strokeWidth * currentScale"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <!-- Rect Element -->
          <div
            v-else-if="elem.type === 'rect'"
            class="pdf-element absolute cursor-move group transition-shadow"
            :class="selectedElementId === elem.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-400/60'"
            :style="{
              left: `${elem.x * currentScale}px`,
              top: `${elem.y * currentScale}px`,
              width: `${elem.width * currentScale}px`,
              height: `${elem.height * currentScale}px`,
              borderWidth: `${(elem as RectPdfElement).strokeWidth * currentScale}px`,
              borderColor: (elem as RectPdfElement).strokeColor,
              borderStyle: 'solid',
              backgroundColor: (elem as RectPdfElement).fillColor || 'transparent'
            }"
            @mousedown="startElementDrag(elem, $event)"
          >
            <!-- Resize Handle -->
            <div
              v-if="selectedElementId === elem.id"
              class="resize-handle absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-sm cursor-nwse-resize shadow-md -mr-1 -mb-1"
              @mousedown.stop="startElementResize(elem, $event)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
