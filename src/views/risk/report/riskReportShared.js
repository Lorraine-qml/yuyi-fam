import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  buildPieOption,
  buildPreviewMeta,
  buildTrendWeeksOption,
  PERIOD_OPTIONS,
  seedReportHistory,
  seedReportTemplates,
  seedScheduleTasks
} from '@/data/riskReportMock'

const templates = ref(seedReportTemplates())
const schedules = ref(seedScheduleTasks(templates.value))
const myReports = ref(seedReportHistory(templates.value))

const quick = reactive({
  period: 'week',
  templateId: ''
})

const previewRefId = ref('')
const previewMeta = ref(buildPreviewMeta('week'))
const pieOption = ref(buildPieOption(true))
const trendOption = ref(buildTrendWeeksOption())

const effBarOption = reactive({
  color: ['#4F46E5'],
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['安保科', '物业', '食堂', '工程', '能源'],
    axisLabel: { color: '#5B6871' }
  },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#EEF2F6' } } },
  series: [{ type: 'bar', data: [92, 88, 95, 90, 93], barMaxWidth: 36 }]
})

export const mockOpenRisks = [
  { title: '配电房温升异常', level: '高', time: '2026-04-24 07:20', area: '1号楼', owner: '张三', status: '处置中' },
  { title: '消防通道堆放', level: '中', time: '2026-04-23 16:10', area: '主楼', owner: '李四', status: '待派单' }
]

export const mockRuleHits = [
  { name: '用电量突增', cnt: 42 },
  { name: '晨检不合格', cnt: 28 },
  { name: '工单积压', cnt: 19 },
  { name: '消防设备离线率', cnt: 12 },
  { name: '夜间用水异常', cnt: 9 }
]

const tplDialogVisible = ref(false)
const tplDialogMode = ref('create')
const editingTemplate = ref(null)

const schDialogVisible = ref(false)
const schDialogMode = ref('create')
const editingSchedule = ref(null)

const pushDialog = ref(false)
const pushChannels = reactive({ email: true, ding: true, wecom: false })
const pushTargets = ref('leader@example.com')

const visibleTemplates = computed(() => templates.value.filter((t) => !t.deleted))

const filteredTemplates = computed(() =>
  visibleTemplates.value.filter((t) => t.periodType === quick.period)
)

const activeTemplate = computed(() =>
  visibleTemplates.value.find((t) => t.id === quick.templateId)
)

const activeSections = computed(() => {
  const s = activeTemplate.value?.sections
  if (!s) {
    return {
      header: true,
      overviewCards: true,
      levelPie: true,
      trendLine: true,
      regionTable: true,
      openRisksTable: true,
      ruleStats: false,
      efficiencyBar: false,
      footer: false
    }
  }
  return s
})

const periodTitle = computed(() => PERIOD_OPTIONS.find((p) => p.value === quick.period)?.label || '')

const timeRangeText = computed(() => {
  if (quick.period === 'day') return '2026年04月24日'
  if (quick.period === 'week') return '第16周（04月14日 - 04月20日）'
  if (quick.period === 'month') return '2026年04月'
  if (quick.period === 'quarter') return '2026年第2季度'
  return '2026年度'
})

const overviewSectionTitle = computed(() => {
  if (quick.period === 'day') return '今日风险总览'
  if (quick.period === 'week') return '本周风险总览'
  if (quick.period === 'month') return '本月风险总览'
  return '周期风险总览'
})

const overviewCards = computed(() => {
  const s = previewMeta.value.stats
  return [
    { label: '新增风险', value: `${s.newTotal}起` },
    { label: '已闭环', value: `${s.closed}起` },
    { label: '闭环率', value: `${s.closeRate}%` }
  ]
})

const nowText = computed(() => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
})

function periodLabel(pt) {
  return PERIOD_OPTIONS.find((p) => p.value === pt)?.label || pt
}

function syncQuickTemplate() {
  const list = filteredTemplates.value
  if (!list.length) {
    quick.templateId = ''
    return
  }
  if (!list.some((t) => t.id === quick.templateId)) {
    quick.templateId = list[0].id
  }
}

watch(
  () => quick.period,
  () => {
    syncQuickTemplate()
    refreshPreview()
  },
  { immediate: true }
)

watch(
  () => quick.templateId,
  () => {
    const t = activeTemplate.value
    pieOption.value = buildPieOption(t?.showDataLabel !== false)
  }
)

watch(
  visibleTemplates,
  () => {
    syncQuickTemplate()
  },
  { deep: true }
)

function onPeriodChange() {
  syncQuickTemplate()
  refreshPreview()
}

