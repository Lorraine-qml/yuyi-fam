/** 风险规则模拟数据、等级、模板 */

import { SECTOR_OPTIONS } from './riskMetricsMock'
import { normalizeEventCategoryId } from './eventCategories'

/** 指标编码前缀（如 ENERGY-POWER-001）→ 板块代码 */
export function sectorCodeForMetricCode(metricCode) {
  const p = String(metricCode || '').split('-')[0]
  return p || ''
}

/** 指标编码 → 所属板块展示名（与指标业务板块一致） */
export function sectorLabelForMetricCode(metricCode) {
  const code = sectorCodeForMetricCode(metricCode)
  if (!code) return '—'
  return SECTOR_OPTIONS.find((s) => s.value === code)?.label || code
}

export const RULE_LEVEL_OPTIONS = [
  { label: '严重(红色)', value: 1, tag: 'danger', labelShort: '红色' },
  { label: '重要(橙色)', value: 2, tag: 'warning', labelShort: '橙色' },
  { label: '一般(黄色)', value: 3, tag: 'warning', labelShort: '黄色' },
  { label: '提示(蓝色)', value: 4, tag: 'info', labelShort: '蓝色' }
]

export const OP_OPTIONS = [
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '≥', value: '>=' },
  { label: '≤', value: '<=' },
  { label: '=', value: '==' },
  { label: '≠', value: '!=' }
]

export const WORK_ORDER_TYPE_OPTIONS = [
  { label: '简要工单处理', value: '简要工单处理' },
  { label: '标准工单', value: '标准工单' },
  { label: '紧急抢修', value: '紧急抢修' }
]

/** 将存储的版本标签显示为中文（兼容历史形如 v1 的数据） */
export function humanizeRuleVersionLabel(versionLabel, versionNum) {
  if (versionLabel != null && String(versionLabel).trim() !== '') {
    const s = String(versionLabel).trim()
    const m = s.match(/^v(\d+)$/i)
    if (m) return `第 ${m[1]} 版`
    return s
  }
  const n = Number(versionNum)
  return Number.isFinite(n) && n >= 1 ? `第 ${n} 版` : ''
}

let _rid = 0
function rid() {
  _rid += 1
  return `rr-${_rid}`
}

export function levelMeta(level) {
  return RULE_LEVEL_OPTIONS.find((l) => l.value === level) || RULE_LEVEL_OPTIONS[2]
}

function buildExpr(parts) {
  const { valueType, primaryOp, primaryValue, extraConditions = [], conditionLogic } = parts
  const esc = (v, vt) =>
    (vt === 'string' ? `'${String(v).replace(/'/g, "\\'")}'` : v)
  let s = `{value} ${primaryOp} ${esc(primaryValue, valueType)}`
  extraConditions.forEach((ex) => {
    const ev = esc(ex.value, ex.valueType || 'number')
    s += ` ${conditionLogic} {value} ${ex.op} ${ev}`
  })
  return s
}

function displayExpr(parts) {
  const { metricName, primaryOp, primaryValue, primaryUnit, valueType, extraConditions, conditionLogic } =
    parts
  const pv = valueType === 'string' ? `'${primaryValue}'` : primaryValue
  let s = `${metricName} ${primaryOp} ${pv}${primaryUnit ? ` ${primaryUnit}` : ''}`
  extraConditions.forEach((ex) => {
    const m = ex.metricName || '指标'
    const ev = ex.valueType === 'string' ? `'${ex.value}'` : ex.value
    s += ` ${conditionLogic} ${m} ${ex.op} ${ev}${ex.unit ? ` ${ex.unit}` : ''}`
  })
  return s
}

export function createEmptyRuleForm() {
  return {
    name: '',
    metricCode: '',
    metricName: '',
    runMode: 'trial',
    description: '',
    valueType: 'number',
    primaryOp: '>=',
    primaryValue: 30,
    primaryUnit: '%',
    extraConditions: [],
    conditionLogic: 'AND',
    timeWindow: 'none',
    dailyStart: '09:00',
    dailyEnd: '18:00',
    silenceMinutes: 30,
    level: 2,
    eventCategory: 'ec-energy-anomaly',
    workOrderEnabled: true,
    workOrderType: '简要工单处理',
    effectiveFrom: '',
    effectiveTo: ''
  }
}

