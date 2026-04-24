<template>
  <el-dialog
    :model-value="visible"
    :title="metric ? `指标测试 - ${metric.name}` : '指标测试'"
    width="820px"
    class="metric-test-dialog"
    destroy-on-close
    align-center
    :lock-scroll="true"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <div v-if="metric" class="metric-test-body space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-600 shrink-0">测试方式：</span>
        <el-radio-group v-model="testMode" size="small">
          <el-radio label="manual">手动输入</el-radio>
          <el-radio label="live">实时采集</el-radio>
        </el-radio-group>
      </div>

      <!-- 手动输入 -->
      <div
        v-if="testMode === 'manual'"
        class="rounded-xl border p-4 space-y-3"
        style="border-color: var(--yw-border); background: var(--yw-bg-page)"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600">模拟值</span>
          <el-input-number v-model="manualValue" :min="0" :step="1" class="w-40" />
          <span class="text-sm text-gray-500">{{ metric.unit || '—' }}</span>
          <el-button type="primary" size="small" @click="runManualTest">验证</el-button>
        </div>
        <p v-if="manualResult !== null" class="text-sm">
          计算校验结果：
          <el-tag :type="manualResult.ok ? 'success' : 'warning'" size="small" effect="light">
            {{ manualResult.ok ? '通过' : '需关注' }}
          </el-tag>
          <span class="text-gray-500 ml-2">{{ manualResult.msg }}</span>
        </p>
      </div>

      <!-- 实时数据 -->
      <div
        v-else
        class="rounded-xl border p-4 space-y-4"
        style="border-color: var(--yw-border); background: var(--yw-bg-card)"
      >
        <div class="text-sm font-semibold text-gray-800">实时数据</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            class="rounded-xl border p-4 text-center"
            style="border-color: var(--yw-border); background: var(--yw-bg-page)"
          >
            <div class="text-xs text-gray-500 mb-2">当前值</div>
            <div class="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {{ liveDisplay }} <span class="text-lg font-semibold text-gray-600">{{ metric.unit || '' }}</span>
            </div>
          </div>
          <div
            class="rounded-xl border p-4 flex flex-col items-center justify-center gap-2"
            style="border-color: var(--yw-border); background: var(--yw-bg-page)"
          >
            <div class="text-xs text-gray-500">数据状态</div>
            <div class="flex items-center gap-2 text-base font-semibold text-emerald-600">
              <span class="text-lg leading-none" aria-hidden="true">🟢</span>
              <span>正常</span>
            </div>
          </div>
        </div>
        <div class="text-sm space-y-1 text-gray-600">
          <p>
            <span class="text-gray-500">采集时间：</span>{{ liveTime }}
          </p>
          <p class="break-all flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="text-gray-500">数据来源：</span>
            <a
              :href="dataSourceDisplay"
              class="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >{{ dataSourceDisplay }}</a>
            <el-button type="primary" link size="small" @click="copySourceUrl">复制</el-button>
          </p>
        </div>
        <el-button type="primary" plain size="small" @click="fetchLive">重新采集</el-button>
      </div>

      <!-- 关联规则验证 -->
      <div
        class="rounded-xl border p-4"
        style="border-color: var(--yw-border); background: var(--yw-bg-card)"
      >
        <h4 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <span aria-hidden="true">📊</span>
          关联规则验证
        </h4>
        <el-table :data="ruleVerifyRows" border size="small" class="w-full">
          <el-table-column prop="name" label="规则名称" min-width="140" />
          <el-table-column prop="condition" label="阈值/条件" min-width="160" show-overflow-tooltip />
          <el-table-column label="触发" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.triggered" class="text-emerald-600 font-medium">✅ 触发</span>
              <span v-else class="text-gray-500 font-medium">❌ 未触发</span>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="结果" min-width="160" show-overflow-tooltip />
        </el-table>
      </div>

      <!-- 历史数据预览 -->
      <div
        class="rounded-xl border p-4"
        style="border-color: var(--yw-border); background: var(--yw-bg-card)"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h4 class="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <span aria-hidden="true">📈</span>
            历史数据预览
          </h4>
          <el-select v-model="historyRange" size="small" class="w-full sm:w-40" @change="onHistoryRangeChange">
            <el-option
              v-for="o in HISTORY_RANGE_OPTIONS"
              :key="o.value"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </div>
        <div
          class="rounded-lg border mb-4 p-2"
          style="border-color: var(--yw-border); background: var(--yw-bg-page)"
        >
          <p class="text-xs text-gray-500 mb-2 px-1">{{ historyChartSubtitle }}</p>
          <ChartContainer :option="historyChartOption" height="220px" />
        </div>
        <el-table :data="historyRows" border size="small" class="w-full">
          <el-table-column prop="time" label="时间" min-width="168" />
          <el-table-column :label="historyValueColumnLabel" min-width="100">
            <template #default="{ row }">{{ formatNum(row.value) }}</template>
          </el-table-column>
        </el-table>
        <div class="flex flex-wrap justify-end gap-2 mt-3">
          <el-button size="small" @click="onViewMoreHistory">查看更多</el-button>
          <el-button size="small" type="primary" plain @click="exportHistoryData">导出历史数据</el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button @click="emit('update:visible', false)">关闭</el-button>
        <el-button type="primary" @click="exportTestReport">导出测试报告</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import ChartContainer from '@/components/ChartContainer.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  metric: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const HISTORY_RANGE_OPTIONS = [
  { label: '最近2小时', value: '2h' },
  { label: '最近6小时', value: '6h' },
  { label: '最近24小时', value: '24h' }
]

