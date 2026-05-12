<template>
  <div>
    <div
      class="rounded-xl border bg-white p-4 shadow-sm mb-4"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-x-4 gap-y-2 m-0" @submit.prevent="applyFilters">
          <el-form-item label="任务名称" class="!mb-0">
            <el-input
              v-model="filters.name"
              placeholder="关键字"
              clearable
              class="!w-40"
              @keyup.enter="applyFilters"
            />
          </el-form-item>
          <el-form-item label="状态" class="!mb-0">
            <el-select v-model="filters.enabled" placeholder="全部" clearable class="!w-28">
              <el-option label="全部" value="" />
              <el-option label="启用" value="enabled" />
              <el-option label="停用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="周期" class="!mb-0">
            <el-select v-model="filters.cycle" placeholder="全部" clearable class="!w-36">
              <el-option label="全部" value="" />
              <el-option v-for="opt in cycleFilterOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="最近执行" class="!mb-0">
            <el-select v-model="filters.lastExec" placeholder="全部" clearable class="!w-36">
              <el-option label="全部" value="" />
              <el-option label="无记录" value="none" />
              <el-option label="成功" value="success" />
              <el-option label="部分成功" value="partial" />
              <el-option label="失败" value="fail" />
            </el-select>
          </el-form-item>
          <el-form-item class="!mb-0">
            <el-button type="primary" @click="applyFilters">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-form-item>
        </el-form>
    </div>
    <div class="yw-list-toolbar mb-4">
      <el-button type="primary" @click="openScheduleCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增任务
      </el-button>
    </div>
    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <el-table :data="filteredSchedules" size="small">
        <el-table-column prop="name" label="任务名称" min-width="156" fixed="left" />
        <el-table-column label="推送" min-width="188" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatSchedulePush(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="cycleLabel" label="周期" width="92" />
        <el-table-column prop="runTime" label="执行时间" width="88" />
        <el-table-column prop="lastRunAt" label="上次执行" min-width="138" />
        <el-table-column label="状态" width="82">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近执行结果" min-width="218" show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="getLatestScheduleLog(row.id)">
              <el-button
                link
                type="primary"
                class="!h-auto !p-0 !whitespace-normal !text-left inline-flex items-start"
                @click="openScheduleExecutionDetail(row)"
              >
                {{ formatLastResultSummary(getLatestScheduleLog(row.id)) }}
              </el-button>
            </template>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="352" fixed="right">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              class="mr-2 align-middle"
              inline-prompt
              active-text="启"
              inactive-text="停"
              @change="onScheduleToggle(row)"
            />
            <el-button link type="primary" @click="openScheduleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="runScheduleOnce(row)">执行</el-button>
            <el-button link type="primary" @click="openHistory(row)">历史</el-button>
            <el-button link type="danger" @click="removeSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-drawer v-model="historyVisible" :title="historyTitle" size="840px" destroy-on-close>
      <template v-if="historyRow">
        <p class="text-xs text-gray-500 mb-3">按时间倒序，展示本项目内该任务的执行日志（前端演示持久化）。</p>
        <el-table :data="historyRows" stripe border size="small" empty-text="暂无记录">
          <el-table-column prop="execute_time" label="执行时间" min-width="164" />
          <el-table-column label="结果" width="118">
            <template #default="{ row: lg }">
              {{ execShortResult(lg) }}
            </template>
          </el-table-column>
          <el-table-column label="报告大小" width="100">
            <template #default="{ row: lg }">
              {{ formatFileKb(lg.file_size_kb) }}
            </template>
          </el-table-column>
          <el-table-column prop="push_channels" label="推送渠道" min-width="120" show-overflow-tooltip />
          <el-table-column prop="receivers" label="接收人" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="72" fixed="right">
            <template #default="{ row: lg }">
              <el-button link type="primary" @click="showHistoryLogDetail(lg)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { formatLastResultSummary, formatScheduleExecutionDetail } from '@/data/scheduleExecutionMock'
import { getNotificationMethod } from '@/data/notificationMethodMock'
import { useRiskReportShared } from './riskReportShared'

function formatSchedulePush(row) {
  const ids = row.notifyMethodIds
  if (!Array.isArray(ids) || !ids.length) {
    const parts = []
    if (row.channelEmail) parts.push('邮件')
    if (row.channelDing) parts.push('钉钉')
    if (row.channelWecom) parts.push('企微')
    return parts.length ? parts.join('、') : '—'
  }
  const labels = ids
    .map((id) => getNotificationMethod(id)?.name || '')
    .filter(Boolean)
  return labels.length ? labels.join('、') : '—'
}

const {
  schedules,
  scheduleExecutionLogs,
  openScheduleCreate,
  openScheduleEdit,
  removeSchedule,
  runScheduleOnce,
  getLatestScheduleLog,
  openScheduleExecutionDetail,
  onScheduleToggle
} = useRiskReportShared()

const filters = ref({
  name: '',
  enabled: '',
  cycle: '',
  lastExec: ''
})

const cycleFilterOptions = [
  { label: '每日', value: 'daily' },
  { label: '每周一', value: 'weekly_mon' },
  { label: '每月 1 日', value: 'monthly_1' },
  { label: '自定义 Cron', value: 'cron' }
]

function applyFilters() {
  /* 列表使用 filteredSchedules 计算属性，条件变更即生效；保留按钮语义 */
}

function resetFilters() {
  filters.value = { name: '', enabled: '', cycle: '', lastExec: '' }
}

const filteredSchedules = computed(() => {
  let list = schedules.value
  const nameKw = filters.value.name.trim()
  if (nameKw) {
    list = list.filter((r) => (r.name || '').includes(nameKw))
  }
  const en = filters.value.enabled
  if (en === 'enabled') list = list.filter((r) => r.enabled)
  else if (en === 'disabled') list = list.filter((r) => !r.enabled)
  const cy = filters.value.cycle
  if (cy) list = list.filter((r) => r.cycle === cy)
  const le = filters.value.lastExec
  if (le === 'none') {
    list = list.filter((r) => !getLatestScheduleLog(r.id))
  } else if (le) {
    list = list.filter((r) => getLatestScheduleLog(r.id)?.status === le)
  }
  return list
})

const historyVisible = ref(false)
const historyRow = ref(null)

const historyTitle = computed(() => {
  const n = historyRow.value?.name
  return n ? `执行历史 - ${n}` : '执行历史'
})

const historyRows = computed(() => {
  const id = historyRow.value?.id
  if (!id) return []
  return scheduleExecutionLogs.value
    .filter((l) => l.schedule_id === id)
    .sort((a, b) => String(b.execute_time).localeCompare(String(a.execute_time)))
})

function openHistory(row) {
  historyRow.value = row
  historyVisible.value = true
}

function execShortResult(log) {
  if (!log) return '—'
  if (log.status === 'success') return '✅ 成功'
  if (log.status === 'partial') return '⚠️ 部分成功'
  return '❌ 失败'
}

function formatFileKb(kb) {
  if (kb == null || kb === '') return '—'
  const n = Number(kb)
  if (!Number.isFinite(n)) return '—'
  if (n >= 1024) return `${(n / 1024).toFixed(1)} MB`
  return `${Math.round(n)} KB`
}

async function showHistoryLogDetail(log) {
  const title = `执行详情 · ${log.task_name || historyRow.value?.name || ''}`
  try {
    await ElMessageBox.alert(formatScheduleExecutionDetail(log), title, {
      confirmButtonText: '关闭',
      customStyle: { maxWidth: '560px', width: '560px' }
    })
  } catch {
    /* dismiss */
  }
}
</script>
