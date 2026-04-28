/**
 * 系统规则模板：tenant_id=0；超级管理员可通过抽屉维护，写入 localStorage 演示持久化，
 * 正式环境对应 GET/POST /templates/system。
 */
import { reactive } from 'vue'
import { RULE_TEMPLATES } from './riskRulesMock'
import { getStandardMetricTypeByName, getStandardMetricTypeByKey, resolveStandardMetricKey } from './riskStandardMetrics'

const LS_KEY = 'yuyi-system-templates-admin-v1'

function presetRowFromTemplate(t, i) {
  const std = getStandardMetricTypeByName(t.metricName)
  return {
    id: `sys-tpl-${i}`,
    tenant_id: 0,
    isSystem: true,
    name: t.name,
    category: t.category,
    standardMetricTypeKey: std?.key || resolveStandardMetricKey(t.metricName),
    standardMetricTypeName: t.metricName,
    expression: t.expression,
    level: t.level,
    eventCategory: t.eventCategory,
    description: t.description || '',
    primaryOp: t.primaryOp,
    primaryValue: t.primaryValue,
    primaryUnit: t.primaryUnit || '',
    valueType: t.valueType || 'number',
    eventPreview: t.eventPreview || ''
  }
}

function seedPresetList() {
  return RULE_TEMPLATES.map((t, i) => presetRowFromTemplate(t, i))
}

function migrateSystemTemplateStoredRow(row) {
  if (!row || row.standardMetricTypeKey !== 'SM-ENERGY-SPIKE') return row
  const st = getStandardMetricTypeByKey('SM-ENERGY-RATE')
  return {
    ...row,
    standardMetricTypeKey: 'SM-ENERGY-RATE',
    standardMetricTypeName: st?.name || row.standardMetricTypeName || '用电突增率'
  }
}

function readStoredList() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr) || !arr.length) return null
    const migrated = arr.map(migrateSystemTemplateStoredRow)
    if (migrated.some((r, i) => r !== arr[i])) {
      persist(migrated)
    }
    return migrated
  } catch {
    return null
  }
}

function persist(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/** 响应式列表，各处 getSystemTemplates() 引用同步更新视图 */
const _stored = readStoredList()
const _initialList = _stored || seedPresetList()
const store = reactive({
  list: _initialList
})
if (!_stored) {
  persist(_initialList)
}

export function getSystemTemplates() {
  return store.list
}

export function upsertSystemTemplate(row) {
  const next = [...store.list]
  const idx = next.findIndex((x) => x.id === row.id)
  const merged =
    idx >= 0
      ? { ...next[idx], ...row }
      : { ...row, id: row.id || `sys-tpl-${Date.now()}`, tenant_id: 0, isSystem: true }
  if (merged.standardMetricTypeKey && !merged.standardMetricTypeName) {
    const st = getStandardMetricTypeByKey(merged.standardMetricTypeKey)
    if (st) merged.standardMetricTypeName = st.name
  }
  if (idx >= 0) next[idx] = merged
  else next.push(merged)
  store.list = next
  persist(next)
}

export function deleteSystemTemplateById(id) {
  store.list = store.list.filter((x) => x.id !== id)
  persist([...store.list])
}

export function systemTemplateNameExists(name, excludeId) {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return false
  return store.list.some(
    (x) =>
      String(x.name || '').trim().toLowerCase() === n && (!excludeId || x.id !== excludeId)
  )
}

/** 引导式拼装表达式（与预置 RULE_TEMPLATES 风格一致） */
export function buildSystemTemplateExpression(parts) {
  const { valueType = 'number', primaryOp, primaryValue } = parts
  if (primaryOp == null || String(primaryOp).trim() === '') return ''
  if (primaryValue === undefined || primaryValue === null) return ''
  if (valueType === 'string' && String(primaryValue).trim() === '') return ''
  const esc = (v, vt) =>
    vt === 'string' ? `'${String(v).replace(/'/g, "\\'")}'` : v
  const rhs = esc(primaryValue, valueType)
  return `{value} ${primaryOp} ${rhs}`
}

/** 表格「业务板块」展示文案 */
export function systemTemplateCategoryDisplay(category) {
  const m = {
    能耗: '能耗管理',
    安全: '安全管理',
    食堂: '食堂安全',
    物业: '物业管理',
    资产: '资产管理'
  }
  return m[category] || category || '—'
}