const testMode = ref('live')
const manualValue = ref(1382)
const manualResult = ref(null)
const liveValue = ref(1471)
const liveTime = ref('')
const liveDisplay = ref('1,471')
const historyRange = ref('2h')
const historyRows = ref([])

const historyChartOption = reactive({
  color: ['#4F46E5'],
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#EEF2F6',
    borderWidth: 1,
    textStyle: { color: '#1F2937' }
  },
  grid: { left: '3%', right: '4%', bottom: '10%', top: '12%', containLabel: true },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: { lineStyle: { color: '#E4E7EC' } },
    axisLabel: { color: '#5B6871', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    name: '',
    splitLine: { lineStyle: { color: '#EEF2F6' } },
    axisLabel: { color: '#5B6871' }
  },
  series: [
    {
      name: '数值',
      type: 'line',
      smooth: true,
      data: [],
      lineStyle: { color: '#4F46E5', width: 2 },
      symbol: 'circle',
      symbolSize: 7,
      itemStyle: { color: '#4F46E5', borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear',
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79,70,229,0.2)' },
            { offset: 1, color: 'rgba(79,70,229,0.02)' }
          ]
        }
      }
    }
  ]
})

const dataSourceDisplay = computed(() => {
  const m = props.metric
  if (!m) return ''
  const cfg = m.config || {}
  const base = String(cfg.apiUrl || m.apiUrl || '').trim().replace(/\/$/, '')
  const path = String(cfg.apiPath || '').trim()
  if (base) {
    if (!path) return `${base}/realtime`
    return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
  }
  const code = m.code || 'metric'
  return `https://api.energy.com/v1/${code.replace(/-/g, '/').toLowerCase()}/realtime`
})

const historyChartSubtitle = computed(() => {
  const labels = { '2h': '近2小时', '6h': '近6小时', '24h': '近24小时' }
  return `${labels[historyRange.value] || ''}数据趋势`
})

const historyValueColumnLabel = computed(() => {
  const u = props.metric?.unit
  return u ? `值(${u})` : '值'
})

const currentTestValue = computed(() =>
  testMode.value === 'manual' ? manualValue.value : liveValue.value
)

const ruleVerifyRows = computed(() => buildRuleVerifyRows(props.metric, currentTestValue.value, historyRows.value))

function formatNum(n) {
  return typeof n === 'number' ? n.toLocaleString() : n
}

function buildRuleVerifyRows(metric, currentVal, history) {
  if (!metric) return []
  const unit = metric.unit || 'kWh'
  const sorted = [...history].sort((a, b) => (a.time < b.time ? -1 : 1))
  const oldest = sorted[0]
  const prevVal = oldest?.value ?? currentVal * 0.92
  const wow = prevVal ? ((currentVal - prevVal) / prevVal) * 100 : 0

  const codeStr = String(metric.code || '')
  const isEnergy =
    /kwh/i.test(unit) &&
    (metric.metricType === 'POWER' ||
      metric.metricCategory === 'REALTIME' ||
      /POWER|REALTIME/i.test(codeStr) ||
      /电|能耗|power/i.test(`${metric.name} ${metric.code}`))

  if (isEnergy) {
    return [
      {
        name: '用电量过高预警',
        condition: `当前值 > 1000 ${unit}`,
        triggered: currentVal > 1000,
        result: currentVal > 1000 ? '将生成黄色预警' : '未达阈值'
      },
      {
        name: '用电量突增预警',
        condition: '环比 > 30%',
        triggered: wow > 30,
        result: wow > 30 ? '将生成橙色预警' : `当前环比${wow.toFixed(0)}%`
      }
    ]
  }

  return [
    {
      name: `${metric.name}阈值校验`,
      condition: `当前值 > 0 ${unit}`,
      triggered: currentVal > 0,
      result: currentVal > 0 ? '满足监测条件' : '无有效读数'
    },
    {
      name: '波动率校验',
      condition: '环比 > 30%',
      triggered: Math.abs(wow) > 30,
      result: Math.abs(wow) > 30 ? '波动偏大，建议关注' : `当前环比${wow.toFixed(0)}%`
    }
  ]
}

function buildHistory(base, range) {
  const cfg = {
    '2h': { steps: 6, minutesStep: 20 },
    '6h': { steps: 8, minutesStep: 45 },
    '24h': { steps: 12, minutesStep: 120 }
  }
  const { steps, minutesStep } = cfg[range] || cfg['2h']
  const now = new Date()
  const rows = []
  const pad = (x) => String(x).padStart(2, '0')
  for (let i = steps - 1; i >= 0; i -= 1) {
    const t = new Date(now.getTime() - i * minutesStep * 60 * 1000)
    const str = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
    const noise = (steps - i) * 18 + Math.round(Math.random() * 12)
    rows.push({ time: str, value: Math.round(base - noise) })
  }
  rows[rows.length - 1].value = Math.round(base)
  return rows
}

