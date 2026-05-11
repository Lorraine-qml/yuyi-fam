/**
 * 全局事件分类（系统设置维护）。
 * rule.eventCategory / 推送 mock / 事件中存统一 ID。
 */
import { reactive } from 'vue'
import { DEFAULT_ALLOWED_LEVEL_KEYS, normalizeAllowedLevelKeys } from '@/constants/eventLevelStandards'

const LS_KEY = 'yuyi-event-categories-v1'

/** 所属板块编码 → 中文（与数据库说明一致） */
export const EVENT_SECTOR_OPTIONS = [
  { value: 'ENERGY', label: '能耗管理' },
  { value: 'SECURITY', label: '安全管理' },
  { value: 'CANTEEN', label: '食堂管理' },
  { value: 'PROPERTY', label: '物业管理' },
  { value: 'ASSET', label: '资产管理' }
]

/** 内置种子（可被超级管理员扩充；名称在系统内唯一） */
const SEED = [
  { id: 'ec-energy-anomaly', name: '用电异常', sector: 'ENERGY', description: '用电超限、电量突增等异常情况', enabled: true },
  { id: 'ec-device-offline', name: '设备离线', sector: 'ENERGY', description: '电表、水表等离线', enabled: true },
  { id: 'ec-fire-alarm', name: '消防报警', sector: 'SECURITY', description: '烟感、温感等报警', enabled: true },
  { id: 'ec-safety-alert', name: '安全告警', sector: 'SECURITY', description: '安防、周界等告警', enabled: true },
  { id: 'ec-fire-special', name: '消防专项', sector: 'SECURITY', description: '消防专项检查与专项规则', enabled: true },
  { id: 'ec-canteen-morning', name: '晨检异常', sector: 'CANTEEN', description: '食堂晨检不合格等', enabled: true },
  { id: 'ec-canteen-safety', name: '食堂安全', sector: 'CANTEEN', description: '留样、三清三关等食堂安全事项', enabled: true },
  { id: 'ec-property-ops', name: '物业运维', sector: 'PROPERTY', description: '工单积压、报修等与物业运维相关', enabled: true }
]

