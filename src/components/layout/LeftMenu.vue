<template>
  <aside class="yw-left-menu" :class="{ 'is-collapse': collapsed }">
    <div class="menu-header">
      <div v-if="!collapsed" class="logo-area">
        <div class="logo-icon">禹</div>
        <span class="logo-text">禹翼机管局平台</span>
      </div>
      <el-tooltip v-else content="禹翼机管局平台" placement="right">
        <div class="logo-icon logo-icon--solo">禹</div>
      </el-tooltip>
      <el-button
        :icon="collapsed ? Expand : Fold"
        text
        size="small"
        class="collapse-btn"
        aria-label="折叠菜单"
        @click="toggleCollapse"
      />
    </div>

    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :key="menuRenderKey"
        :default-active="route.path"
        :default-openeds="defaultOpeneds"
        :collapse="collapsed"
        :collapse-transition="false"
        :unique-opened="false"
        class="yw-el-menu"
        background-color="#FFFFFF"
        text-color="#5B6871"
        active-text-color="#4F46E5"
        @select="handleMenuSelect"
      >
        <template v-for="item in menuList" :key="item.id">
          <el-menu-item
            v-if="!item.children || item.children.length === 0"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.name }}</template>
          </el-menu-item>

          <el-sub-menu v-else :index="item.id">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </template>
            <template v-for="child in item.children" :key="child.id">
              <el-sub-menu v-if="child.children?.length" :index="child.id">
                <template #title>
                  <el-icon><component :is="child.icon" /></el-icon>
                  <span>{{ child.name }}</span>
                </template>
                <el-menu-item
                  v-for="sub in child.children"
                  :key="sub.id"
                  :index="sub.path"
                >
                  <el-icon><component :is="sub.icon" /></el-icon>
                  <template #title>{{ sub.name }}</template>
                </el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="child.path">
                <el-icon><component :is="child.icon" /></el-icon>
                <template #title>{{ child.name }}</template>
              </el-menu-item>
            </template>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>

    <div v-if="!collapsed" class="menu-footer">
      <span class="text-xs" style="color: var(--yw-text-placeholder)">版本 v2.0.0</span>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Box,
  Clock,
  DataAnalysis,
  CircleCheck,
  FolderOpened,
  Promotion,
  TrendCharts,
  Document,
  Expand,
  Fold,
  House,
  Key,
  Lightning,
  List,
  Lock,
  Message,
  Monitor,
  OfficeBuilding,
  Setting,
  Tickets,
  User,
  View,
  Warning
} from '@element-plus/icons-vue'

const collapsed = defineModel('collapsed', { type: Boolean, default: false })

const route = useRoute()
const router = useRouter()

const menuList = [
  { id: 'dashboard', name: '首页', path: '/dashboard', icon: House, children: [] },
  { id: 'asset', name: '资产管理', path: '/asset', icon: Box, children: [] },
  { id: 'property', name: '物业管理', path: '/property', icon: OfficeBuilding, children: [] },
  { id: 'operation', name: '运营管理', path: '/operation', icon: DataAnalysis, children: [] },
  { id: 'energy', name: '能源管理', path: '/energy', icon: Lightning, children: [] },
  {
    id: 'security',
    name: '安全管理',
    icon: Lock,
    children: [
      {
        id: 'security-event',
        name: '事件管理',
        icon: List,
        children: [
          { id: 'sec-evt-rt', name: '实时事件', path: '/security/events/realtime', icon: Monitor },
          { id: 'sec-evt-push', name: '事件推送配置', path: '/security/events/push-config', icon: Document },
          { id: 'sec-evt-ntf', name: '通知方式配置', path: '/security/events/notify-method', icon: Message }
        ]
      },
      {
        id: 'security-workbench',
        name: '事件工作台',
        icon: List,
        children: [
          { id: 'sec-wb-repair', name: '报修工单', path: '/security/workbench/repair', icon: Tickets },
          { id: 'sec-wb-todo', name: '我的待办', path: '/security/workbench/todo', icon: List },
          { id: 'sec-wb-initiated', name: '我发起的', path: '/security/workbench/initiated', icon: Promotion },
          { id: 'sec-wb-done', name: '我的已办', path: '/security/workbench/done', icon: CircleCheck },
          { id: 'sec-wb-closed', name: '办结事宜', path: '/security/workbench/closed', icon: Document }
        ]
      }
    ]
  },
  {
    id: 'risk',
    name: '风险管理',
    icon: Warning,
    children: [
      { id: 'risk-dashboard', name: '风险看板', path: '/risk/dashboard', icon: View },
      { id: 'risk-metrics', name: '风险指标', path: '/risk/metrics', icon: TrendCharts },
      { id: 'risk-rules', name: '风险规则', path: '/risk/rules', icon: Setting },
      {
        id: 'risk-report',
        name: '风险报告',
        icon: Document,
        children: [
          { id: 'risk-report-center', name: '报告中心', path: '/risk/report/center', icon: Document },
          { id: 'risk-report-templates', name: '模板管理', path: '/risk/report/templates', icon: FolderOpened },
          { id: 'risk-report-schedules', name: '定时任务', path: '/risk/report/schedules', icon: Clock }
        ]
      },
      { id: 'risk-trial-logs', name: '试运行日志', path: '/risk/trial-logs', icon: List }
    ]
  },
  {
    id: 'system',
    name: '系统设置',
    icon: Setting,
    children: [
      { id: 'user-mgmt', name: '用户管理', path: '/system/user', icon: User },
      { id: 'role-mgmt', name: '权限管理', path: '/system/role', icon: Key },
      { id: 'log-mgmt', name: '操作日志', path: '/system/log', icon: Document }
    ]
  }
]

