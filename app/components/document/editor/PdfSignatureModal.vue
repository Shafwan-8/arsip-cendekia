<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', dataUrl: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const strokeColor = ref('#000000')
const strokeWidth = ref(2.5)
const isDrawing = ref(false)
const hasDrawn = ref(false)

let ctx: CanvasRenderingContext2D | null = null

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set crisp canvas resolution for high-DPI screens
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = strokeColor.value
  ctx.lineWidth = strokeWidth.value
}

const clearCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasDrawn.value = false
}

const getPointerPos = (e: MouseEvent | TouchEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()

  let clientX = 0
  let clientY = 0

  if ('touches' in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else if ('clientX' in e) {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  if (!ctx) return
  isDrawing.value = true
  const pos = getPointerPos(e)
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  ctx.strokeStyle = strokeColor.value
  ctx.lineWidth = strokeWidth.value
}

const draw = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  if (!isDrawing.value || !ctx) return
  const pos = getPointerPos(e)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  hasDrawn.value = true
}

const stopDrawing = () => {
  if (!isDrawing.value || !ctx) return
  ctx.closePath()
  isDrawing.value = false
}

const handleSave = () => {
  const canvas = canvasRef.value
  if (!canvas || !hasDrawn.value) return

  // Potong canvas hanya ke area yang digambar (crop transparent edges)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCtx.drawImage(canvas, 0, 0)
  const dataUrl = tempCanvas.toDataURL('image/png')
  emit('save', dataUrl)
  clearCanvas()
  emit('close')
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initCanvas()
      clearCanvas()
    })
  }
})

onMounted(() => {
  if (props.show) {
    initCanvas()
  }
})
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="bg-[#0e1117] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 class="text-sm font-bold text-white tracking-wide">Buat Tanda Tangan</h3>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          @click="emit('close')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Controls: Pilihan Warna & Tebal Goresan -->
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2">
          <span class="text-slate-400 font-medium">Warna:</span>
          <div class="flex items-center space-x-1.5">
            <button
              type="button"
              class="w-5 h-5 rounded-full border-2 transition-transform"
              :class="strokeColor === '#000000' ? 'border-white scale-110' : 'border-transparent'"
              style="background-color: #000000;"
              @click="strokeColor = '#000000'"
            />
            <button
              type="button"
              class="w-5 h-5 rounded-full border-2 transition-transform"
              :class="strokeColor === '#1d4ed8' ? 'border-white scale-110' : 'border-transparent'"
              style="background-color: #1d4ed8;"
              @click="strokeColor = '#1d4ed8'"
            />
            <button
              type="button"
              class="w-5 h-5 rounded-full border-2 transition-transform"
              :class="strokeColor === '#b91c1c' ? 'border-white scale-110' : 'border-transparent'"
              style="background-color: #b91c1c;"
              @click="strokeColor = '#b91c1c'"
            />
          </div>
        </div>

        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs hover:bg-slate-800 transition-colors"
          @click="clearCanvas"
        >
          Bersihkan
        </button>
      </div>

      <!-- Canvas Area -->
      <div class="relative w-full h-56 bg-white rounded-xl overflow-hidden border border-slate-700/60 shadow-inner flex items-center justify-center cursor-crosshair">
        <canvas
          ref="canvasRef"
          class="w-full h-full block touch-none"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="stopDrawing"
          @touchstart="startDrawing"
          @touchmove="draw"
          @touchend="stopDrawing"
        />
        <div
          v-if="!hasDrawn"
          class="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-xs select-none"
        >
          <span class="opacity-60">Goreskan tanda tangan Anda di sini</span>
        </div>
      </div>

      <!-- Footer Action -->
      <div class="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-slate-800 bg-[#090b0e] hover:bg-slate-900 text-slate-300 text-xs font-semibold transition-colors"
          @click="emit('close')"
        >
          Batal
        </button>
        <button
          type="button"
          :disabled="!hasDrawn"
          class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-1.5"
          @click="handleSave"
        >
          <span>Gunakan Tanda Tangan</span>
        </button>
      </div>
    </div>
  </div>
</template>
