<template>
  <div class="risk-dashboard pb-6">
    <!-- 顶栏：标题 + 筛选 + 刷新 -->
    <div
      class="flex flex-col gap-4 mb-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h1 class="text-2xl font-bold text-gray-800">风险看板</h1>
        <p class="text-gray-500 text-sm mt-1">
          风险态势实时监控、趋势与热点识别；上次刷新 {{ lastRefreshText }}
        </p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <el-radio-group v-model="timeRange" size="small" class="flex-shrink-0">
          <el-radio-button
            v-for="t in TIME_RANGE_OPTIONS"
            :key="t.value"
            :label="t.value"
          >
            {{ t.label }}
          </el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
        <div v-if="timeRange === 'custom'" class="flex items-center gap-2">
          <el-date-picker
            v-model="customRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            size="small"
            class="!w-[240px] sm:!w-[280px]"
            @change="applyCustomRange"
          />
        </div>
        <el-select
          v-model="sectorFilter"
          placeholder="板块"
          size="small"
          class="w-full sm:w-[130px]"
          @change="onFilterChange"
        >
          <el-option
            v-for="s in SECTOR_FILTER_OPTIONS"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
        <el-select
          v-model="levelFilter"
          placeholder="等级"
          size="small"
          class="w-full sm:w-[120px]"
          @change="onFilterChange"
        >
          <el-option
            v-for="l in LEVEL_FILTER_OPTIONS"
            :key="l.value"
            :label="l.label"
            :value="l.value"
          />
        </el-select>
        <el-button type="primary" size="small" :icon="Refresh" :loading="refreshing" @click="manualRefresh">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 核心 KPI -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5"
    >
      <el-tooltip content="待处理且未完成闭环的风险事件总数" placement="top" :show-after="400">
        <button
          type="button"
          class="risk-kpi-card risk-kpi-card--danger text-left w-full"
          @click="openDrill('未处置风险', 'pending')"
        >
          <div class="risk-kpi-card__head">
            <span class="risk-kpi-card__label">未处置风险</span>
            <el-icon class="risk-kpi-card__icon"><Warning /></el-icon>
          </div>
          <div class="risk-kpi-card__value risk-kpi-card__value--danger">{{ kpi.unhandled }}</div>
          <div class="risk-kpi-card__sub">
            <span class="text-gray-500">超时未处置：</span>
            <button
              type="button"
              class="risk-kpi-card__link-error font-medium"
              @click.stop="openDrill('超时未处置', 'overdue')"
            >
              {{ kpi.overdueUnhandled }}
            </button>
          </div>
          <div class="risk-kpi-card__foot">
            <span class="risk-kpi-card__link">查看详情 →</span>
          </div>
        </button>
      </el-tooltip>

      <el-tooltip content="当日规则触发并生成的事件数（演示数据）" placement="top" :show-after="400">
        <button
          type="button"
          class="risk-kpi-card risk-kpi-card--warning text-left w-full"
          @click="openDrill('今日新增', 'new')"
        >
          <div class="risk-kpi-card__head">
            <span class="risk-kpi-card__label">今日新增</span>
            <el-icon class="risk-kpi-card__icon"><Plus /></el-icon>
          </div>
          <div class="risk-kpi-card__value risk-kpi-card__value--warning">{{ kpi.todayNew }}</div>
          <div class="risk-kpi-card__sub text-amber-700/90">{{ kpi.todayNewHint }}</div>
          <div class="risk-kpi-card__foot">
            <span class="risk-kpi-card__link">查看详情 →</span>
          </div>
        </button>
      </el-tooltip>

      <el-tooltip content="已派单或处置中、尚未闭环的事件" placement="top" :show-after="400">
        <button
          type="button"
          class="risk-kpi-card risk-kpi-card--info text-left w-full"
          @click="openDrill('处理中', 'processing')"
        >
          <div class="risk-kpi-card__head">
            <span class="risk-kpi-card__label">处理中</span>
            <el-icon class="risk-kpi-card__icon"><Loading /></el-icon>
          </div>
          <div class="risk-kpi-card__value risk-kpi-card__value--info">{{ kpi.processing }}</div>
          <div class="risk-kpi-card__sub">
            <span class="text-gray-500">待派单：</span>
            <span class="font-medium text-gray-800">{{ kpi.pendingAssign }}</span>
          </div>
          <div class="risk-kpi-card__foot">
            <span class="risk-kpi-card__link">查看详情 →</span>
          </div>
        </button>
      </el-tooltip>

      <el-tooltip content="已完成闭环的事件数及平均处置时长" placement="top" :show-after="400">
        <button
          type="button"
          class="risk-kpi-card risk-kpi-card--success text-left w-full"
          @click="openDrill('已闭环', 'closed')"
        >
          <div class="risk-kpi-card__head">
            <span class="risk-kpi-card__label">已闭环</span>
            <el-icon class="risk-kpi-card__icon"><CircleCheck /></el-icon>
          </div>
          <div class="risk-kpi-card__value risk-kpi-card__value--success">{{ kpi.closed }}</div>
          <div class="risk-kpi-card__sub">
            <span class="text-gray-500">平均时长：</span>
            <span class="font-medium text-gray-800">{{ kpi.closedAvgHours }}h</span>
          </div>
          <div class="risk-kpi-card__foot">
            <span class="risk-kpi-card__link">查看详情 →</span>
          </div>
        </button>
      </el-tooltip>

      <el-tooltip content="闭环数 / 总事件数（演示口径）" placement="top" :show-after="400">
        <div
          class="risk-kpi-card risk-kpi-card--rate cursor-default xl:col-span-1 lg:col-span-3 sm:col-span-2 col-span-1"
        >
          <div class="risk-kpi-card__head">
            <span class="risk-kpi-card__label">闭环率</span>
            <el-icon class="risk-kpi-card__icon text-indigo-500"><TrendCharts /></el-icon>
          </div>
          <div class="flex items-end gap-3 mt-1">
            <span class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              {{ kpi.closeRate }}%
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-2">{{ kpi.closeRateHint }}</p>
          <el-progress
            :percentage="kpi.closeRate"
            :stroke-width="10"
            :color="['#4F46E5', '#6366F1']"
            class="mt-3"
          />
        </div>
      </el-tooltip>
    </div>

    <!-- 图表行 1：趋势 + 等级分布 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
      <div class="yw-card p-4 sm:p-5 min-w-0">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div>
            <h3 class="font-semibold text-gray-800">近7天风险趋势</h3>
            <p class="text-xs text-gray-500 mt-1">
              本周高峰：{{ trendStats.peakDay }}（{{ trendStats.peakVal }}起）· {{ trendStats.peakHint }}
            </p>
          </div>
          <div class="text-right text-xs text-gray-500 shrink-0">
            <div>
              较上周同期 <span class="font-medium text-emerald-600">{{ trendStats.vsLastWeek }}</span>
            </div>
            <div>本周日均 {{ trendStats.dailyAvg }}起 · {{ trendStats.dailyHint }}</div>
          </div>
        </div>
        <ChartContainer
          :option="trendOption"
          height="280px"
          class="min-h-[240px]"
          :chart-events="trendChartEvents"
        />
      </div>
      <div class="yw-card p-4 sm:p-5 min-w-0">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">风险等级分布</h3>
          <span class="text-xs text-gray-400">未处置构成</span>
        </div>
        <ChartContainer
          :option="levelPieOption"
          height="260px"
          class="min-h-[220px]"
          :chart-events="pieChartEvents"
        />
        <div class="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 border-t pt-3" style="border-color: var(--yw-border)">
          <span><span class="inline-block w-2 h-2 rounded-full bg-[#EF4444] mr-1 align-middle" />高 · 5分钟内响应</span>
          <span><span class="inline-block w-2 h-2 rounded-full bg-[#F59E0B] mr-1 align-middle" />中 · 15分钟内</span>
          <span><span class="inline-block w-2 h-2 rounded-full bg-[#10B981] mr-1 align-middle" />低 · 1小时内</span>
        </div>
      </div>
    </div>

    <!-- 图表行 2：板块 + 时效 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
      <div class="yw-card p-4 sm:p-5 min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 class="font-semibold text-gray-800">风险板块分布</h3>
          <span class="text-xs text-amber-700 font-medium">总风险较上周 ↑{{ sectorHead.totalWow }}%</span>
        </div>
        <ChartContainer
          :option="sectorBarOption"
          height="260px"
          :chart-events="sectorChartEvents"
        />
      </div>
      <div class="yw-card p-4 sm:p-5 min-w-0">
        <h3 class="font-semibold text-gray-800 mb-3">处置时效分析</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div class="rounded-lg border p-3" style="border-color: var(--yw-border); background: var(--yw-bg-page)">
            <p class="text-xs text-gray-500">平均响应时长</p>
            <p class="text-xl font-bold text-gray-800 mt-1">{{ effKpi.responseMin }} 分钟</p>
            <p class="text-xs text-emerald-600 mt-1">{{ effKpi.responseDelta }}</p>
          </div>
          <div class="rounded-lg border p-3" style="border-color: var(--yw-border); background: var(--yw-bg-page)">
            <p class="text-xs text-gray-500">平均处置时长</p>
            <p class="text-xl font-bold text-gray-800 mt-1">{{ effKpi.disposeHours }} 小时</p>
            <p class="text-xs text-emerald-600 mt-1">{{ effKpi.disposeDelta }}</p>
          </div>
          <div class="rounded-lg border p-3" style="border-color: var(--yw-border); background: var(--yw-bg-page)">
            <p class="text-xs text-gray-500">超时率</p>
            <p class="text-xl font-bold text-gray-800 mt-1">{{ effKpi.overtimeRate }}%</p>
            <p class="text-xs text-emerald-600 mt-1">{{ effKpi.overtimeDelta }}</p>
          </div>
        </div>
        <p class="text-sm font-medium text-gray-700 mb-2">各科室平均处置时长</p>
        <ChartContainer :option="deptBarOption" height="220px" />
      </div>
    </div>

    <!-- 底部：TOP5 + 最新事件 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="yw-card p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">高频风险设备/区域 TOP5</h3>
          <el-button link type="primary" size="small" @click="openDrill('热点排行 TOP20', 'hotspots')">
            查看全部 →
          </el-button>
        </div>
        <ul class="space-y-4">
          <li v-for="row in hotspots" :key="row.rank">
            <button
              type="button"
              class="w-full text-left rounded-lg border p-3 transition-colors hover:bg-gray-50"
              style="border-color: var(--yw-border)"
              @click="openHotspot(row)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex gap-2 min-w-0">
                  <span class="text-lg font-bold text-gray-300 w-6 shrink-0">{{ row.rank }}</span>
                  <div class="min-w-0">
                    <div class="font-medium text-gray-800 truncate">{{ row.name }}</div>
                    <p class="text-xs text-gray-500 mt-1">主要风险类型：{{ row.types }}</p>
                  </div>
                </div>
                <div class="text-right shrink-0">
                  <span class="text-sm font-semibold text-gray-800">{{ row.count }}次</span>
                  <span class="block text-xs mt-0.5" :class="deltaClass(row.delta)">{{ deltaText(row.delta) }}</span>
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <div class="yw-card p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-gray-800">最新风险事件</h3>
          <el-button link type="primary" size="small" @click="openDrill('实时事件列表', 'latest')">
            查看全部 →
          </el-button>
        </div>
        <ul class="space-y-3">
          <li
            v-for="ev in displayEvents"
            :key="ev.id"
            class="rounded-lg border p-3"
            style="border-color: var(--yw-border)"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-gray-400 w-10">{{ ev.time }}</span>
              <span class="text-xs font-mono text-indigo-600">#{{ ev.id }}</span>
              <el-tag
                v-if="ev.source"
                size="small"
                effect="light"
                :class="sourceBadgeClass(ev.source)"
                class="!border-0"
              >
                <span v-if="ev.source === 'rule'">⚡</span>{{ sourceLabel(ev.source) }}
              </el-tag>
              <span class="text-sm font-medium text-gray-800 flex-1 min-w-[120px]">{{ ev.title }}</span>
              <el-tag :type="levelTagType(ev.level)" size="small" effect="light">{{ levelLabel(ev.level) }}</el-tag>
              <el-button
                v-if="ev.action === 'dispose'"
                type="primary"
                size="small"
                link
                @click="onDisposeLatestEvent(ev)"
              >
                处置
              </el-button>
              <el-button type="primary" size="small" link @click="onEventDetail(ev)">详情</el-button>
            </div>
            <p class="text-xs text-gray-500 mt-2 pl-0 sm:pl-[4.5rem]">└─ {{ ev.summary }}</p>
          </li>
        </ul>
      </div>
    </div>

    <!-- 下钻抽屉 -->
    <el-drawer v-model="drillVisible" :title="drillTitle" size="min(520px, 100%)" destroy-on-close>
      <p class="text-xs text-gray-500 mb-3">{{ drillHint }}</p>
      <el-table :data="drillRows" border size="small" stripe>
        <el-table-column prop="id" label="编号" width="120" />
        <el-table-column prop="content" label="事件内容" min-width="140" />
        <el-table-column prop="location" label="位置" width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="onDispose(row)">处置</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4">
        <el-button @click="drillVisible = false">返回看板</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  CircleCheck,
  Loading,
  Plus,
  Refresh,
  TrendCharts,
  Warning
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { eventSourceLabel } from '@/constants/eventSource'
import { useEventDetailStore } from '@/stores/eventDetail'
import ChartContainer from '@/components/ChartContainer.vue'
import { findWorkOrderById, findWorkOrderIdByEventId } from '@/data/workOrderMock'
import {
  buildDeptEfficiencyBarOption,
  buildLevelPieOption,
  buildSectorBarOption,
  buildTrendChartOption,
  EFFICIENCY_KPI_MOCK,
  getKpiSnapshot,
  LATEST_EVENTS_MOCK,
  LEVEL_FILTER_OPTIONS,
  sectorSummaryLine,
  SECTOR_FILTER_OPTIONS,
  TIME_RANGE_OPTIONS,
  TOP_HOTSPOTS_MOCK,
  trendSummaryStats
} from '@/data/riskDashboardMock'

