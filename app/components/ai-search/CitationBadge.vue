<script setup lang="ts">
import { useAiSearchStore } from '~/stores/useAiSearchStore'

const props = defineProps<{
  index: number
}>()

const store = useAiSearchStore()

function handleClick() {
  store.setActiveCitation(props.index)

  const card = document.querySelector(`[data-reference-index="${props.index}"]`)
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}
</script>

<template>
  <button
    type="button"
    @click="handleClick"
    :class="[
      'inline-flex items-center justify-center font-bold font-mono text-[10px] sm:text-xs px-1.5 py-0.5 mx-0.5 rounded-md cursor-pointer transition-all duration-200 border align-super',
      store.activeCitation === index
        ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/50 scale-110 shadow-sm shadow-rose-950/40'
        : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500 hover:text-white hover:border-rose-400'
    ]"
    :aria-label="`Rujukan literatur nomor ${index}`"
    :title="`Klik untuk melihat literatur [${index}]`"
  >
    [{{ index }}]
  </button>
</template>