function updateHistoryChart(rows, unit) {
  const shortTime = (full) => {
    const parts = full.split(' ')
    if (parts.length < 2) return full
    return parts[1].slice(0, 5)
  }
  historyChartOption.xAxis.data = rows.map((r) => shortTime(r.time))
  historyChartOption.series[0].data = rows.map((r) => r.value)
  historyChartOption.yAxis.name = unit ? `(${unit})` : ''
}

function fetchLive() {
  if (!props.metric) return
  const base = 1320 + Math.floor(Math.random() * 180)
  liveValue.value = base
  liveDisplay.value = base.toLocaleString()
  const d = new Date()
  const pad = (x) => String(x).padStart(2, '0')
  liveTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  historyRows.value = buildHistory(base, historyRange.value)
  updateHistoryChart(historyRows.value, props.metric.unit)
  ElMessage.success('已获取最新数据（模拟）')
}

function onHistoryRangeChange() {
  if (!props.metric) return
  historyRows.value = buildHistory(liveValue.value, historyRange.value)
  updateHistoryChart(historyRows.value, props.metric.unit)
}

function runManualTest() {
  manualResult.value = {
    ok: manualValue.value >= 0,
    msg: manualValue.value >= 0 ? '模拟值格式与范围校验通过' : '数值无效'
  }
  historyRows.value = buildHistory(manualValue.value, historyRange.value)
  updateHistoryChart(historyRows.value, props.metric?.unit)
}

function copySourceUrl() {
  const url = dataSourceDisplay.value
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => ElMessage.success('已复制数据来源链接'))
  } else {
    ElMessage.info(url)
  }
}

function onViewMoreHistory() {
  ElMessage.info('完整历史可在指标详情或数据仓库中查询（演示）')
}

function exportHistoryData() {
  if (!props.metric || !historyRows.value.length) {
    ElMessage.warning('暂无历史数据')
    return
  }
  const u = props.metric.unit || ''
  const header = `时间,值${u ? `(${u})` : ''}\n`
  const lines = historyRows.value.map((r) => `${r.time},${r.value}`).join('\n')
  const blob = new Blob([header + lines], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `metric-history-${props.metric.code || 'export'}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('历史数据已导出')
}

function exportTestReport() {
  if (!props.metric) return
  const payload = {
    metricName: props.metric.name,
    metricCode: props.metric.code,
    testMode: testMode.value,
    testTime: liveTime.value || new Date().toISOString(),
    currentValue: currentTestValue.value,
    unit: props.metric.unit,
    dataSource: dataSourceDisplay.value,
    historyRange: historyRange.value,
    ruleResults: ruleVerifyRows.value,
    historySample: historyRows.value.slice(-10)
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `metric-test-report-${props.metric.code || 'report'}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('测试报告已导出')
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.metric) {
      testMode.value = 'live'
      manualResult.value = null
      fetchLive()
    }
  }
)

watch(testMode, (m) => {
  if (m === 'manual' && props.metric && props.visible) {
    historyRows.value = buildHistory(manualValue.value, historyRange.value)
    updateHistoryChart(historyRows.value, props.metric.unit)
  } else if (m === 'live' && props.metric && props.visible) {
    fetchLive()
  }
})
</script>

<style scoped>
.metric-test-body :deep(.el-radio) {
  margin-right: 16px;
}
</style>

<!--
  弹窗 teleport 到 body，scoped 样式无法可靠命中 .el-dialog。
  以下用完整选择器固定弹窗高度，并仅让 .el-dialog__body 滚动（含底部按钮始终可见）。
-->
<style>
.el-overlay.el-modal-dialog:has(.metric-test-dialog),
.el-overlay:has(.metric-test-dialog) {
  overflow: hidden !important;
}

.el-overlay-dialog:has(.metric-test-dialog) {
  overflow: hidden !important;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: clamp(12px, 2.5vh, 32px) 16px;
  box-sizing: border-box;
}

/* flex 子项默认 min-height:auto 会随内容撑破视口，需限制高度并允许内部滚动 */
.el-overlay-dialog:has(.metric-test-dialog) .el-dialog.metric-test-dialog {
  height: min(860px, calc(100vh - 48px)) !important;
  max-height: calc(100vh - 48px) !important;
  min-height: 0 !important;
  margin: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.el-overlay-dialog:has(.metric-test-dialog) .el-dialog.metric-test-dialog .el-dialog__header {
  flex-shrink: 0;
  padding-bottom: 12px;
}

.el-overlay-dialog:has(.metric-test-dialog) .el-dialog.metric-test-dialog .el-dialog__body {
  flex: 1 1 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-top: 4px;
  padding-bottom: 8px;
}

.el-overlay-dialog:has(.metric-test-dialog) .el-dialog.metric-test-dialog .el-dialog__footer {
  flex-shrink: 0;
  padding-top: 12px;
}
</style>