const router = useRouter()
const eventDetailStore = useEventDetailStore()

const timeRange = ref('today')
const customRange = ref(null)
const sectorFilter = ref('all')
const levelFilter = ref('all')
const lastRefresh = ref(new Date())
const refreshing = ref(false)
const autoTimer = ref(null)

const kpi = computed(() => getKpiSnapshot(timeRange.value === 'custom' ? 'week' : timeRange.value))
const trendStats = computed(() => trendSummaryStats())
const sectorHead = computed(() => sectorSummaryLine())
const effKpi = EFFICIENCY_KPI_MOCK

const trendOption = ref(buildTrendChartOption('today'))
const levelPieOption = ref(buildLevelPieOption())
const sectorBarOption = ref(buildSectorBarOption())
const deptBarOption = ref(buildDeptEfficiencyBarOption())

watch(timeRange, (r) => {
  trendOption.value = buildTrendChartOption(r === 'custom' ? 'week' : r)
})

const hotspots = TOP_HOTSPOTS_MOCK
const latestEvents = ref([...LATEST_EVENTS_MOCK])

const displayEvents = computed(() => {
  let list = latestEvents.value
  if (levelFilter.value === 'high') list = list.filter((e) => e.level === 'high')
  else if (levelFilter.value === 'medium') list = list.filter((e) => e.level === 'medium')
  else if (levelFilter.value === 'low') list = list.filter((e) => e.level === 'low')
  return list
})

