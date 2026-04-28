<template>
  <div class="sr-only" aria-hidden="true">正在打开事件详情…</div>
</template>

<script setup>
import { nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventDetailStore } from '@/stores/eventDetail'

const route = useRoute()
const router = useRouter()
const store = useEventDetailStore()

onMounted(async () => {
  const id = route.params.id ? decodeURIComponent(String(route.params.id)) : ''
  if (id) {
    store.openById(id)
    await nextTick()
  }
  router.replace({ name: 'SecurityRealtimeEvents' })
})
</script>
