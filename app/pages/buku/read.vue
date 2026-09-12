<script setup lang="ts">
import { documentCategoryConfig } from '~/utils/document'

const config = documentCategoryConfig.buku
const route = useRoute()
const docTitle = (route.query.title as string) || ''

useHead({
  title: `${docTitle} - Pembaca PDF Arsip Cendekia`
})
</script>

<template>
  <DocumentReadPage :config="config" />
</template>
