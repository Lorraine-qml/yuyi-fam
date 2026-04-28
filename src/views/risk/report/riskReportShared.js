import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCurrentProject } from '@/composables/useCurrentProject'
import { loadReportState, saveReportState } from '@/data/riskReportProjectState'
import {
  buildPieOption,
  buildPreviewMeta,
  buildTrendWeeksOption,
  getSystemReportTemplates,
  PERIOD_OPTIONS
} from '@/data/riskReportMock'

const { currentProjectId, currentProject } = useCurrentProject()

const systemTemplates = getSystemReportTemplates()
const projectTemplates = ref([])
const schedules = ref([])
const myReports = ref([])

const quick = reactive({
  period: 'week',
  templateId: ''
})

const previewRefId = ref('')
const previewLoading = ref(false)
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

const allTemplates = computed(() => [...systemTemplates, ...projectTemplates.value])

const visibleTemplates = computed(() => allTemplates.value.filter((t) => !t.deleted))

const filteredTemplates = computed(() =>
  visibleTemplates.value.filter((t) => t.periodType === quick.period && t.status === 'enabled')
)

const activeTemplate = computed(() => visibleTemplates.value.find((t) => t.id === quick.templateId))

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
  if (quick.period === 'day') return '2026年04月24日（昨日·演示）'
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

function persist() {
  saveReportState(currentProjectId.value, {
    projectTemplates: projectTemplates.value,
    schedules: schedules.value,
    myReports: myReports.value
  })
}

function loadState() {
  const st = loadReportState(currentProjectId.value, getSystemReportTemplates())
  projectTemplates.value = st.projectTemplates
  schedules.value = st.schedules
  myReports.value = st.myReports
  syncQuickTemplate()
  refreshPreview()
}

export function reloadReportState() {
  loadState()
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

watch(visibleTemplates, () => syncQuickTemplate(), { deep: true })

function onPeriodChange() {
  syncQuickTemplate()
  refreshPreview()
}

function refreshPreview() {
  previewMeta.value = buildPreviewMeta(quick.period)
}

/** 业务规则：单次查询时间范围不宜过大（演示：超过 1 年提示） */
const MAX_REPORT_RANGE_DAYS = 90

function generateReport() {
  if (!quick.templateId) {
    ElMessage.warning('请选择与周期匹配的已启用模板')
    return
  }
  previewLoading.value = true
  window.setTimeout(() => {
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
      generatedAt: nowText.value,
      projectId: currentProjectId.value
    })
    previewRefId.value = id
    refreshPreview()
    previewLoading.value = false
    persist()
    ElMessage.success('报告已生成（模拟），已加入「我的报告」')
  }, 450)
}

function loadHistoryReport(r) {
  previewRefId.value = r.id
  quick.period = r.periodType
  quick.templateId = r.templateId || quick.templateId
  refreshPreview()
}

function buildExportFileName(fmt) {
  const proj = (currentProject.value?.name || '项目').replace(/[/\\?%*:|"<>]/g, '_')
  const typeShort = periodLabel(quick.period).replace('报', '')
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const ext = fmt === 'excel' ? 'xlsx' : fmt === 'word' ? 'docx' : 'pdf'
  return `${proj}_${typeShort}_${dateStr}.${ext}`
}

function exportCurrent(fmt) {
  const name = buildExportFileName(fmt)
  ElMessage.success({
    message: `已准备导出：${name}（模拟下载）`,
    duration: 3500
  })
}

function exportProjectConfig() {
  const payload = {
    version: '3.0',
    tenant_id: currentProjectId.value,
    project: currentProject.value?.name,
    exportTime: nowText.value,
    systemTemplates: getSystemReportTemplates(),
    projectTemplates: projectTemplates.value,
    schedules: schedules.value,
    myReports: myReports.value
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-report-config-${currentProjectId.value}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('配置已导出（含本项目模板与任务）')
}

function confirmPush() {
  pushDialog.value = false
  const subj = `【风险报告】${currentProject.value?.name || ''} ${periodTitle.value}（演示）`
  ElMessage.success(`推送任务已提交（模拟）。主题示例：${subj}`)
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

function copySystemTemplate(row) {
  projectTemplates.value.push({
    id: `rtpl-${Date.now()}`,
    tenant_id: currentProjectId.value,
    isSystem: false,
    name: `${row.name}（项目副本）`,
    periodType: row.periodType,
    status: 'enabled',
    deleted: false,
    chartTheme: row.chartTheme || 'yuyi',
    chartSize: row.chartSize || 'md',
    showDataLabel: row.showDataLabel !== false,
    sections: { ...(row.sections || {}) }
  })
  persist()
  syncQuickTemplate()
  ElMessage.success('已复制为项目模板，可在列表中编辑')
}

async function removeTemplate(row) {
  if (row.isSystem || row.tenant_id === 0) {
    await ElMessageBox.alert(
      '系统预置模板不可删除。可点击「复制为项目」生成本项目副本后再调整。',
      '提示',
      { type: 'info' }
    )
    return
  }
  try {
    await ElMessageBox.confirm('确认删除该项目模板？', '删除', { type: 'warning' })
  } catch {
    return
  }
  row.deleted = true
  syncQuickTemplate()
  persist()
  ElMessage.success('已删除')
}

function onTemplateSaved(payload) {
  const tid = currentProjectId.value
  if (tplDialogMode.value === 'create') {
    projectTemplates.value.push({
      id: `rtpl-${Date.now()}`,
      tenant_id: tid,
      isSystem: false,
      status: 'enabled',
      deleted: false,
      ...payload
    })
  } else if (editingTemplate.value) {
    if (editingTemplate.value.isSystem || editingTemplate.value.tenant_id === 0) {
      ElMessage.warning('系统模板不可直接编辑，请先「复制为项目」')
      return
    }
    Object.assign(editingTemplate.value, payload)
  }
  syncQuickTemplate()
  persist()
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
  persist()
}

async function removeSchedule(row) {
  try {
    await ElMessageBox.confirm('确认删除该任务？', '删除', { type: 'warning' })
  } catch {
    return
  }
  const i = schedules.value.indexOf(row)
  if (i !== -1) schedules.value.splice(i, 1)
  persist()
  ElMessage.success('已删除')
}

function runScheduleOnce(row) {
  row.lastRunAt = nowText.value
  persist()
  ElMessage.success({
    message: '任务已提交，报告生成后将推送至接收人（模拟）',
    duration: 4000
  })
}

function onScheduleToggle(row) {
  persist()
  ElMessage.success(row.enabled ? `已启用「${row.name}」` : `已停用「${row.name}」`)
}

refreshPreview()
loadState()

export function useRiskReportShared() {
  return {
    systemTemplates,
    projectTemplates,
    PERIOD_OPTIONS,
    schedules,
    myReports,
    quick,
    previewRefId,
    previewLoading,
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
    currentProject,
    currentProjectId,
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
    MAX_REPORT_RANGE_DAYS,
    onPeriodChange,
    refreshPreview,
    generateReport,
    loadHistoryReport,
    exportCurrent,
    exportProjectConfig,
    confirmPush,
    openTemplateCreate,
    openTemplateEdit,
    copySystemTemplate,
    removeTemplate,
    onTemplateSaved,
    openScheduleCreate,
    openScheduleEdit,
    onScheduleSaved,
    removeSchedule,
    runScheduleOnce,
    onScheduleToggle,
    persist,
    reloadReportState
  }
}
