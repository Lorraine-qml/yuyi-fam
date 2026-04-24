<template>
  <header class="yw-app-header" :style="{ left: collapsed ? '64px' : '240px' }">
    <div class="header-inner">
      <div class="header-spacer" />

      <div class="header-right">
        <el-input
          ref="searchInputRef"
          v-model="searchKeyword"
          placeholder="搜索菜单、工单、资产…"
          :prefix-icon="Search"
          size="small"
          clearable
          class="global-search hidden md:block"
          @keyup.enter="handleSearch"
        />

        <el-tooltip content="搜索（Ctrl+K）" placement="bottom">
          <el-button
            :icon="Search"
            circle
            size="small"
            class="header-icon-btn md:hidden"
            @click="focusMobileSearch"
          />
        </el-tooltip>

        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-button :icon="Bell" circle size="small" class="header-icon-btn" @click="openNotice" />
        </el-badge>

        <el-tooltip content="帮助" placement="bottom">
          <el-button :icon="QuestionFilled" circle size="small" class="header-icon-btn" @click="openHelp" />
        </el-tooltip>

        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-info">
            <el-avatar
              :size="32"
              src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
            />
            <span class="user-name">管理员</span>
            <el-icon class="text-gray-400"><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="settings">系统设置</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown, Bell, QuestionFilled, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

defineProps({
  collapsed: { type: Boolean, default: false }
})

const router = useRouter()
const searchInputRef = ref(null)
const searchKeyword = ref('')
const unreadCount = ref(3)

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.info('请输入搜索关键词')
    return
  }
  ElMessage.success(`搜索：${searchKeyword.value}`)
}

const focusMobileSearch = () => {
  ElMessage.info('请使用顶部搜索框或加宽窗口')
}

const openNotice = () => {
  ElMessage.info('通知中心（演示）')
}

const openHelp = () => {
  window.open('https://element-plus.org/', '_blank')
}

const handleUserCommand = (command) => {
  if (command === 'logout') {
    ElMessage.success('已退出（演示）')
    return
  }
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'settings') {
    router.push('/system/user')
  }
}

const onGlobalKeydown = (e) => {
  if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    nextTick(() => searchInputRef.value?.focus?.())
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onUnmounted(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<style scoped>
.yw-app-header {
  position: fixed;
  top: 0;
  right: 0;
  height: 56px;
  background: #ffffff;
  border-bottom: 1px solid var(--yw-border);
  z-index: 40;
  transition: left 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.header-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px;
  max-width: 100%;
}

.header-spacer {
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.global-search {
  width: 260px;
}

.global-search :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid var(--yw-border);
  box-shadow: none;
  background-color: #fff;
}

.global-search :deep(.el-input__wrapper:hover) {
  border-color: var(--yw-primary);
}

.global-search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--yw-primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}

.header-icon-btn {
  color: var(--yw-text-secondary);
}

.header-icon-btn:hover {
  color: var(--yw-primary);
  background-color: #f3f4f6 !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}

.user-info:hover {
  background-color: #f3f4f6;
}

.user-name {
  font-size: 14px;
  color: var(--yw-text-primary);
}

@media (max-width: 767px) {
  .user-name {
    display: none;
  }
}
</style>
