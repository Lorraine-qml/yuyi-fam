<template>
  <div class="risk-trial-logs-page">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">试运行日志</h1>
      <p class="text-gray-500 text-sm mt-1">全局查看指标试运行记录，支持筛选对比与批量导出</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      <div
        v-for="c in kpiCards"
        :key="c.key"
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <p class="text-xs text-gray-500">{{ c.label }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ c.value }}</p>
      </div>
    </div>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm mb-4"
      style="border-color: var(--yw-border)"
    >
      <div class="text-sm font-semibold text-gray-800 mb-3">筛选条件</div>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600 shrink-0">时间范围：</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            class="!w-[280px] sm:!w-[320px]"
          />
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <el-form-item label="业务板块" class="!mb-0">
            <el-select v-model="filterSector" placeholder="全部" clearable class="w-36">
              <el-option
                v-for="s in TRIAL_LOG_SECTOR_OPTIONS"
                :key="s.value || 'all-s'"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="指标" class="!mb-0">
            <el-select v-model="filterMetric" placeholder="全部" filterable clearable class="w-44">
              <el-option
                v-for="m in metricOptions"
                :key="m.value || 'all-m'"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="是否触发" class="!mb-0">
            <el-select v-model="filterTriggered" placeholder="全部" clearable class="w-32">
              <el-option
                v-for="t in TRIAL_TRIGGER_OPTIONS"
                :key="t.value || 'all-t'"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="等级" class="!mb-0">
            <el-select v-model="filterLevel" placeholder="全部" clearable class="w-32">
              <el-option
                v-for="l in TRIAL_LEVEL_OPTIONS"
                :key="l.value || 'all-l'"
                :label="l.label"
                :value="l.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="触发结果" class="!mb-0">
            <el-select v-model="filterResult" placeholder="全部" clearable class="w-36">
              <el-option
                v-for="r in TRIAL_RESULT_OPTIONS"
                :key="r.value || 'all-r'"
                :label="r.label"
                :value="r.value"
              />
            </el-select>
          </el-form-item>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <el-button type="primary" @click="runQuery">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" plain @click="batchExport">
            <el-icon class="mr-1"><Download /></el-icon>
            批量导出
          </el-button>
        </div>
      </div>
    </div>

    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <div class="px-4 py-3 border-b text-sm font-semibold text-gray-800" style="border-color: var(--yw-border)">
        试运行日志列表
      </div>
      <el-table :data="pagedRows" border stripe size="small" class="w-full">
        <el-table-column prop="time" label="时间" width="120" />
        <el-table-column label="指标名称" min-width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="goMetricScoped(row)">{{ row.metricName }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="metricCode" label="指标编码" min-width="140" show-overflow-tooltip />
        <el-table-column label="指标值" width="100" align="right">
          <template #default="{ row }">{{ row.metricValueDisplay }}</template>
        </el-table-column>
        <el-table-column label="是否触发" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.triggered" class="text-emerald-600 font-medium">✅ 是</span>
            <span v-else class="text-gray-400 font-medium">❌ 否</span>
          </template>
        </el-table-column>
        <el-table-column prop="expectedEvent" label="预期事件内容" min-width="200" show-overflow-tooltip />
      </el-table>
      <div
        class="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-t text-sm text-gray-500"
        style="border-color: var(--yw-border)"
      >
        <span>共 {{ filteredRows.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, sizes"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  computeTrialLogKpi,
  generateGlobalTrialLogs,
  getMetricFilterOptionsFromLogs,
  TRIAL_LEVEL_OPTIONS,
  TRIAL_LOG_SECTOR_OPTIONS,
  TRIAL_RESULT_OPTIONS,
  TRIAL_TRIGGER_OPTIONS
} from '@/data/riskTrialLogsGlobalMock'

const route = useRoute()
const router = useRouter()

const allRows = ref([])
const filteredRows = ref([])

const dateRange = ref(['2026-04-01', '2026-04-24'])
const filterSector = ref('')
const filterMetric = ref('')
const filterTriggered = ref('')
const filterLevel = ref('')
const filterResult = ref('')

const page = ref(1)
const pageSize = ref(20)

const metricOptions = computed(() => getMetricFilterOptionsFromLogs(allRows.value))

const kpi = computed(() => computeTrialLogKpi(allRows.value))

const kpiCards = computed(() => [
  { key: 'm', label: '试运行中指标', value: kpi.value.trialMetrics },
  { key: 't', label: '今日触发', value: kpi.value.todayTriggers },
  { key: 'a', label: '平均准确率', value: `${kpi.value.accuracy}%` },
  { key: 'p', label: '待确认日志', value: kpi.value.pendingConfirm }
])

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function inDateRange(sortTime) {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return true
  const d = sortTime.slice(0, 10)
  return d >= dateRange.value[0] && d <= dateRange.value[1]
}

function applyFilters() {
  let list = allRows.value.filter((r) => inDateRange(r.sortTime))
  if (filterSector.value) list = list.filter((r) => r.sector === filterSector.value)
  if (filterMetric.value) list = list.filter((r) => r.metricCode === filterMetric.value)
  if (filterTriggered.value === 'yes') list = list.filter((r) => r.triggered)
  if (filterTriggered.value === 'no') list = list.filter((r) => !r.triggered)
  if (filterLevel.value) list = list.filter((r) => r.level === filterLevel.value)
  if (filterResult.value === 'match') list = list.filter((r) => r.confirmStatus === 'match')
  if (filterResult.value === 'pending') list = list.filter((r) => r.confirmStatus === 'pending')
  filteredRows.value = list
  page.value = 1
}

function runQuery() {
  applyFilters()
  ElMessage.success(`已筛选 ${filteredRows.value.length} 条记录`)
}

function resetFilters() {
  dateRange.value = ['2026-04-01', '2026-04-24']
  filterSector.value = ''
  filterMetric.value = ''
  filterTriggered.value = ''
  filterLevel.value = ''
  filterResult.value = ''
  applyFilters()
  router.replace({ name: 'RiskTrialLogs', query: {} })
  ElMessage.success('已重置')
}

function batchExport() {
  const rows = filteredRows.value
  if (!rows.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const header = ['时间', '指标名称', '指标编码', '指标值', '是否触发', '预期事件内容']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.time,
        r.metricName,
        r.metricCode,
        r.metricValueDisplay,
        r.triggered ? '是' : '否',
        `"${String(r.expectedEvent).replace(/"/g, '""')}"`
      ].join(',')
    )
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `试运行日志-全局-${dateRange.value?.join('_') || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${rows.length} 条`)
}

function goMetricScoped(row) {
  router.push({
    name: 'RiskTrialLogs',
    query: { metricCode: row.metricCode }
  })
}

onMounted(() => {
  allRows.value = generateGlobalTrialLogs(156)
  const code = route.query.metricCode
  if (typeof code === 'string' && code) filterMetric.value = code
  applyFilters()
})

watch(
  () => route.query.metricCode,
  (code) => {
    if (typeof code === 'string' && code) filterMetric.value = code
    else filterMetric.value = ''
    applyFilters()
  }
)
</script>
