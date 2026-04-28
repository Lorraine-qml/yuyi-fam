<template>
  <el-drawer
    :model-value="store.visible"
    :size="drawerSize"
    direction="rtl"
    destroy-on-close
    append-to-body
    :close-on-click-modal="true"
    class="event-detail-drawer"
    @update:model-value="onDrawerUpdate"
  >
    <template #header>
      <div class="flex flex-wrap items-center gap-2 pr-1">
        <h2 class="m-0 text-base font-semibold text-gray-900">
          事件详情 · {{ displayCode }}
        </h2>
        <el-tag
          v-if="ev"
          :type="sourceTagType(ev.source)"
          effect="light"
          class="!border-0"
          :class="sourceTagClass(ev.source)"
        >
          <span v-if="ev.source === 'rule'">⚡</span>
          {{ eventSourceLabel(ev.source) }}
        </el-tag>
      </div>
    </template>

    <div v-if="ev" class="event-detail-inner flex flex-col min-h-0 h-full">
      <div class="event-detail-scroll flex-1 overflow-y-auto space-y-4 pb-2">
        <el-card shadow="never" class="event-detail-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">基本信息</span>
          </template>
          <el-descriptions :column="2" border size="small" class="event-desc">
            <el-descriptions-item label="事件编号">
              {{ displayCode }}
            </el-descriptions-item>
            <el-descriptions-item label="来源">
              <el-tag
                :type="sourceTagType(ev.source)"
                effect="light"
                size="small"
                class="!border-0"
                :class="sourceTagClass(ev.source)"
              >
                <span v-if="ev.source === 'rule'">⚡</span>
                {{ eventSourceLabel(ev.source) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="事件分类">{{ ev.categoryLabel }}</el-descriptions-item>
            <el-descriptions-item label="事件等级">
              <el-tag :type="levelTagType(ev.level)" size="small">{{ ev.levelLabel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="事件名称"  :span="2">{{ ev.name }}</el-descriptions-item>
            <el-descriptions-item label="事件内容" :span="2">
              {{ ev.contentText || ev.conditionText || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="空间位置">{{ ev.location }}</el-descriptions-item>
            <el-descriptions-item label="发生时间">{{ ev.startTime }}</el-descriptions-item>
            <el-descriptions-item label="事件状态">{{ ev.statusLabel }}</el-descriptions-item>
            <el-descriptions-item label="当前责任人">
              {{ assigneeDisplay }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card
          v-if="ev.source === 'rule' && ev.ruleName"
          shadow="never"
          class="event-detail-card event-detail-card--rule"
        >
          <template #header>
            <span class="text-sm font-semibold text-indigo-900">触发规则（仅规则来源）</span>
          </template>
          <ul class="text-sm text-gray-800 space-y-2 m-0 pl-0 list-none">
            <li class="flex gap-2">
              <span class="text-gray-500 shrink-0 w-24">规则名称</span>
              <span class="font-medium">{{ ev.ruleName }}{{ ev.ruleVersion ? ` (${ev.ruleVersion})` : '' }}</span>
            </li>
            <li v-if="ev.metricName" class="flex gap-2">
              <span class="text-gray-500 shrink-0 w-24">关联指标</span>
              <span>
                {{ ev.metricName }}
                <span v-if="ev.metricCode" class="text-gray-500">（{{ ev.metricCode }}）</span>
              </span>
            </li>
            <li v-if="ev.conditionText" class="flex gap-2">
              <span class="text-gray-500 shrink-0 w-24">触发条件</span>
              <span>{{ ev.conditionText }}</span>
            </li>
            <li v-if="ev.ruleExtra" class="flex gap-2">
              <span class="text-gray-500 shrink-0 w-24">说明</span>
              <span>{{ ev.ruleExtra }}</span>
            </li>
          </ul>
          <el-button type="primary" link class="!mt-3 !px-0" @click="openRuleDetail">查看规则详情</el-button>
        </el-card>

        <el-card v-if="ev.linkedWorkOrder" shadow="never" class="event-detail-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">关联工单</span>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="工单编号">{{ ev.linkedWorkOrder.id }}</el-descriptions-item>
            <el-descriptions-item label="工单状态">{{ ev.linkedWorkOrder.statusLabel }}</el-descriptions-item>
            <el-descriptions-item label="责任人" :span="2">{{ ev.linkedWorkOrder.assigneeName }}</el-descriptions-item>
          </el-descriptions>
          <el-button type="primary" size="small" class="mt-3" @click="openLinkedWorkOrder">查看工单</el-button>
        </el-card>

        <el-card shadow="never" class="event-detail-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">推送记录</span>
          </template>
          <ul v-if="pushLogList.length" class="m-0 pl-0 list-none space-y-2 text-sm text-gray-700">
            <li v-for="(log, idx) in pushLogList" :key="idx">
              <span class="text-gray-400 text-xs mr-2">{{ log.time }}</span>
              {{ log.text }}
            </li>
          </ul>
          <p v-else class="m-0 text-sm text-gray-500">暂无推送记录</p>
        </el-card>
      </div>

      <div
        class="event-detail-footer flex justify-end pt-3 mt-1 border-t flex-shrink-0"
        style="border-color: var(--yw-border, #e5e7eb)"
      >
        <el-button @click="store.close()">关闭</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { eventSourceLabel } from '@/constants/eventSource'
import { getRealtimeEventById, buildPlaceholderEvent } from '@/data/realtimeEventsMock'
import { useEventDetailStore } from '@/stores/eventDetail'

const router = useRouter()
const store = useEventDetailStore()
const { visible, eventId } = storeToRefs(store)

const drawerSize = ref('520px')

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 768px)')
  const apply = () => {
    drawerSize.value = mq.matches ? '100%' : '520px'
  }
  apply()
  mq.addEventListener('change', apply)
  onBeforeUnmount(() => mq.removeEventListener('change', apply))
}

const ev = computed(() => {
  const id = eventId.value
  if (!id || !visible.value) return null
  return getRealtimeEventById(id) || buildPlaceholderEvent(id)
})

const displayCode = computed(() => {
  const e = ev.value
  if (!e) return '—'
  return e.displayCode || String(e.id || '').replace(/^evt-/i, 'EVT-').toUpperCase()
})

const assigneeDisplay = computed(() => {
  const e = ev.value
  if (!e) return '—'
  const wo = e.linkedWorkOrder
  if (wo?.assigneeName && wo?.id) {
    return `${e.currentAssigneeName || wo.assigneeName}（关联工单 ${wo.id}）`
  }
  return e.currentAssigneeName || '—'
})

const pushLogList = computed(() => ev.value?.pushLogs || [])

function onDrawerUpdate(v) {
  if (!v) store.close()
}

function levelTagType(l) {
  if (l === 'high') return 'danger'
  if (l === 'medium') return 'warning'
  return 'info'
}

function sourceTagType(s) {
  if (s === 'rule') return 'primary'
  if (s === 'third_party') return 'primary'
  return 'info'
}

function sourceTagClass(s) {
  if (s === 'rule') return 'bg-indigo-100 !text-indigo-800'
  if (s === 'third_party') return 'bg-blue-50 !text-blue-800'
  return 'bg-gray-100 !text-gray-700'
}

function openRuleDetail() {
  const id = ev.value?.ruleId
  if (id) {
    router.push({ name: 'RiskRules', query: { focusRule: id } }).catch(() => {})
    store.close()
  } else {
    ElMessage.info('当前事件无规则 ID（演示）')
  }
}

function openLinkedWorkOrder() {
  const wo = ev.value?.linkedWorkOrder
  if (!wo?.id) {
    ElMessage.info('无关联工单')
    return
  }
  router
    .push({ path: '/security/workbench/repair', query: { focusWo: wo.id } })
    .catch(() => {})
  store.close()
}
</script>

<style>
.event-detail-drawer .el-drawer__header {
  margin-bottom: 8px;
  padding: 12px 16px 0;
  border-bottom: 1px solid #e5e7eb;
}
.event-detail-drawer .el-drawer__body {
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 72px);
}
.event-detail-inner {
  min-height: 0;
}
.event-detail-card .el-card__header {
  padding: 10px 14px;
  border-bottom: 1px solid var(--yw-border, #e5e7eb);
}
.event-detail-card .el-card__body {
  padding: 14px 16px;
}
.event-detail-card--rule .el-card__body {
  background: rgba(238, 242, 255, 0.5);
}
.event-desc .el-descriptions__label {
  width: 100px;
}
</style>
