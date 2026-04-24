<template>
  <div
    class="rounded-xl border bg-white p-10 text-center shadow-sm"
    style="border-color: var(--yw-border)"
  >
    <h2 class="text-xl font-semibold text-gray-800">{{ title }}</h2>
    <p class="mt-2 text-sm text-gray-500">{{ subtitle }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title || '页面')
const subtitle = computed(() => route.meta.subtitle || '功能建设中，敬请期待。')
</script>
