import { sectorCodeForMetricCode } from '@/data/riskRulesMock'

const CODE_TO_CATEGORY = {
  ENERGY: '能耗',
  SECURITY: '安全',
  CANTEEN: '食堂',
  PROPERTY: '物业',
  ASSET: '资产'
}

/**
 * 从规则行推导模板「业务板块」下拉值（与本项目模板表单一致）
 */
export function templateCategoryFromRule(row) {
  const code = row.sector || sectorCodeForMetricCode(row.metricCode || '')
  if (CODE_TO_CATEGORY[code]) return CODE_TO_CATEGORY[code]
  const lbl = String(row.sectorLabel || '')
  if (/资产/.test(lbl)) return '资产'
  if (/能耗|电|水|用油/.test(lbl)) return '能耗'
  if (/安全|消防|安防/.test(lbl)) return '安全'
  if (/食堂/.test(lbl)) return '食堂'
  if (/物业/.test(lbl)) return '物业'
  return '能耗'
}

/**
 * 规则列表行 → 与本项目模板结构一致的可保存对象（不含 id/tenant）
 */
export function pickRuleFieldsForTemplate(row) {
  return {
    category: templateCategoryFromRule(row),
    metricCode: row.metricCode,
    metricName: row.metricName,
    expression: row.expressionDisplay || row.expression || '',
    level: row.level,
    eventCategory: row.eventCategory || '能耗异常',
    description: row.description || '',
    valueType: row.valueType || 'number',
    primaryOp: row.primaryOp || '>',
    primaryValue: row.primaryValue ?? 0,
    primaryUnit: row.primaryUnit || '',
    eventPreview: row.eventPreview || '',
    extraConditions: Array.isArray(row.extraConditions)
      ? JSON.parse(JSON.stringify(row.extraConditions))
      : [],
    conditionLogic: row.conditionLogic || 'AND'
  }
}

export function templateNameExists(projectTemplates, name, excludeId) {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return false
  return projectTemplates.some(
    (t) =>
      String(t.name || '').trim().toLowerCase() === n && (!excludeId || t.id !== excludeId)
  )
}