/** 预置模板（文档 3.4） */
export const RULE_TEMPLATES = [
  {
    category: '能耗',
    name: '用电量过高',
    metricCode: 'ENERGY-POWER-001',
    metricName: '用电实时值',
    expression: '{value} > 1500',
    level: 3,
    eventCategory: 'ec-energy-anomaly',
    description: '瞬时用电超限',
    primaryOp: '>',
    primaryValue: 1500,
    primaryUnit: 'kWh',
    valueType: 'number'
  },
  {
    category: '能耗',
    name: '用电量突增',
    metricCode: 'ENERGY-POWER-002',
    metricName: '用电突增率',
    expression: '{value} > 30',
    level: 2,
    eventCategory: 'ec-energy-anomaly',
    description: '环比上升超30%',
    primaryOp: '>',
    primaryValue: 30,
    primaryUnit: '%',
    valueType: 'number'
  },
  {
    category: '能耗',
    name: '电表离线',
    metricCode: 'ENERGY-POWER-001',
    metricName: '用电实时值',
    expression: '{value} == 0',
    level: 1,
    eventCategory: 'ec-device-offline',
    description: '电表离线超5分钟（演示绑定指标）',
    primaryOp: '==',
    primaryValue: 0,
    primaryUnit: '',
    valueType: 'number'
  },
  {
    category: '能耗',
    name: '夜间用水异常',
    metricCode: 'ENERGY-POWER-001',
    metricName: '用电实时值',
    expression: '{value} > 0.5',
    level: 3,
    eventCategory: 'ec-energy-anomaly',
    description: '凌晨0-5点用水（演示）',
    primaryOp: '>',
    primaryValue: 0.5,
    primaryUnit: '吨',
    valueType: 'number'
  },
  {
    category: '安全',
    name: '消防报警',
    metricCode: 'SECURITY-FIRE-001',
    metricName: '消防设备离线率',
    expression: '{value} >= 1',
    level: 1,
    eventCategory: 'ec-fire-special',
    description: '出现任何消防报警（演示阈值）',
    primaryOp: '>=',
    primaryValue: 1,
    primaryUnit: '次',
    valueType: 'number'
  },
  {
    category: '安全',
    name: '消防设备离线率',
    metricCode: 'SECURITY-FIRE-001',
    metricName: '消防设备离线率',
    expression: '{value} > 5',
    level: 2,
    eventCategory: 'ec-safety-alert',
    description: '离线率超5%',
    primaryOp: '>',
    primaryValue: 5,
    primaryUnit: '%',
    valueType: 'number'
  },
  {
    category: '安全',
    name: '隐患未整改超期',
    metricCode: 'SECURITY-FIRE-001',
    metricName: '消防设备离线率',
    expression: '{value} > 7',
    level: 3,
    eventCategory: 'ec-safety-alert',
    description: '隐患超过7天未改（演示）',
    primaryOp: '>',
    primaryValue: 7,
    primaryUnit: '天',
    valueType: 'number'
  },
  {
    category: '安全',
    name: '监控设备离线',
    metricCode: 'SECURITY-FIRE-001',
    metricName: '消防设备离线率',
    expression: '{value} == 0',
    level: 2,
    eventCategory: 'ec-safety-alert',
    description: '监控离线超10分钟（演示）',
    primaryOp: '==',
    primaryValue: 0,
    valueType: 'number'
  },
  {
    category: '食堂',
    name: '晨检不合格',
    metricCode: 'CANTEEN-CHECK-001',
    metricName: '晨检不合格次数',
    expression: "{value} == '不合格'",
    level: 2,
    eventCategory: 'ec-canteen-morning',
    description: '晨检未通过',
    primaryOp: '==',
    primaryValue: '不合格',
    primaryUnit: '',
    valueType: 'string',
    eventPreview: '食堂晨检不合格'
  },
  {
    category: '食堂',
    name: '留样菜异常',
    metricCode: 'CANTEEN-CHECK-001',
    metricName: '晨检不合格次数',
    expression: "{value} != '正常'",
    level: 1,
    eventCategory: 'ec-canteen-safety',
    description: '留样菜异常',
    primaryOp: '!=',
    primaryValue: '正常',
    valueType: 'string'
  },
  {
    category: '食堂',
    name: '三清三关未完成',
    metricCode: 'CANTEEN-CHECK-001',
    metricName: '晨检不合格次数',
    expression: '{value} == 0',
    level: 3,
    eventCategory: 'ec-canteen-safety',
    description: '闭餐后未执行（演示）',
    primaryOp: '==',
    primaryValue: 0,
    valueType: 'number'
  },
  {
    category: '物业',
    name: '工单积压',
    metricCode: 'PROPERTY-WO-001',
    metricName: '待处理工单数',
    expression: '{value} > 10',
    level: 3,
    eventCategory: 'ec-property-ops',
    description: '工单积压超限',
    primaryOp: '>',
    primaryValue: 10,
    primaryUnit: '条',
    valueType: 'number'
  },
  {
    category: '物业',
    name: '工单超时',
    metricCode: 'PROPERTY-WO-001',
    metricName: '待处理工单数',
    expression: '{value} > 4',
    level: 2,
    eventCategory: 'ec-property-ops',
    description: '超4小时未处理（演示）',
    primaryOp: '>',
    primaryValue: 4,
    primaryUnit: '小时',
    valueType: 'number'
  },
  {
    category: '物业',
    name: '重复报修',
    metricCode: 'PROPERTY-WO-001',
    metricName: '待处理工单数',
    expression: 'consecutive({value} >= 3, 7d)',
    level: 3,
    eventCategory: 'ec-property-ops',
    description: '7天内报修≥3次',
    primaryOp: '>=',
    primaryValue: 3,
    valueType: 'number'
  }
]

