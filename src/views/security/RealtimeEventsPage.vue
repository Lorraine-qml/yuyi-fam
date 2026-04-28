<template>
  <div class="sec-realtime-page space-y-4">
    <h1 class="text-xl font-bold text-gray-800">实时事件</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="k in kpi"
        :key="k.key"
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <p class="text-sm text-gray-500">{{ k.label }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{{ k.value }}</p>
      </div>
    </div>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-3" @submit.prevent>
        <el-form-item label="事件分类" class="!mb-0">
          <el-select v-model="filters.category" placeholder="全部" clearable class="!w-36" size="default">
            <el-option label="全部" value="" />
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件等级" class="!mb-0">
          <el-select v-model="filters.level" placeholder="全部" clearable class="!w-28">
            <el-option label="全部" value="" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源" class="!mb-0">
          <el-select v-model="filters.source" placeholder="全部" clearable class="!w-36">
            <el-option
              v-for="o in sourceOptions"
              :key="o.value || 'all'"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-select v-model="filters.status" placeholder="全部" class="!w-28">
            <el-option label="全部" value="all" />
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已闭环" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间" class="!mb-0">
          <el-select v-model="filters.timeRange" class="!w-32">
            <el-option label="不限" value="" />
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
          </el-select>
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div
      class="rounded-xl border bg-white p-0 shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <div class="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-b" style="border-color: var(--yw-border)">
        <el-button :icon="Download" @click="ElMessage.info('导出（演示）')">导出</el-button>
        <el-button :icon="Refresh" @click="onSearch">刷新</el-button>
      </div>

      <el-table
        :data="pagedRows"
        border
        stripe
        class="!border-0"
        style="--el-table-border-color: var(--yw-border)"
      >
        <el-table-column type="index" label="序号" width="58" align="center" />
        <el-table-column prop="categoryLabel" label="事件分类" min-width="96" />
        <el-table-column label="来源" min-width="120">
          <template #default="{ row }">
            <el-tag
              :type="row.source === 'rule' ? 'primary' : row.source === 'third_party' ? 'primary' : 'info'"
              effect="light"
              size="small"
              class="!border-0"
              :class="sourceRowClass(row.source)"
            >
              <span v-if="row.source === 'rule'" class="mr-0.5">⚡</span>
              {{ eventSourceLabel(row.source) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="事件名称" min-width="168" show-overflow-tooltip />
        <el-table-column label="等级" width="72" align="center">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" size="small">{{ row.levelLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusLabel" label="状态" width="88" />
        <el-table-column label="发生时间" width="100" align="center">
          <template #default="{ row }">
            {{ formatOccurredTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="128" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="goWorkOrder(row)">工单</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4 border-t" style="border-color: var(--yw-border)">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { EVENT_SOURCE_OPTIONS, eventSourceLabel } from '@/constants/eventSource'
import { REALTIME_EVENTS } from '@/data/realtimeEventsMock'
import { useEventDetailStore } from '@/stores/eventDetail'

const router = useRouter()
const sourceOptions = EVENT_SOURCE_OPTIONS

const eventDetailStore = useEventDetailStore()

const kpi = [
  { key: 'total', label: '事件总数', value: 61 },
  { key: 'pending', label: '待处理', value: 35 },
  { key: 'proc', label: '处理中', value: 14 },
  { key: 'closed', label: '已闭环', value: 12 }
]

/** 演示锚点：与 mock 数据时间线一致，用于「最近 N 天」筛选 */
const DEMO_ANCHOR_END = new Date('2026-04-28T23:59:59')

const categoryOptions = [
  { value: '门禁', label: '门禁' },
  { value: '监控', label: '监控' },
  { value: '消防', label: '消防' },
  { value: '能耗异常', label: '能耗异常' },
  { value: '电梯', label: '电梯' },
  { value: '食堂', label: '食堂' },
  { value: '环境', label: '环境' }
]

const filters = ref({
  category: '',
  level: '',
  source: '',
  status: 'all',
  timeRange: ''
})
const page = ref(1)
const pageSize = ref(10)

function levelTagType(l) {
  if (l === 'high') return 'danger'
  if (l === 'medium') return 'warning'
  return 'info'
}

function sourceRowClass(source) {
  if (source === 'rule') return 'bg-indigo-100 !text-indigo-800'
  if (source === 'third_party') return 'bg-blue-50 !text-blue-800'
  return 'bg-slate-100 !text-slate-700'
}

function inDemoTimeRange(iso, rangeKey) {
  if (!rangeKey) return true
  const t = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(t.getTime())) return true
  const days = rangeKey === '7d' ? 7 : 30
  const start = new Date(DEMO_ANCHOR_END)
  start.setDate(start.getDate() - days)
  return t >= start && t <= DEMO_ANCHOR_END
}

function formatOccurredTime(iso) {
  if (!iso || iso === '—') return '—'
  const d = new Date(iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const filtered = computed(() => {
  return REALTIME_EVENTS.filter((r) => {
    if (filters.value.status !== 'all' && r.status !== filters.value.status) return false
    if (filters.value.level && r.level !== filters.value.level) return false
    if (filters.value.source && r.source !== filters.value.source) return false
    if (filters.value.category && r.categoryLabel !== filters.value.category) return false
    if (!inDemoTimeRange(r.startTime, filters.value.timeRange)) return false
    return true
  })
})

const total = computed(() => filtered.value.length)
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function openDetail(row) {
  eventDetailStore.openById(row.id)
}

function goWorkOrder(row) {
  const wo = row.linkedWorkOrder?.id
  if (!wo) {
    ElMessage.info('该事件暂无关联工单（演示）')
    return
  }
  router.push({ path: '/security/workbench/repair', query: { focusWo: wo } })
}

function onSearch() {
  page.value = 1
  ElMessage.success('已按条件查询（演示）')
}
function onReset() {
  filters.value = { category: '', level: '', source: '', status: 'all', timeRange: '' }
  page.value = 1
}

watch([() => filters.value.status, pageSize], () => {
  page.value = 1
})
</script>
