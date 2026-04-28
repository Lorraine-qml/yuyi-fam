<template>
  <header class="yw-app-header" :style="{ left: collapsed ? '64px' : '240px' }">
    <div class="header-inner">
      <div class="header-spacer" />

      <div class="header-right">
        <div class="header-time" title="系统时间">
          {{ dateTimeDisplay }}
        </div>

        <div class="flex items-center gap-1 shrink-0" title="当前项目（切换后全站按项目过滤数据）">
          <span class="text-base leading-none" aria-hidden="true">🌐</span>
          <el-select
            :model-value="currentProjectId"
            size="small"
            class="project-select"
            placeholder="选择项目"
            filterable
            @update:model-value="setCurrentProjectId"
          >
            <el-option
              v-for="p in projectOptions"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </div>

        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-tooltip content="预警消息" placement="bottom">
            <el-button
              :icon="Bell"
              circle
              size="small"
              class="header-icon-btn"
              aria-label="消息中心"
              @click="messageDrawerVisible = true"
            />
          </el-tooltip>
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
  <MessageCenterDrawer v-model="messageDrawerVisible" />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowDown, Bell, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useCurrentProject } from '@/composables/useCurrentProject'
import { unreadCount } from '@/composables/useNotificationCenter'
import MessageCenterDrawer from './MessageCenterDrawer.vue'

defineProps({
  collapsed: { type: Boolean, default: false }
})

const router = useRouter()
const { projectOptions, currentProjectId, setCurrentProjectId } = useCurrentProject()
const messageDrawerVisible = ref(false)

const now = ref(new Date())
let timeTimer = null
const pad2 = (n) => String(n).padStart(2, '0')
const dateTimeDisplay = computed(() => {
  const d = now.value
  const date = `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
  return `${date} ${time}`
})

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

onMounted(() => {
  timeTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => {
  if (timeTimer != null) clearInterval(timeTimer)
})
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
  gap: 16px;
}

.project-select {
  width: 200px;
}

.project-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  border: 1px solid var(--yw-border);
  box-shadow: none;
  background-color: #fff;
}

.project-select :deep(.el-input__inner) {
  color: var(--yw-text-primary);
  font-size: 13px;
}

.project-select :deep(.el-input__wrapper:hover),
.project-select :deep(.el-input__wrapper.is-focus) {
  border-color: var(--yw-primary);
  box-shadow: none;
}

.header-time {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  user-select: none;
  color: #000000;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
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