export function seedRiskRules() {
  const rules = []
  RULE_TEMPLATES.slice(0, 8).forEach((t, idx) => {
    const lm = levelMeta(t.level)
    rules.push({
      /** 首条规则与实时事件 mock 的 ruleId 对齐，便于「查看规则详情」跳转 */
      id: idx === 0 ? 'rule-energy-001' : rid(),
      name: t.name,
      sector: sectorCodeForMetricCode(t.metricCode),
      sectorLabel: sectorLabelForMetricCode(t.metricCode),
      metricCode: t.metricCode,
      metricName: t.metricName,
      expression: t.expression,
      expressionDisplay: t.expression,
      level: t.level,
      levelLabel: lm.labelShort,
      levelTag: lm.tag,
      status: 'enabled',
      runMode: 'production',
      lifecycleStatus: 'production',
      version: 1,
      versionLabel: '第 1 版',
      eventCategory: t.eventCategory,
      description: t.description,
      primaryOp: t.primaryOp,
      primaryValue: t.primaryValue,
      primaryUnit: t.primaryUnit || '',
      valueType: t.valueType || 'number',
      silenceMinutes: 30,
      conditionLogic: 'AND',
      timeWindow: 'none',
      dailyStart: '09:00',
      dailyEnd: '18:00',
      workOrderEnabled: true,
      workOrderType: '简要工单处理',
      extraConditions: [],
      eventPreview: t.eventPreview || '',
      deleted: false,
      versionHistory: []
    })
  })

  const lm2 = levelMeta(2)
  rules.push({
    id: rid(),
    name: '晨检不合格',
    sector: 'CANTEEN',
    sectorLabel: sectorLabelForMetricCode('CANTEEN-CHECK-001'),
    metricCode: 'CANTEEN-CHECK-001',
    metricName: '晨检不合格次数',
    expression: "{value} == '不合格'",
    expressionDisplay: "{value} == '不合格'",
    level: 2,
    levelLabel: lm2.labelShort,
    levelTag: lm2.tag,
    status: 'enabled',
    runMode: 'trial',
    lifecycleStatus: 'trial',
    version: 1,
    versionLabel: '第 1 版',
    eventCategory: 'ec-canteen-morning',
    description: '试运行：晨检未通过',
    primaryOp: '==',
    primaryValue: '不合格',
    primaryUnit: '',
    valueType: 'string',
    silenceMinutes: 30,
    conditionLogic: 'AND',
    timeWindow: 'none',
    dailyStart: '09:00',
    dailyEnd: '18:00',
    workOrderEnabled: true,
    workOrderType: '简要工单处理',
    extraConditions: [],
    eventPreview: '食堂晨检不合格',
    deleted: false,
    versionHistory: []
  })

  return rules
}

