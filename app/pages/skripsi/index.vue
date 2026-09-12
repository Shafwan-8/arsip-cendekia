<script setup lang="ts">
import { documentCategoryConfig } from '~/utils/document'

const config = documentCategoryConfig.skripsi

useHead({
  title: config.pageTitle
})
</script>

<template>
  <DocumentPage :config="config" />
</template>