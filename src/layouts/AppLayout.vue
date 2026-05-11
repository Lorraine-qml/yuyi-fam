<template>
  <div class="yw-app-layout min-h-screen bg-gray-50">
    <LeftMenu v-model:collapsed="menuCollapsed" />
    <AppHeader :collapsed="menuCollapsed" />

    <div class="app-main" :class="{ 'is-collapsed': menuCollapsed }">
      <el-alert
        v-if="routeViewError"
        type="error"
        class="mb-3"
        :closable="true"
        show-icon
        :title="routeViewError"
        @close="routeViewError = null"
      />
      <router-view v-slot="{ Component }">
        <component :is="Component" v-if="Component" :key="route.fullPath" />
      </router-view>
    </div>

    <EventDetailDrawer />
  </div>
</template>

<script setup>
import { onErrorCaptured, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LeftMenu from '@/components/layout/LeftMenu.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import EventDetailDrawer from '@/components/event/EventDetailDrawer.vue'
import { startNotificationHub } from '@/composables/useNotificationCenter'

const route = useRoute()
const menuCollapsed = ref(false)
const routeViewError = ref(null)

onErrorCaptured((err) => {
  routeViewError.value = err?.message != null ? String(err.message) : String(err)
  console.error('[route-view]', err)
  return false
})

watch(
  () => route.fullPath,
  () => {
    routeViewError.value = null
  }
)

onMounted(() => {
  startNotificationHub()
})
</script>

<style scoped>
.app-main {
  margin-left: 240px;
  margin-top: 56px;
  padding: 24px;
  min-height: calc(100vh - 56px);
  transition: margin-left 0.3s cubic-bezier(0.2, 0, 0, 1);
  box-sizing: border-box;
}

.app-main.is-collapsed {
  margin-left: 64px;
}

</style>