export function ruleToForm(rule) {
  return {
    name: rule.name,
    metricCode: rule.metricCode,
    metricName: rule.metricName,
    runMode: rule.runMode,
    description: rule.description || '',
    valueType: rule.valueType || 'number',
    primaryOp: rule.primaryOp || '>',
    primaryValue: rule.primaryValue,
    primaryUnit: rule.primaryUnit || '',
    extraConditions: JSON.parse(JSON.stringify(rule.extraConditions || [])),
    conditionLogic: rule.conditionLogic || 'AND',
    timeWindow: rule.timeWindow || 'none',
    dailyStart: rule.dailyStart || '09:00',
    dailyEnd: rule.dailyEnd || '18:00',
    silenceMinutes: rule.silenceMinutes ?? 30,
    level: rule.level,
    eventCategory: normalizeEventCategoryId(rule.eventCategory),
    workOrderEnabled: rule.workOrderEnabled !== false,
    workOrderType: rule.workOrderType || '简要工单处理',
    effectiveFrom: rule.effectiveFrom || '',
    effectiveTo: rule.effectiveTo || ''
  }
}

export function formToRulePayload(form, metricOptions) {
  const m = metricOptions.find((x) => x.value === form.metricCode)
  const metricName = m?.name || form.metricName || ''
  const extras = (form.extraConditions || []).map((ex) => ({
    ...ex,
    metricName:
      metricOptions.find((x) => x.value === ex.metricCode)?.name || ex.metricName || ''
  }))
  const exprParts = {
    metricName,
    valueType: form.valueType,
    primaryOp: form.primaryOp,
    primaryValue: form.primaryValue,
    primaryUnit: form.primaryUnit,
    extraConditions: extras,
    conditionLogic: form.conditionLogic
  }
  const expression = buildExpr({
    valueType: form.valueType,
    primaryOp: form.primaryOp,
    primaryValue: form.primaryValue,
    extraConditions: extras,
    conditionLogic: form.conditionLogic
  })
  const expressionDisplay = displayExpr(exprParts)
  const lm = levelMeta(form.level)
  const sector = sectorCodeForMetricCode(form.metricCode)
  const sectorLabel = sectorLabelForMetricCode(form.metricCode)
  return {
    name: (form.name || '').trim(),
    sector,
    sectorLabel,
    metricCode: form.metricCode,
    metricName,
    description: form.description,
    runMode: form.runMode,
    lifecycleStatus: form.runMode === 'trial' ? 'trial' : 'production',
    valueType: form.valueType,
    primaryOp: form.primaryOp,
    primaryValue: form.primaryValue,
    primaryUnit: form.primaryUnit,
    extraConditions: form.extraConditions,
    conditionLogic: form.conditionLogic,
    timeWindow: form.timeWindow,
    dailyStart: form.dailyStart,
    dailyEnd: form.dailyEnd,
    silenceMinutes: form.silenceMinutes,
    level: form.level,
    levelLabel: lm.labelShort,
    levelTag: lm.tag,
    eventCategory: form.eventCategory,
    workOrderEnabled: form.workOrderEnabled,
    workOrderType: form.workOrderType,
    effectiveFrom: form.effectiveFrom,
    effectiveTo: form.effectiveTo,
    expression,
    expressionDisplay,
    extraConditions: extras
  }
}

/** 全站共用一份运行时规则数组（风险规则页与分类统计共用，避免数据漂移） */
let _sharedRiskRules = null

export function getSharedRiskRules() {
  if (!_sharedRiskRules) _sharedRiskRules = seedRiskRules()
  return _sharedRiskRules
}
