<script setup lang="ts">
import { documentCategoryConfig } from '~/utils/document'
import DocumentEditPage from '~/components/document/DocumentEditPage.vue'

const config = documentCategoryConfig.jurnal
</script>

<template>
  <DocumentEditPage :config="config" />
</template>
