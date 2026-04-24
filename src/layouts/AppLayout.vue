<template>
  <div class="yw-app-layout min-h-screen bg-gray-50">
    <LeftMenu v-model:collapsed="menuCollapsed" />
    <AppHeader :collapsed="menuCollapsed" />

    <div class="app-main" :class="{ 'is-collapsed': menuCollapsed }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LeftMenu from '@/components/layout/LeftMenu.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const menuCollapsed = ref(false)
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