const lastRefreshText = computed(() => {
  const d = lastRefresh.value
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
})

function applyCustomRange() {
  if (customRange.value?.length === 2) {
    ElMessage.success(`已应用自定义区间 ${customRange.value[0]} ~ ${customRange.value[1]}`)
    touchRefresh()
  }
}

function onFilterChange() {
  ElMessage.info('已更新列表筛选（演示）')
}

function touchRefresh() {
  lastRefresh.value = new Date()
}

function manualRefresh() {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
    touchRefresh()
    ElMessage.success('数据已刷新')
  }, 400)
}

function autoRefreshTick() {
  touchRefresh()
  const head = latestEvents.value[0]
  if (head) {
    latestEvents.value = [...latestEvents.value]
  }
}

const drillVisible = ref(false)
const drillTitle = ref('')
const drillHint = ref('')
const drillRows = ref([])
/** KPI / 图表下钻类型，跳转工单台筛选用 */
const drillKind = ref('')

const DRILL_MOCK = [
  {
    id: '#R240424001',
    content: '用电量突增32%',
    location: '1号楼配电房',
    eventId: 'evt-240424001',
    workOrderId: 'WO-20260427001'
  },
  {
    id: '#R240424002',
    content: '烟感探测器报警',
    location: 'B1层',
    eventId: 'evt-240424018',
    workOrderId: 'WO-20260427003'
  },
  {
    id: '#R240424003',
    content: '晨检不合格',
    location: '食堂',
    eventId: 'evt-240425011',
    workOrderId: 'WO-20260427002'
  }
]

