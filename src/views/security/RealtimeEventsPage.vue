<template>
  <div class="sec-realtime-page space-y-4">
    <h1 class="text-xl font-bold text-gray-800">实时事件</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <button
        v-for="k in kpiCards"
        :key="k.key"
        type="button"
        class="rounded-xl border bg-white p-4 shadow-sm text-left cursor-pointer transition hover:ring-2 hover:ring-indigo-200"
        style="border-color: var(--yw-border)"
        :class="kpiActive === k.key ? 'ring-2 ring-indigo-400' : ''"
        @click="applyKpiDrill(k.key)"
      >
        <p class="text-sm text-gray-500 m-0">
          {{ k.label }}
          <span class="text-xs text-gray-400">（演示锚点）</span>
        </p>
        <p class="text-2xl font-bold text-gray-900 mt-1 tabular-nums m-0">{{ k.value }}</p>
      </button>
    </div>

    <div class="rounded-xl border bg-white p-4 shadow-sm" style="border-color: var(--yw-border)">
      <el-form :inline="true" class="flex flex-wrap items-end gap-3" @submit.prevent>
        <el-form-item label="事件分类" class="!mb-0">
          <el-select v-model="filters.category" placeholder="全部" clearable class="!w-36" @change="onFilterChange">
            <el-option label="全部" value="" />
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件等级" class="!mb-0">
          <el-select v-model="filters.level" placeholder="全部" clearable class="!w-28" @change="onFilterChange">
            <el-option label="全部" value="" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源" class="!mb-0">
          <el-select v-model="filters.source" placeholder="全部" clearable class="!w-36" @change="onFilterChange">
            <el-option v-for="o in sourceOptions" :key="o.value || 'all'" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-radio-group v-model="filters.status" size="small" class="!flex-nowrap" @change="onFilterChange">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="pending">待处理</el-radio-button>
            <el-radio-button label="processing">处理中</el-radio-button>
            <el-radio-button label="closed">已闭环</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围" class="!mb-0">
          <el-select v-model="filters.timeRange" class="!w-36" @change="onTimePresetChange">
            <el-option label="不限" value="" />
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="filters.timeRange === 'custom'" label="自定义" class="!mb-0">
          <el-date-picker
            v-model="filters.customRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledFutureDate"
            @change="onCustomRangeConfirmed"
          />
        </el-form-item>
        <el-form-item label="关键词" class="!mb-0">
          <el-input v-model="filters.keyword" clearable placeholder="标题/描述/位置" class="!w-48" @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" :loading="loading" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="rounded-xl border bg-white p-0 shadow-sm overflow-hidden" style="border-color: var(--yw-border)">
      <div class="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-b" style="border-color: var(--yw-border)">
        <el-button :icon="Download" :loading="exporting" @click="onExport">导出</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="onRefresh">刷新</el-button>
      </div>

      <el-table
        :data="pagedRows"
        border
        stripe
        class="!border-0"
        style="--el-table-border-color: var(--yw-border)"
        :default-sort="{ prop: sortProp, order: sortOrder === 'descending' ? 'descending' : 'ascending' }"
        @sort-change="onSortChange"
      >
        <el-table-column type="index" label="序号" width="58" align="center" />
        <el-table-column label="分类 / 描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-gray-800 font-medium">{{ categoryCell(row) }}</span>
            <span class="text-gray-500"> · {{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="80" align="center" sortable="custom" prop="level">
          <template #default="{ row }">
            <el-tag :type="levelTagType(row.level)" size="small">{{ row.levelLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" sortable="custom" prop="status">
          <template #default="{ row }">
            <span class="inline-flex items-center gap-1">
              <span
                class="inline-block w-1.5 h-1.5 rounded-full"
                :class="statusDotClass(row.status)"
              />
              {{ row.statusLabel }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="关联规则" min-width="120" show-overflow-tooltip sortable="custom" prop="ruleName">
          <template #default="{ row }">
            <el-button
              v-if="row.ruleName"
              type="primary"
              link
              size="small"
              class="!p-0"
              @click="goRuleFilter(row)"
            >
              {{ row.ruleName }}
            </el-button>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="首次事件时间" width="168" align="center" sortable="custom" prop="startTime">
          <template #default="{ row }">
            {{ formatFullTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168" align="center" sortable="custom" prop="updatedTime">
          <template #default="{ row }">
            {{ formatFullTime(row.updatedTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="120" show-overflow-tooltip sortable="custom" />
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="onPageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { EVENT_SOURCE_OPTIONS } from '@/constants/eventSource'
import { listRealtimeEventsMerged, REALTIME_EVENTS_DEMO_TODAY } from '@/data/realtimeEventsMock'
import { EVENT_STATS_ANCHOR_END } from '@/data/eventCategoryStats'
import { listEventCategories, getEventCategoryLabel, hydrateEventCategoriesOnce } from '@/data/eventCategories'
import { useEventDetailStore } from '@/stores/eventDetail'

hydrateEventCategoriesOnce()

const LS_PAGE_SIZE = 'yuyi-realtime-events-page-size'
const DEMO_ANCHOR_END = EVENT_STATS_ANCHOR_END

const route = useRoute()
const router = useRouter()
const sourceOptions = EVENT_SOURCE_OPTIONS
const eventDetailStore = useEventDetailStore()

const loading = ref(false)
const exporting = ref(false)
const kpiActive = ref('')
const sortProp = ref('updatedTime')
const sortOrder = ref('descending')

const categoryOptions = computed(() =>
  listEventCategories({}).map((r) => ({ value: r.id, label: r.name }))
)

const filters = ref({
  category: '',
  level: '',
  source: '',
  status: 'all',
  timeRange: '',
  customRange: null,
  keyword: ''
})

const page = ref(1)
const pageSize = ref(Number(localStorage.getItem(LS_PAGE_SIZE)) || 20)

function categoryCell(row) {
  return getEventCategoryLabel(row.categoryId ?? row.categoryLabel)
}

function levelTagType(l) {
  if (l === 'high') return 'danger'
  if (l === 'medium') return 'warning'
  return 'info'
}

function statusDotClass(s) {
  if (s === 'pending') return 'bg-amber-500'
  if (s === 'processing') return 'bg-blue-500'
  if (s === 'closed') return 'bg-emerald-500'
  return 'bg-gray-400'
}

function parseRowDate(iso) {
  if (!iso || iso === '—') return null
  const d = new Date(iso.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function dateKey(iso) {
  const d = parseRowDate(iso)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function inPresetTimeRange(startTime, rangeKey) {
  const custom = filters.value.customRange
  const useCustom =
    (filters.value.timeRange === 'custom' && custom?.length === 2) ||
    (Boolean(kpiActive.value) && custom?.length === 2)
  if (useCustom && custom?.length === 2 && custom[0] && custom[1]) {
    const k = dateKey(startTime)
    return k >= custom[0] && k <= custom[1]
  }
  if (!rangeKey || rangeKey === 'custom') return true
  const t = parseRowDate(startTime)
  if (!t) return true
  if (rangeKey === '7d' || rangeKey === '30d') {
    const days = rangeKey === '7d' ? 7 : 30
    const start = new Date(DEMO_ANCHOR_END)
    start.setDate(start.getDate() - days)
    return t >= start && t <= DEMO_ANCHOR_END
  }
  return true
}

/** 含 EVENT_STATS_ANCHOR_END 的 ISO 周（周一至周日） */
function anchorWeekRange() {
  const anchor = new Date(DEMO_ANCHOR_END)
  const wd = anchor.getDay() === 0 ? 7 : anchor.getDay()
  const mon = new Date(anchor)
  mon.setHours(0, 0, 0, 0)
  mon.setDate(anchor.getDate() - wd + 1)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { start: mon, end: sun }
}

const mergedAll = computed(() => listRealtimeEventsMerged())

const kpiCards = computed(() => {
  const rows = mergedAll.value
  const today = REALTIME_EVENTS_DEMO_TODAY
  const todayNew = rows.filter((r) => dateKey(r.startTime) === today).length
  const pending = rows.filter((r) => r.status === 'pending').length
  const processing = rows.filter((r) => r.status === 'processing').length
  const { start, end } = anchorWeekRange()
  const closedWeek = rows.filter((r) => {
    if (r.status !== 'closed') return false
    const ct = r.closedTime || r.endTime
    const d = parseRowDate(ct)
    return d && d >= start && d <= end
  }).length
  return [
    { key: 'today', label: '今日新增', value: todayNew },
    { key: 'pending', label: '待处理', value: pending },
    { key: 'processing', label: '处理中', value: processing },
    { key: 'closedWeek', label: '已闭环（本周）', value: closedWeek }
  ]
})

function setKpiFilters(key) {
  if (!key) return
  if (key === 'today') {
    filters.value.timeRange = ''
    filters.value.customRange = [REALTIME_EVENTS_DEMO_TODAY, REALTIME_EVENTS_DEMO_TODAY]
    filters.value.status = 'all'
  } else if (key === 'pending') {
    filters.value.status = 'pending'
  } else if (key === 'processing') {
    filters.value.status = 'processing'
  } else if (key === 'closedWeek') {
    filters.value.status = 'closed'
    filters.value.timeRange = ''
    const { start, end } = anchorWeekRange()
    filters.value.customRange = [
      `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    ]
  }
}

function applyKpiDrill(key) {
  if (kpiActive.value === key) {
    kpiActive.value = ''
    filters.value.customRange = null
    onSearch()
    syncUrlQuery()
    return
  }
  kpiActive.value = key
  setKpiFilters(key)
  page.value = 1
  onSearch()
  syncUrlQuery()
}

function matchesKeyword(row, kw) {
  if (!kw.trim()) return true
  const k = kw.trim().toLowerCase()
  const blob = [row.name, row.contentText, row.location, categoryCell(row)].join(' ').toLowerCase()
  return blob.includes(k)
}

const filtered = computed(() => {
  return mergedAll.value.filter((r) => {
    if (filters.value.status !== 'all' && r.status !== filters.value.status) return false
    if (filters.value.level && r.level !== filters.value.level) return false
    if (filters.value.source && r.source !== filters.value.source) return false
    if (!matchesKeyword(r, filters.value.keyword)) return false
    return true
  })
})

function compareRows(a, b, prop) {
  const va = a[prop]
  const vb = b[prop]
  if (prop === 'level') {
    const order = { high: 3, medium: 2, low: 1 }
    return (order[va] || 0) - (order[vb] || 0)
  }
  if (prop === 'status') {
    const order = { pending: 1, processing: 2, closed: 3 }
    return (order[va] || 0) - (order[vb] || 0)
  }
  const sa = va == null ? '' : String(va)
  const sb = vb == null ? '' : String(vb)
  return sa.localeCompare(sb, 'zh-CN')
}

const sortedFiltered = computed(() => {
  const rows = [...filtered.value]
  const prop = sortProp.value
  const ord = sortOrder.value === 'ascending' ? 1 : -1
  rows.sort((a, b) => compareRows(a, b, prop) * ord)
  return rows
})

const total = computed(() => sortedFiltered.value.length)
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedFiltered.value.slice(start, start + pageSize.value)
})

function onSortChange({ prop, order }) {
  if (!prop || !order) {
    sortProp.value = 'updatedTime'
    sortOrder.value = 'descending'
  } else {
    sortProp.value = prop
    sortOrder.value = order
  }
  syncUrlQuery()
}

function formatFullTime(iso) {
  if (!iso || iso === '—') return '—'
  return iso
}

function openDetail(row) {
  eventDetailStore.openById(row.id)
}

function goWorkOrder(row) {
  const wo = row.linkedWorkOrder?.id
  if (!wo) {
    ElMessage.info('该事件暂无关联工单（演示）')
    return
  }
  router.push({ path: '/security/workbench/all', query: { focusWo: wo } })
}

function goRuleFilter(row) {
  if (row.ruleId) {
    router.push({ name: 'RiskRules', query: { focusRule: row.ruleId } }).catch(() => {})
  } else if (row.ruleName) {
    router.push({ name: 'RiskRules', query: { ruleName: row.ruleName } }).catch(() => {})
  }
}

function onFilterChange() {
  page.value = 1
  syncUrlQuery()
}

function onTimePresetChange() {
  if (filters.value.timeRange === 'custom') {
    page.value = 1
    syncUrlQuery()
    return
  }
  if (filters.value.timeRange === '' || filters.value.timeRange === '7d' || filters.value.timeRange === '30d') {
    filters.value.customRange = null
  }
  kpiActive.value = ''
  page.value = 1
  syncUrlQuery()
}

function onCustomRangeConfirmed() {
  const r = filters.value.customRange
  if (r?.length === 2 && r[0] && r[1] && r[1] < r[0]) {
    ElMessage.warning('结束日期不能早于开始日期')
    filters.value.customRange = null
    return
  }
  page.value = 1
  syncUrlQuery()
}

function disabledFutureDate(d) {
  return d.getTime() > DEMO_ANCHOR_END.getTime()
}

function onSearch() {
  loading.value = true
  page.value = 1
  setTimeout(() => {
    loading.value = false
    syncUrlQuery()
    ElMessage.success('已刷新列表')
  }, 200)
}

function onRefresh() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    syncUrlQuery()
    ElMessage.success('已刷新')
  }, 300)
}

function onPageSizeChange() {
  localStorage.setItem(LS_PAGE_SIZE, String(pageSize.value))
  page.value = 1
  syncUrlQuery()
}

function onReset() {
  kpiActive.value = ''
  filters.value = {
    category: '',
    level: '',
    source: '',
    status: 'all',
    timeRange: '',
    customRange: null,
    keyword: ''
  }
  page.value = 1
  sortProp.value = 'updatedTime'
  sortOrder.value = 'descending'
  syncUrlQuery()
}

function onExport() {
  const rows = sortedFiltered.value
  if (rows.length > 5000) {
    ElMessage.warning('导出数据量过大，请缩小筛选范围后重试')
    return
  }
  exporting.value = true
  try {
    const headers = ['分类', '描述', '等级', '状态', '关联规则', '首次时间', '更新时间', '位置']
    const lines = rows.map((r) =>
      [
        categoryCell(r),
        r.name,
        r.levelLabel,
        r.statusLabel,
        r.ruleName || '',
        r.startTime,
        r.updatedTime || r.startTime,
        r.location || ''
      ].map((c) => `"${String(c).replace(/"/g, '""')}"`)
    )
    const bom = '\uFEFF'
    const csv = bom + [headers.join(','), ...lines.map((l) => l.join(','))].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const ts = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const fn = `实时事件_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`
    a.href = url
    a.download = fn
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已导出 CSV（可用 Excel 打开）')
  } finally {
    exporting.value = false
  }
}

let keywordTimer = null
watch(
  () => filters.value.keyword,
  () => {
    clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
      page.value = 1
      syncUrlQuery()
    }, 500)
  }
)

let urlSyncTimer = null
function syncUrlQuery() {
  clearTimeout(urlSyncTimer)
  urlSyncTimer = setTimeout(() => {
    const q = {}
    if (filters.value.category) q.category = filters.value.category
    if (filters.value.level) q.level = filters.value.level
    if (filters.value.source) q.source = filters.value.source
    if (filters.value.status && filters.value.status !== 'all') q.status = filters.value.status
    if (filters.value.timeRange) q.timeRange = filters.value.timeRange
    if (filters.value.customRange?.length === 2) {
      q.ds = filters.value.customRange[0]
      q.de = filters.value.customRange[1]
    }
    if (filters.value.keyword) q.keyword = filters.value.keyword
    if (page.value > 1) q.page = String(page.value)
    if (pageSize.value !== 20) q.size = String(pageSize.value)
    if (sortProp.value !== 'updatedTime' || sortOrder.value !== 'descending') {
      q.sort = sortProp.value
      q.order = sortOrder.value === 'ascending' ? 'asc' : 'desc'
    }
    if (kpiActive.value) q.kpi = kpiActive.value
    router.replace({ path: route.path, query: q }).catch(() => {})
  }, 150)
}

function readUrlQuery() {
  const q = route.query
  if (q.category) filters.value.category = String(q.category)
  if (q.level) filters.value.level = String(q.level)
  if (q.source) filters.value.source = String(q.source)
  if (q.status) filters.value.status = String(q.status)
  if (q.timeRange) filters.value.timeRange = String(q.timeRange)
  if (q.ds && q.de) filters.value.customRange = [String(q.ds), String(q.de)]
  if (q.keyword) filters.value.keyword = String(q.keyword)
  if (q.page) page.value = Math.max(1, parseInt(String(q.page), 10) || 1)
  if (q.size) pageSize.value = [10, 20, 50, 100].includes(parseInt(String(q.size), 10)) ? parseInt(String(q.size), 10) : 20
  if (q.sort) sortProp.value = String(q.sort)
  if (q.order === 'asc') sortOrder.value = 'ascending'
  if (q.order === 'desc') sortOrder.value = 'descending'
  if (q.kpi && ['today', 'pending', 'processing', 'closedWeek'].includes(String(q.kpi))) {
    kpiActive.value = String(q.kpi)
    setKpiFilters(kpiActive.value)
  }
}

onMounted(() => {
  readUrlQuery()
})

</script>