function refreshPreview() {
  previewMeta.value = buildPreviewMeta(quick.period)
}

function generateReport() {
  if (!quick.templateId) {
    ElMessage.warning('请选择报告模板')
    return
  }
  const tpl = activeTemplate.value
  const pt = periodLabel(quick.period)
  const title = `${nowText.value.slice(0, 10)} ${pt}`
  const id = `rh-${Date.now()}`
  myReports.value.unshift({
    id,
    title,
    periodType: quick.period,
    templateId: tpl?.id,
    templateName: tpl?.name,
    generatedAt: nowText.value
  })
  previewRefId.value = id
  refreshPreview()
  ElMessage.success('报告已生成（模拟），已加入「我的报告」')
}

function loadHistoryReport(r) {
  previewRefId.value = r.id
  quick.period = r.periodType
  quick.templateId = r.templateId || quick.templateId
  refreshPreview()
}

function exportCurrent(fmt) {
  ElMessage.success(`已导出 ${fmt.toUpperCase()}（模拟下载）`)
}

function exportProjectConfig() {
  const payload = {
    version: '2.0',
    project: '机管局',
    exportTime: nowText.value,
    reportTemplates: visibleTemplates.value.map(({ deleted, ...t }) => t),
    schedules: schedules.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-report-config-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出')
}

function confirmPush() {
  pushDialog.value = false
  ElMessage.success('推送任务已提交（模拟）')
}

function openTemplateCreate() {
  tplDialogMode.value = 'create'
  editingTemplate.value = null
  tplDialogVisible.value = true
}

function openTemplateEdit(row) {
  tplDialogMode.value = 'edit'
  editingTemplate.value = row
  tplDialogVisible.value = true
}

async function removeTemplate(row) {
  try {
    await ElMessageBox.confirm('确认删除该模板？', '删除', { type: 'warning' })
  } catch {
    return
  }
  row.deleted = true
  syncQuickTemplate()
  ElMessage.success('已删除')
}

function onTemplateSaved(payload) {
  if (tplDialogMode.value === 'create') {
    templates.value.push({
      id: `rtpl-${Date.now()}`,
      status: 'enabled',
      deleted: false,
      ...payload
    })
  } else if (editingTemplate.value) {
    Object.assign(editingTemplate.value, payload)
  }
  syncQuickTemplate()
}

function openScheduleCreate() {
  schDialogMode.value = 'create'
  editingSchedule.value = null
  schDialogVisible.value = true
}

function openScheduleEdit(row) {
  schDialogMode.value = 'edit'
  editingSchedule.value = row
  schDialogVisible.value = true
}

function onScheduleSaved(payload) {
  if (schDialogMode.value === 'create') {
    schedules.value.unshift({
      id: `rsch-${Date.now()}`,
      lastRunAt: '—',
      ...payload
    })
  } else if (editingSchedule.value) {
    Object.assign(editingSchedule.value, payload)
  }
}

async function removeSchedule(row) {
  try {
    await ElMessageBox.confirm('确认删除该任务？', '删除', { type: 'warning' })
  } catch {
    return
  }
  const i = schedules.value.indexOf(row)
  if (i !== -1) schedules.value.splice(i, 1)
  ElMessage.success('已删除')
}

function runScheduleOnce(row) {
  row.lastRunAt = nowText.value
  ElMessage.success(`已触发「${row.name}」（模拟）`)
}

function onScheduleToggle(row) {
  ElMessage.success(row.enabled ? `已启用「${row.name}」` : `已停用「${row.name}」`)
}

refreshPreview()

export function useRiskReportShared() {
  return {
    PERIOD_OPTIONS,
    templates,
    schedules,
    myReports,
    quick,
    previewRefId,
    previewMeta,
    pieOption,
    trendOption,
    effBarOption,
    tplDialogVisible,
    tplDialogMode,
    editingTemplate,
    schDialogVisible,
    schDialogMode,
    editingSchedule,
    pushDialog,
    pushChannels,
    pushTargets,
    visibleTemplates,
    filteredTemplates,
    activeTemplate,
    activeSections,
    periodTitle,
    timeRangeText,
    overviewSectionTitle,
    overviewCards,
    nowText,
    periodLabel,
    onPeriodChange,
    refreshPreview,
    generateReport,
    loadHistoryReport,
    exportCurrent,
    exportProjectConfig,
    confirmPush,
    openTemplateCreate,
    openTemplateEdit,
    removeTemplate,
    onTemplateSaved,
    openScheduleCreate,
    openScheduleEdit,
    onScheduleSaved,
    removeSchedule,
    runScheduleOnce,
    onScheduleToggle
  }
}