const CLOSED_DRILL_MOCK = [
  {
    id: '#R240424099',
    content: '地下车库CO浓度偏高（已办结演示）',
    location: 'B2 车库',
    eventId: 'evt-240425002',
    workOrderId: 'WO-20260427005'
  }
]

function openDrill(title, type) {
  drillTitle.value = title
  drillKind.value = type
  const hints = {
    pending: '筛选条件：状态 = 未处置',
    overdue: '筛选条件：未处置且已超过处置时限',
    new: '筛选条件：今日新增',
    processing: '筛选条件：处理中',
    closed: '筛选条件：已闭环',
    hotspots: '近30天热点排行（前20条演示）',
    latest: '按时间倒序的实时事件'
  }
  drillHint.value = hints[type] || '演示数据'
  if (type === 'hotspots') {
    drillRows.value = TOP_HOTSPOTS_MOCK.map((h, i) => ({
      id: `TOP-${i + 1}`,
      content: h.name,
      location: '—'
    }))
  } else if (type === 'closed') {
    drillRows.value = [...CLOSED_DRILL_MOCK]
  } else {
    drillRows.value = [...DRILL_MOCK]
  }
  drillVisible.value = true
}

function openHotspot(row) {
  openDrill(`区域：${row.name}`, 'hotspots')
  drillHint.value = '该点位历史风险与关联设备（演示）'
}

