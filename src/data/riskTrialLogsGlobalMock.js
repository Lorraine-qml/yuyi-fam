/** 全局试运行日志模拟数据 */

import { SECTOR_OPTIONS } from '@/data/riskMetricsMock'

export const TRIAL_LOG_SECTOR_OPTIONS = [{ label: '全部板块', value: '' }, ...SECTOR_OPTIONS]

export const TRIAL_TRIGGER_OPTIONS = [
  { label: '全部', value: '' },
  { label: '是', value: 'yes' },
  { label: '否', value: 'no' }
]

export const TRIAL_LEVEL_OPTIONS = [
  { label: '全部等级', value: '' },
  { label: '红色', value: 'red' },
  { label: '橙色', value: 'orange' },
  { label: '黄色', value: 'yellow' },
  { label: '蓝色', value: 'blue' }
]

export const TRIAL_RESULT_OPTIONS = [
  { label: '全部', value: '' },
  { label: '符合预期', value: 'match' },
  { label: '待确认', value: 'pending' }
]

const METRIC_POOL = [
  {
    name: '用电实时值',
    code: 'ENERGY-POWER-001',
    sector: 'ENERGY',
    fmt: (v) => `${v.toLocaleString()} kWh`,
    eventYes: '用电量过高→生成黄色预警',
    eventNo: '-'
  },
  {
    name: '用电突增率',
    code: 'ENERGY-POWER-002',
    sector: 'ENERGY',
    fmt: (v) => `${v}%`,
    eventYes: '用电突增→橙色预警',
    eventNo: '-'
  },
  {
    name: '晨检不合格次数',
    code: 'CANTEEN-CHECK-001',
    sector: 'CANTEEN',
    fmt: (v) => `${v} 次`,
    eventYes: '晨检不合格→橙色预警',
    eventNo: '-'
  },
  {
    name: '消防设备离线率',
    code: 'SECURITY-FIRE-001',
    sector: 'SECURITY',
    fmt: (v) => `${v}%`,
    eventYes: '消防离线超限→黄色预警',
    eventNo: '-'
  },
  {
    name: '烟感报警',
    code: 'SECURITY-SMOKE-001',
    sector: 'SECURITY',
    fmt: (v) => (v ? '触发' : '正常'),
    eventYes: '消防报警→红色预警',
    eventNo: '-'
  },
  {
    name: '待处理工单数',
    code: 'PROPERTY-WO-001',
    sector: 'PROPERTY',
    fmt: (v) => `${v} 条`,
    eventYes: '工单积压→蓝色提示',
    eventNo: '-'
  }
]

const LEVEL_MAP = {
  red: '红色',
  orange: '橙色',
  yellow: '黄色',
  blue: '蓝色',
  none: '-'
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function pickLevel(triggered, seed) {
  if (!triggered) return 'none'
  const r = seed % 4
  if (r === 0) return 'red'
  if (r === 1) return 'orange'
  if (r === 2) return 'yellow'
  return 'blue'
}

function rawValueForMetric(m, triggered, seed) {
  if (m.code.includes('POWER-001')) return triggered ? 1471 + (seed % 50) : 820 + (seed % 100)
  if (m.code.includes('POWER-002')) return triggered ? 35 + (seed % 10) : 12 + (seed % 8)
  if (m.code.includes('CHECK')) return triggered ? 2 + (seed % 3) : 0
  if (m.code.includes('FIRE-001')) return triggered ? 8 + (seed % 5) : 2 + (seed % 2)
  if (m.code.includes('SMOKE')) return triggered ? 1 : 0
  return triggered ? 40 + (seed % 20) : 5 + (seed % 10)
}

/**
 * 生成全局试运行日志（默认约 156 条）
 */
export function generateGlobalTrialLogs(total = 156) {
  const rows = []
  const base = new Date(2026, 3, 24, 8, 12).getTime()
  for (let i = 0; i < total; i += 1) {
    const m = METRIC_POOL[i % METRIC_POOL.length]
    const seed = (i * 17 + 31) % 997
    const triggered = seed % 3 !== 0
    const levelKey = pickLevel(triggered, seed)
    const t = new Date(base - i * 130000 - (seed % 45) * 60000)
    const timeStr = `${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
    const fullTime = `2026-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}`
    const raw = rawValueForMetric(m, triggered, seed)
    const metricValueDisplay = m.fmt(raw)
    const confirmStatus = !triggered ? 'match' : seed % 11 === 0 ? 'pending' : 'match'
    const predictionOk = confirmStatus === 'match' && (triggered ? seed % 7 !== 0 : true)

    rows.push({
      id: `tl-${i}`,
      time: timeStr,
      sortTime: fullTime,
      metricName: m.name,
      metricCode: m.code,
      sector: m.sector,
      metricValue: raw,
      metricValueDisplay,
      triggered,
      level: levelKey,
      levelLabel: LEVEL_MAP[levelKey],
      expectedEvent: triggered ? m.eventYes : m.eventNo,
      confirmStatus,
      predictionOk
    })
  }
  return rows
}

export function computeTrialLogKpi(rows) {
  const todayPrefix = '2026-04-24'
  const todayTriggers = rows.filter((r) => r.sortTime.startsWith(todayPrefix) && r.triggered).length
  const pending = rows.filter((r) => r.confirmStatus === 'pending').length
  const ok = rows.filter((r) => r.predictionOk).length
  const accuracy = rows.length ? Math.round((ok / rows.length) * 100) : 87
  return {
    trialMetrics: 3,
    todayTriggers,
    accuracy,
    pendingConfirm: pending
  }
}

export function getMetricFilterOptionsFromLogs(rows) {
  const map = new Map()
  rows.forEach((r) => {
    if (!map.has(r.metricCode)) map.set(r.metricCode, { label: r.metricName, value: r.metricCode })
  })
  return [{ label: '全部指标', value: '' }, ...map.values()]
}
