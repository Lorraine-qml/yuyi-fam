/**
 * 事件推送配置（演示）：与事件分类字典 category 存 ID 一致，持久化 localStorage。
 * 内容模板字段对应库表 content_template，前端属性名为 contentTemplate；旧数据中的 template（全角括号）会在加载时迁移为占位符格式。
 */
import { reactive } from 'vue'
import { getEventCategoryLabel, hydrateStoreIfNeeded } from './eventCategories'
import { APPLICABLE_SOURCE } from '@/constants/eventSource'
import {
  DEFAULT_PUSH_CONTENT_TEMPLATE,
  migrateLegacyPushTemplate
} from '@/utils/pushContentTemplate'

hydrateStoreIfNeeded()

const LS_KEY = 'yuyi-event-push-config-v1'

const LEGACY_CATEGORY = {
  access: 'ec-safety-alert',
  video: 'ec-safety-alert',
  fire: 'ec-fire-alarm',
  energy_anomaly: 'ec-energy-anomaly',
  lift: 'ec-property-ops',
  canteen: 'ec-canteen-morning',
  env: 'ec-fire-alarm'
}

function resolveCategoryId(raw) {
  if (!raw) return 'ec-energy-anomaly'
  const s = String(raw)
  return LEGACY_CATEGORY[s] || s
}

function seedRows() {
  return [
    {
      id: 1,
      category: 'ec-safety-alert',
      level: 'high',
      applicableSource: APPLICABLE_SOURCE.ALL,
      notifyChannels: ['ding'],
      effectiveMode: 'permanent',
      dateRange: [],
      workOrderMode: 'full',
      contentTemplate:
        '{event_type}于{start_time}在{location}发生{event_name}，详情：{event_content}。请及时处理。',
      enabled: true,
      updater: '管理员'
    },
    {
      id: 2,
      category: 'ec-safety-alert',
      level: 'medium',
      applicableSource: APPLICABLE_SOURCE.THIRD_PARTY_ONLY,
      notifyChannels: ['ding'],
      effectiveMode: 'range',
      dateRange: ['2023-10-14', '2023-10-22'],
      workOrderMode: 'simple',
      contentTemplate:
        '{event_type}于{start_time}在{location}发生{event_name}，详情：{event_content}。请及时处理。',
      enabled: true,
      updater: '张三'
    },
    {
      id: 3,
      category: 'ec-fire-alarm',
      level: 'low',
      applicableSource: APPLICABLE_SOURCE.RULE_ONLY,
      notifyChannels: ['sms'],
      effectiveMode: 'permanent',
      dateRange: [],
      workOrderMode: 'full',
      contentTemplate:
        '{event_type}于{start_time}在{location}发生{event_name}，详情：{event_content}。请及时处理。',
      enabled: false,
      updater: '李四'
    }
  ]
}

function levelLabel(v) {
  return (
    {
      high: '高',
      medium: '中',
      low: '低',
      urgent: '紧急'
    }[v] || v
  )
}

function formatMethods(channels) {
  const m = { ding: '钉钉通知', sms: '短信', email: '邮件', wework: '企业微信' }
  if (!channels?.length) return '—'
  return channels.map((k) => m[k] || k).join('、')
}

export function deriveRowFields(row) {
  const category = resolveCategoryId(row.category)
  const categoryLabel = getEventCategoryLabel(category)
  const levelLabelText = levelLabel(row.level)
  let effective = '—'
  if (row.effectiveMode === 'permanent') effective = '永久有效'
  else if (row.dateRange?.length === 2) {
    effective = `${row.dateRange[0]} 至 ${row.dateRange[1]}`
  }
  const contentTemplate =
    row.contentTemplate ??
    row.content_template ??
    migrateLegacyPushTemplate(row.template) ??
    DEFAULT_PUSH_CONTENT_TEMPLATE

  return {
    id: row.id,
    category,
    level: row.level,
    applicableSource: row.applicableSource,
    notifyChannels: [...(row.notifyChannels || [])],
    effectiveMode: row.effectiveMode || 'permanent',
    dateRange: row.dateRange ? [...row.dateRange] : [],
    workOrderMode: row.workOrderMode || 'simple',
    contentTemplate,
    enabled: row.enabled !== false,
    updater: row.updater || '管理员',
    categoryLabel,
    levelLabel: levelLabelText,
    method: formatMethods(row.notifyChannels),
    effective
  }
}
function readLs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

function writeLs(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.map(stripDerived)))
  } catch {
    /* ignore */
  }
}

function stripDerived(row) {
  return {
    id: row.id,
    category: row.category,
    level: row.level,
    applicableSource: row.applicableSource,
    notifyChannels: [...(row.notifyChannels || [])],
    effectiveMode: row.effectiveMode || 'permanent',
    dateRange: row.dateRange ? [...row.dateRange] : [],
    workOrderMode: row.workOrderMode || 'simple',
    contentTemplate: row.contentTemplate || DEFAULT_PUSH_CONTENT_TEMPLATE,
    enabled: row.enabled !== false,
    updater: row.updater
  }
}const stored = readLs()
const rawList = stored?.length ? stored : seedRows()
const initial = rawList.map((r) => deriveRowFields({ ...r, category: resolveCategoryId(r.category) }))
if (!stored?.length) {
  writeLs(initial.map(stripDerived))
}

const store = reactive({ list: [...initial] })

export const eventPushConfigStore = store

export function listEventPushConfigs() {
  return store.list.slice()
}

export function upsertPushConfigRow(payload) {
  const list = [...store.list]
  const derived = deriveRowFields(payload)
  const ix = derived.id != null ? list.findIndex((x) => x.id === derived.id) : -1
  if (ix >= 0) list[ix] = derived
  else {
    const id = Math.max(0, ...list.map((r) => Number(r.id) || 0)) + 1
    list.push(deriveRowFields({ ...derived, id }))
  }
  store.list = list
  writeLs(list)
}

export function deletePushConfigRow(id) {
  const list = store.list.filter((x) => x.id !== id)
  if (list.length === store.list.length) return false
  store.list = list
  writeLs(list)
  return true
}

export function toPlainPushRow(row) {
  const s = stripDerived(row)
  return {
    ...s,
    notifyChannels: [...(s.notifyChannels || [])],
    dateRange: s.dateRange ? [...s.dateRange] : []
  }
}

export function patchPushConfigRow(id, partial) {
  const cur = store.list.find((x) => x.id === id)
  if (!cur) return false
  upsertPushConfigRow({ ...toPlainPushRow(cur), ...partial })
  return true
}