const trendChartEvents = {
  click(params) {
    if (params.componentType !== 'series') return
    const idx = params.dataIndex
    const day = ['4/18', '4/19', '4/20', '4/21', '4/22', '4/23', '4/24'][idx] || params.name
    drillTitle.value = `${day} 风险事件`
    drillHint.value = '下钻：当日风险事件列表'
    drillRows.value = [...DRILL_MOCK]
    drillKind.value = 'trendDrill'
    drillVisible.value = true
  }
}

const pieChartEvents = {
  click(params) {
    if (params.name) {
      drillTitle.value = `${params.name}风险事件列表`
      drillHint.value = `筛选条件：等级 = ${params.name}`
      drillRows.value = [...DRILL_MOCK]
      drillKind.value = 'levelDrill'
      drillVisible.value = true
    }
  }
}

const sectorChartEvents = {
  click(params) {
    const name = params.name
    if (name) {
      drillTitle.value = `板块：${name}`
      drillHint.value = '该板块风险事件列表（演示）'
      drillRows.value = [...DRILL_MOCK]
      drillKind.value = 'sectorDrill'
      drillVisible.value = true
    }
  }
}

function sourceLabel(s) {
  return eventSourceLabel(s)
}

function sourceBadgeClass(s) {
  if (s === 'rule') return 'bg-indigo-100 !text-indigo-800'
  return 'bg-gray-100 !text-gray-600'
}

function levelLabel(lv) {
  const m = { high: '高', medium: '中', low: '低' }
  return m[lv] || lv
}

