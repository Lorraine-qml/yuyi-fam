/**
 * 平台标准指标类型（系统模板中引用，通过 key 与项目内实际指标做映射/匹配）
 */

/** 历史 key → 现行平台枚举（读旧数据时用） */
const LEGACY_STANDARD_METRIC_KEYS = {
  'SM-ENERGY-SPIKE': 'SM-ENERGY-RATE'
}

export const STANDARD_METRIC_TYPES = [
  {
    key: 'SM-ENERGY-RT',
    name: '用电实时值',
    defaultUnit: 'kWh',
    defaultDataSourceType: 'API'
  },
  {
    key: 'SM-ENERGY-RATE',
    name: '用电突增率',
    defaultUnit: '%',
    defaultDataSourceType: 'API'
  },
  {
    key: 'SM-FIRE-OFF',
    name: '消防设备离线率',
    defaultUnit: '%',
    defaultDataSourceType: 'DB_MYSQL'
  },
  {
    key: 'SM-CANTEEN-CHK',
    name: '晨检不合格次数',
    defaultUnit: '次',
    defaultDataSourceType: 'API'
  },
  {
    key: 'SM-WO-OPEN',
    name: '待处理工单数',
    defaultUnit: '条',
    defaultDataSourceType: 'DB_MYSQL'
  }
]

const BY_NAME = new Map(STANDARD_METRIC_TYPES.map((t) => [t.name, t]))
const BY_KEY = new Map(STANDARD_METRIC_TYPES.map((t) => [t.key, t]))

/** 统一为现行平台枚举 key，便于过滤/展示 */
export function normalizeStandardMetricKey(key) {
  if (!key) return ''
  const k = String(key).trim()
  return LEGACY_STANDARD_METRIC_KEYS[k] || k
}

/** 展示用：API / 数据库 */
export function standardMetricDataSourceLabel(v) {
  if (v === 'API') return 'API'
  if (v === 'DB_MYSQL') return '数据库'
  return v || '—'
}

export function getStandardMetricTypeByKey(key) {
  const k = normalizeStandardMetricKey(key)
  return BY_KEY.get(k) || null
}

export function getStandardMetricTypeByName(name) {
  return (name && BY_NAME.get(String(name).trim())) || null
}

export function resolveStandardMetricKey(metricName) {
  const t = getStandardMetricTypeByName(metricName)
  return t ? t.key : `SM-LEGACY-${String(metricName || '').replace(/\s/g, '_')}`
}
