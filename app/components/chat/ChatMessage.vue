<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'
import LiteratureCard from './LiteratureCard.vue'

defineProps<{
  message: ChatMessage
}>()
</script>

<template>
  <div
    class="w-full flex"
    :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
  >
    <!-- User Message Bubble (Right) -->
    <div
      v-if="message.role === 'user'"
      class="max-w-[85%] sm:max-w-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg shadow-rose-950/20"
    >
      <p class="text-sm leading-relaxed font-medium whitespace-pre-wrap">
        {{ message.content }}
      </p>
    </div>

    <!-- Assistant Message Bubble (Left) -->
    <div
      v-else
      class="w-full max-w-full sm:max-w-3xl bg-[#11141b] border border-slate-800/90 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xl space-y-4"
    >
      <!-- Assistant Header Indicator -->
      <div class="flex items-center gap-2 text-xs font-semibold text-rose-400 border-b border-slate-800/60 pb-2.5">
        <div class="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span class="tracking-wide">AI Literature Screening</span>
      </div>

      <!-- Narrative Text -->
      <p v-if="message.content" class="text-sm text-slate-200 leading-relaxed">
        {{ message.content }}
      </p>

      <!-- Results: Literature Cards -->
      <div v-if="message.results && message.results.length > 0" class="space-y-3 pt-1">
        <LiteratureCard
          v-for="paper in message.results"
          :key="paper.id"
          :literature="paper"
        />
      </div>
    </div>
  </div>
</template>