/** 兼容旧数据的「标签 → 内置 id」映射（历史规则存中文名时使用） */
const LEGACY_NAME_TO_ID = {
  能耗异常: 'ec-energy-anomaly',
  用电异常: 'ec-energy-anomaly',
  安全告警: 'ec-safety-alert',
  食堂安全: 'ec-canteen-safety',
  物业运维: 'ec-property-ops',
  消防专项: 'ec-fire-special'
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

function writeLs(rows) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

const SECTOR_CODES = EVENT_SECTOR_OPTIONS.map((s) => s.value)

export function deserializeCategories(arr) {
  const rows = (Array.isArray(arr) ? arr : [])
    .filter((r) => r && typeof r.id === 'string' && String(r.id).trim())
    .map((r) => ({
      id: String(r.id).trim(),
      name: String(r.name || '').trim(),
      sector: SECTOR_CODES.includes(r.sector) ? r.sector : 'ENERGY',
      description: typeof r.description === 'string' ? r.description : '',
      enabled: r.enabled !== false,
      updatedAt: r.updatedAt || '',
      allowedLevels: normalizeAllowedLevelKeys(r.allowedLevels ?? r.allowed_levels)
    }))
  return rows
}

const store = reactive({ list: [...deserializeCategories(SEED)] })

function syncList(rows) {
  store.list = rows
}

export function hydrateStoreIfNeeded() {
  const stored = readLs()
  if (stored?.length) {
    const rows = deserializeCategories(stored)
    if (rows.length) {
      syncList(rows)
      return
    }
  }
  syncList(deserializeCategories(SEED))
  writeLs(store.list.slice())
}

/** @internal 快照 */
export function _listSnapshot() {
  return store.list.slice()
}

function nextId() {
  return `ec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function hydrateEventCategoriesOnce() {
  hydrateStoreIfNeeded()
}

hydrateStoreIfNeeded()

export function listEventCategories(filters = {}) {
  let rows = [...store.list]
  const { sector, enabledOnly, keyword } = filters
  if (sector) rows = rows.filter((r) => r.sector === sector)
  if (enabledOnly) rows = rows.filter((r) => r.enabled)
  if (keyword && String(keyword).trim()) {
    const k = String(keyword).trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(k) || (r.description && r.description.toLowerCase().includes(k))
    )
  }
  rows.sort((a, b) => {
    const s = EVENT_SECTOR_OPTIONS.findIndex((x) => x.value === a.sector)
    const t = EVENT_SECTOR_OPTIONS.findIndex((x) => x.value === b.sector)
    if (s !== t) return s - t
    return a.name.localeCompare(b.name, 'zh-CN')
  })
  return rows
}

export function getEventCategoryById(id) {
  if (!id) return null
  return store.list.find((x) => x.id === id) || null
}

export function getEventCategoryLabel(idOrLegacy) {
  if (!idOrLegacy && idOrLegacy !== 0) return '—'
  const raw = String(idOrLegacy)
  const norm = LEGACY_NAME_TO_ID[raw] || raw
  const row = store.list.find((x) => x.id === norm)
  if (row) return row.name
  /** 仍可能是未被迁移的旧中文文案 */
  if (LEGACY_NAME_TO_ID[raw]) return getEventCategoryById(LEGACY_NAME_TO_ID[raw])?.name || raw
  return raw
}

/**
 * @param {*} input 规则表中 eventCategory（id 或历史中文）
 * @returns {string} id
 */
export function normalizeEventCategoryId(input) {
  if (!input && input !== 0) return 'ec-energy-anomaly'
  const s = String(input).trim()
  if (getEventCategoryById(s)) return s
  if (LEGACY_NAME_TO_ID[s]) return LEGACY_NAME_TO_ID[s]
  /** 退回默认 */
  const byName = store.list.find((x) => x.name === s)
  return byName?.id || 'ec-energy-anomaly'
}

/**
 * Select：仅启用分类，按板块分组 [{ sector, sectorLabel, options: [{ value,label }]}]
 */
export function getGroupedEnabledEventCategorySelect() {
  const enabled = store.list.filter((r) => r.enabled)
  const bySector = new Map()
  EVENT_SECTOR_OPTIONS.forEach((s) => bySector.set(s.value, []))
  enabled.forEach((r) => {
    const arr = bySector.get(r.sector) || []
    arr.push({ value: r.id, label: r.name })
    bySector.set(r.sector, arr)
  })
  return EVENT_SECTOR_OPTIONS.map((s) => ({
    sector: s.value,
    sectorLabel: s.label,
    options: bySector.get(s.value) || []
  })).filter((g) => g.options.length > 0)
}

export function isEventCategoryDuplicateName(name, excludeId) {
  const n = String(name || '').trim()
  return store.list.some((x) => x.name === n && x.id !== excludeId)
}

export function upsertEventCategory(row) {
  const idx = row.id ? store.list.findIndex((x) => x.id === row.id) : -1
  const id = idx >= 0 ? store.list[idx].id : row.id || nextId()
  const prev = idx >= 0 ? store.list[idx] : null
  const allowedLevels = normalizeAllowedLevelKeys(row.allowedLevels ?? prev?.allowedLevels)
  const next = {
    id,
    name: String(row.name || '').trim(),
    sector: row.sector,
    description: row.description || '',
    enabled: row.enabled !== false,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    allowedLevels: allowedLevels?.length ? allowedLevels : [...DEFAULT_ALLOWED_LEVEL_KEYS]
  }
  const list = [...store.list]
  if (idx >= 0) list[idx] = next
  else list.push(next)
  syncList(list)
  writeLs(list)
  return next
}

export function setEventCategoryEnabled(id, enabled) {
  const list = [...store.list]
  const ix = list.findIndex((x) => x.id === id)
  if (ix < 0) return false
  list[ix] = { ...list[ix], enabled }
  syncList(list)
  writeLs(list)
  return true
}

export function deleteEventCategory(id) {
  const list = [...store.list].filter((x) => x.id !== id)
  if (list.length === store.list.length) return false
  syncList(list)
  writeLs(list)
  return true
}

/** 兼容性：旧组件 static import；请改用 getGroupedEnabledEventCategorySelect */
export const EVENT_CATEGORY_OPTIONS = []
