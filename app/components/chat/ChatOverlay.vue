<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useChatSearchStore } from '~/stores/chatSearch'
import { useChatSearch } from '~/composables/useChatSearch'
import ChatHeader from './ChatHeader.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'

const route = useRoute()
const chatStore = useChatSearchStore()
const { searchLiterature } = useChatSearch()

const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null)

// Kunci scroll body saat modal terbuka
const updateBodyScroll = (isOpen: boolean) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

watch(
  () => chatStore.isOpen,
  (isOpen) => {
    updateBodyScroll(isOpen)
  },
  { immediate: true }
)

// Tutup dengan tombol Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && chatStore.isOpen) {
    chatStore.close()
  }
}

// Pastikan cleanup saat unmount atau navigasi route
watch(
  () => route.fullPath,
  () => {
    // Ketika user pindah halaman, pastikan scroll lock terlepas jika chat ditutup
    if (!chatStore.isOpen) {
      updateBodyScroll(false)
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  updateBodyScroll(false)
})

const handleSelectSuggestion = (prompt: string) => {
  if (chatInputRef.value) {
    chatInputRef.value.setInput(prompt)
  }
  searchLiterature(prompt)
}

const handleSendMessage = (query: string) => {
  searchLiterature(query)
}
</script>

<template>
  <Teleport to="body">
    <!-- Clickable backdrop (Tanpa backdrop-blur sesuai spesifikasi) -->
    <transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="chatStore.isOpen"
        class="fixed inset-0 z-40 bg-black/25"
        @click="chatStore.close"
        aria-hidden="true"
      ></div>
    </transition>

    <!-- Floating Chat Panel (Sesuai Konsep Visual) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-3 lg:translate-y-0 lg:translate-x-4 scale-[0.99]"
      enter-to-class="opacity-100 translate-y-0 lg:translate-x-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 lg:translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-y-3 lg:translate-y-0 lg:translate-x-4 scale-[0.99]"
    >
      <section
        v-if="chatStore.isOpen"
        class="fixed top-20 right-3 sm:right-6 lg:right-8 bottom-5 z-50 h-[calc(100dvh-6.5rem)] w-[calc(100vw-1.5rem)] sm:w-[580px] md:w-[720px] lg:w-[calc(100vw-18.5rem-2rem)] max-w-6xl bg-[#12151c] border border-slate-800/90 rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-label="Panel Pencarian AI"
      >
        <!-- Header Panel -->
        <ChatHeader />

        <!-- Messages Area -->
        <ChatMessageList @select-suggestion="handleSelectSuggestion" />

        <!-- Input Box Area -->
        <ChatInput
          ref="chatInputRef"
          @submit="handleSendMessage"
        />
      </section>
    </transition>
  </Teleport>
</template>

<style scoped>
:deep(.chat-scrollbar)::-webkit-scrollbar,
.chat-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-track,
.chat-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-thumb,
.chat-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.45);
  border-radius: 9999px;
  transition: background-color 0.2s ease;
}

:deep(.chat-scrollbar)::-webkit-scrollbar-thumb:hover,
.chat-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(244, 63, 94, 0.65);
}

:deep(.chat-scrollbar),
.chat-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(71, 85, 105, 0.45) transparent;
}
</style>