const defaultOpeneds = computed(() => {
  const open = []
  if (route.path.startsWith('/risk')) open.push('risk')
  if (route.path.startsWith('/risk/report')) open.push('risk-report')
  if (route.path.startsWith('/security')) {
    open.push('security')
    if (route.path.startsWith('/security/events') || route.path === '/security') {
      open.push('security-event')
    }
    if (route.path.startsWith('/security/workbench')) {
      open.push('security-workbench')
    }
  }
  if (route.path.startsWith('/system')) open.push('system')
  return open
})

const menuRenderKey = computed(
  () => `${collapsed.value ? 'c' : 'e'}-${defaultOpeneds.value.join('|')}`
)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function handleMenuSelect(index) {
  if (typeof index === 'string' && index.startsWith('/')) {
    router.push(index)
  }
}
</script>

<style scoped>
.yw-left-menu {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 240px;
  background-color: #ffffff;
  border-right: 1px solid var(--yw-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.2, 0, 0, 1);
  z-index: 50;
}

.yw-left-menu.is-collapse {
  width: 64px;
}

.menu-header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
  border-bottom: 1px solid var(--yw-border);
  flex-shrink: 0;
  gap: 8px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.logo-icon--solo {
  margin: 0 auto;
}

.logo-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--yw-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collapse-btn {
  color: #9ca3af;
  flex-shrink: 0;
}

.collapse-btn:hover {
  color: var(--yw-primary);
  background-color: #f3f4f6;
}

.menu-scrollbar {
  flex: 1;
  min-height: 0;
  padding: 12px 8px;
}

.menu-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--yw-border);
  text-align: center;
  flex-shrink: 0;
}

:deep(.yw-el-menu) {
  border-right: none;
  background-color: transparent;
}

:deep(.yw-el-menu .el-menu-item) {
  height: 40px;
  line-height: 40px;
  margin: 4px 0;
  border-radius: 8px;
  color: var(--yw-text-secondary);
  border-left: none;
  border-right: 3px solid transparent;
}

:deep(.yw-el-menu .el-menu-item:hover) {
  background-color: #f3f4f6 !important;
  color: var(--yw-primary) !important;
}

:deep(.yw-el-menu .el-menu-item:hover .el-icon) {
  color: var(--yw-primary);
}

:deep(.yw-el-menu .el-menu-item.is-active) {
  background-color: var(--yw-primary-bg) !important;
  color: var(--yw-primary) !important;
  font-weight: 500;
  border-right: 3px solid var(--yw-primary);
}

:deep(.yw-el-menu .el-menu-item.is-active .el-icon) {
  color: var(--yw-primary);
}

:deep(.yw-el-menu .el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  margin: 4px 0;
  border-radius: 8px;
  color: var(--yw-text-secondary);
}

:deep(.yw-el-menu .el-sub-menu__title:hover) {
  background-color: #f3f4f6 !important;
  color: var(--yw-primary) !important;
}

:deep(.yw-el-menu .el-sub-menu__title:hover .el-icon) {
  color: var(--yw-primary);
}

:deep(.yw-el-menu .el-sub-menu.is-opened > .el-sub-menu__title) {
  color: var(--yw-text-primary);
}

:deep(.yw-el-menu .el-sub-menu .el-menu-item) {
  min-width: auto;
}

.yw-left-menu.is-collapse :deep(.yw-el-menu--collapse .el-menu-item .el-icon) {
  margin-right: 0;
}
</style>