function levelTagType(lv) {
  const m = { high: 'danger', medium: 'warning', low: 'success' }
  return m[lv] || 'info'
}

function deltaText(d) {
  if (d > 0) return `↑${d}`
  if (d < 0) return `↓${Math.abs(d)}`
  return '→'
}

function deltaClass(d) {
  if (d > 0) return 'text-red-500'
  if (d < 0) return 'text-emerald-600'
  return 'text-gray-400'
}

/** 跳转事件工作台 · 报修工单列表，带风险类筛选并尽量打开对应工单抽屉 */
function goToRiskWorkbenchForDispose(row) {
  const woId = row.workOrderId || findWorkOrderIdByEventId(row.eventId)

  const query = { fromRiskBoard: '1', category: 'risk' }

  const kind = drillKind.value
  if (kind === 'new') {
    const d = new Date()
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const today = `${y}-${mo}-${day}`
    query.start = today
    query.end = today
  } else if (kind === 'processing') {
    query.status = 'processing'
  } else if (kind === 'pending' || kind === 'overdue') {
    query.status = 'pending'
  }

  let path = '/security/workbench/repair'
  if (woId) {
    query.focusWo = woId
    const meta = findWorkOrderById(woId)
    if (meta?.status === 'done' || meta?.status === 'closed') {
      path = '/security/workbench/closed'
    }
  } else if (kind === 'closed') {
    path = '/security/workbench/closed'
  }

  drillVisible.value = false
  router.push({ path, query }).catch(() => {})

  if (!woId && kind !== 'closed') {
    ElMessage.info('暂未关联到具体工单，已打开风险类工单列表（可按编号检索）')
  }
}

function onDispose(row) {
  goToRiskWorkbenchForDispose(row)
}

/** 最新风险事件列表内「处置」（无 KPI 下钻上下文） */
function onDisposeLatestEvent(ev) {
  drillKind.value = 'latestEvent'
  goToRiskWorkbenchForDispose(ev)
}

function onEventDetail(row) {
  const eid = row.eventId
  if (eid) {
    eventDetailStore.openById(eid)
  } else {
    ElMessage.info(`事件详情（演示）：${row.id}`)
  }
}

onMounted(() => {
  autoTimer.value = window.setInterval(autoRefreshTick, 30_000)
})

onUnmounted(() => {
  if (autoTimer.value) clearInterval(autoTimer.value)
})
</script>

<style scoped>
.risk-kpi-card {
  border-radius: 12px;
  border: 1px solid var(--yw-border);
  background: var(--yw-bg-card);
  box-shadow: var(--yw-shadow-sm);
  padding: 1rem 1.1rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.risk-kpi-card:hover {
  box-shadow: var(--yw-shadow-md);
}
.risk-kpi-card--danger:hover {
  border-color: #fecaca;
}
.risk-kpi-card--warning:hover {
  border-color: #fde68a;
}
.risk-kpi-card--info:hover {
  border-color: #bfdbfe;
}
.risk-kpi-card--success:hover {
  border-color: #a7f3d0;
}
.risk-kpi-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.risk-kpi-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--yw-text-secondary);
}
.risk-kpi-card__icon {
  font-size: 1.25rem;
  color: var(--yw-text-placeholder);
}
.risk-kpi-card__value {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 0.35rem;
  line-height: 1.2;
}
.risk-kpi-card__value--danger {
  color: var(--yw-danger);
}
.risk-kpi-card__value--warning {
  color: var(--yw-warning);
}
.risk-kpi-card__value--info {
  color: var(--yw-info);
}
.risk-kpi-card__value--success {
  color: var(--yw-success);
}
.risk-kpi-card__sub {
  font-size: 0.75rem;
  margin-top: 0.65rem;
}
.risk-kpi-card__link-error {
  color: var(--yw-danger);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
}
.risk-kpi-card__link-error:hover {
  text-decoration: underline;
}
.risk-kpi-card__foot {
  margin-top: 0.75rem;
  text-align: right;
}
.risk-kpi-card__link {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--yw-primary);
}
</style>
