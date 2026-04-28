/**
 * 事件工作台 · 工单演示数据
 * 与项目上下文、当前用户、风险事件 mock 配合使用
 */
import { getRealtimeEventById } from '@/data/realtimeEventsMock'

/** 演示：当前登录用户 */
export const CURRENT_USER = { id: 'u-zhang', name: '张三' }

export const WO_STATUS = {
  pending: { label: '待接单', tag: 'info' },
  processing: { label: '处理中', tag: 'warning' },
  done: { label: '已完成', tag: 'success' },
  closed: { label: '已关闭', tag: 'info' }
}

export const RISK_LEVEL_META = {
  high: { label: '高', dot: '🔴', elType: 'danger' },
  medium: { label: '中', dot: '🟡', elType: 'warning' },
  low: { label: '低', dot: '🟢', elType: 'success' }
}

/** 列表「紧急程度」统一展示：风险按等级映射，报修/巡检按 urgency */
export const DISPLAY_URGENCY_FILTER = [
  { label: '紧急', value: 'urgent' },
  { label: '重要', value: 'important' },
  { label: '一般', value: 'normal' },
  { label: '低', value: 'low' }
]

export function getDisplayUrgency(row) {
  if (row.category === 'risk' && row.riskLevel) {
    if (row.riskLevel === 'high') {
      return { filterKey: 'urgent', label: '紧急', elType: 'danger' }
    }
    if (row.riskLevel === 'medium') {
      return { filterKey: 'normal', label: '一般', elType: 'info' }
    }
    return { filterKey: 'low', label: '低', elType: 'info' }
  }
  if (row.urgency === 'high') {
    return { filterKey: 'urgent', label: '紧急', elType: 'danger' }
  }
  if (row.urgency === 'medium') {
    return { filterKey: 'important', label: '重要', elType: 'warning' }
  }
  return { filterKey: 'normal', label: '一般', elType: 'info' }
}

/** 工单业务类型 */
export const WO_CATEGORY = {
  risk: { label: '风险处置', elTag: 'danger' },
  repair: { label: '报修', elTag: 'warning' },
  inspection: { label: '巡检任务', elTag: 'success' }
}

let _seed = null

/**
 * 一条工单的说明：
 * - category: 风险处置 / 报修 / 巡检
 * - riskLevel: 仅风险类有值，可与 urgency 同档
 * - assigneeId/assigneeName: 无责任人时 assigneeId 为 null
 * - initiatorUserId: 用户发起为当前或他人；规则/系统为 null
 * - initiatorLabel: 展示用（含「系统」「风险规则-xxx」）
 * - includeInInitiated: 在「我发起的」中显示（含规则自动生成需跟踪的）
 * - participatedUserIds: 曾参与处理的用户 id（转派/处理过即写入）
 * - eventId: 风险类关联事件
 */
function buildSeed() {
  return [
    {
      id: 'WO-20260427001',
      category: 'risk',
      riskLevel: 'high',
      summary: '1号楼用电量突增32%',
      location: '1号楼配电房',
      urgency: 'high',
      status: 'pending',
      createTime: '2026-04-27 10:23:00',
      remainingMinutes: 23,
      eventId: 'evt-240424001',
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: null,
      initiatorLabel: '风险规则-用电突增监测',
      includeInInitiated: true,
      participatedUserIds: []
    },
    {
      id: 'WO-20260427002',
      category: 'risk',
      riskLevel: 'medium',
      summary: '食堂晨检不合格',
      location: '食堂后厨',
      urgency: 'medium',
      status: 'pending',
      createTime: '2026-04-27 09:45:00',
      remainingMinutes: 180,
      eventId: 'evt-240425011',
      assigneeId: 'u-li',
      assigneeName: '李四',
      initiatorUserId: null,
      initiatorLabel: '系统',
      includeInInitiated: false,
      participatedUserIds: []
    },
    {
      id: 'WO-20260427003',
      category: 'risk',
      riskLevel: 'high',
      summary: '区域入侵告警',
      location: '1号楼大厅',
      urgency: 'high',
      status: 'processing',
      createTime: '2026-04-27 10:20:00',
      remainingMinutes: 45,
      eventId: 'evt-240424018',
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: null,
      initiatorLabel: '风险规则-周界',
      includeInInitiated: true,
      participatedUserIds: ['u-zhang']
    },
    {
      id: 'WO-20260427004',
      category: 'risk',
      riskLevel: 'low',
      summary: '电梯维保超期提醒',
      location: '3号梯',
      urgency: 'low',
      status: 'pending',
      createTime: '2026-04-26 09:15:00',
      remainingMinutes: -20,
      eventId: 'evt-240424006',
      assigneeId: 'u-wang',
      assigneeName: '王五',
      initiatorUserId: null,
      initiatorLabel: '系统',
      includeInInitiated: false,
      participatedUserIds: []
    },
    {
      id: 'WO-20260427005',
      category: 'risk',
      riskLevel: 'medium',
      summary: '地下车库CO浓度偏高',
      location: 'B2 车库',
      urgency: 'medium',
      status: 'done',
      createTime: '2026-04-26 08:40:00',
      remainingMinutes: 0,
      eventId: 'evt-240425002',
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: null,
      initiatorLabel: '风险规则-空气质量',
      includeInInitiated: true,
      participatedUserIds: ['u-zhang']
    },
    {
      id: 'WO-20260426010',
      category: 'repair',
      riskLevel: null,
      summary: '会议室空调不制冷',
      location: '行政楼 301',
      urgency: 'medium',
      status: 'processing',
      createTime: '2026-04-26 14:00:00',
      remainingMinutes: 120,
      eventId: null,
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: 'u-zhao',
      initiatorLabel: '赵六',
      includeInInitiated: false,
      participatedUserIds: ['u-zhang']
    },
    {
      id: 'WO-20260425008',
      category: 'repair',
      riskLevel: null,
      summary: '女厕水龙头漏水',
      location: '1号楼 2F',
      urgency: 'low',
      status: 'pending',
      createTime: '2026-04-25 11:00:00',
      remainingMinutes: 300,
      eventId: null,
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: 'u-zhang',
      initiatorLabel: '张三',
      includeInInitiated: true,
      participatedUserIds: []
    },
    {
      id: 'WO-20260424012',
      category: 'inspection',
      riskLevel: null,
      summary: '配电房周检-待复核',
      location: '2号楼配电房',
      urgency: 'high',
      status: 'processing',
      createTime: '2026-04-24 16:00:00',
      remainingMinutes: 60,
      eventId: null,
      assigneeId: 'u-li',
      assigneeName: '李四',
      initiatorUserId: 'u-zhang',
      initiatorLabel: '张三',
      includeInInitiated: true,
      participatedUserIds: ['u-zhang', 'u-li']
    },
    {
      id: 'WO-20260423005',
      category: 'repair',
      riskLevel: null,
      summary: '门禁读卡器失灵',
      location: '侧门',
      urgency: 'medium',
      status: 'processing',
      createTime: '2026-04-23 09:00:00',
      remainingMinutes: 90,
      eventId: null,
      assigneeId: 'u-wang',
      assigneeName: '王五',
      initiatorUserId: 'u-zhang',
      initiatorLabel: '张三',
      includeInInitiated: true,
      participatedUserIds: ['u-zhang', 'u-wang']
    },
    {
      id: 'WO-20260422001',
      category: 'risk',
      riskLevel: 'low',
      summary: '消防水箱液位低',
      location: '泵房',
      urgency: 'low',
      status: 'closed',
      createTime: '2026-04-22 10:00:00',
      remainingMinutes: 0,
      eventId: 'evt-240424006',
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: null,
      initiatorLabel: '系统',
      includeInInitiated: false,
      participatedUserIds: ['u-zhang']
    },
    {
      id: 'WO-20260421003',
      category: 'repair',
      riskLevel: null,
      summary: '玻璃破损更换',
      location: '连廊',
      urgency: 'low',
      status: 'done',
      createTime: '2026-04-21 15:30:00',
      remainingMinutes: 0,
      eventId: null,
      assigneeId: 'u-zhang',
      assigneeName: '张三',
      initiatorUserId: 'u-li',
      initiatorLabel: '李四',
      includeInInitiated: false,
      participatedUserIds: ['u-zhang']
    }
  ]
}

export function getWorkOrderSeed() {
  if (!_seed) {
    _seed = buildSeed()
  }
  return _seed.map((r) => ({ ...r }))
}

/** 深拷贝可写列表（演示页面内会改状态） */
export function cloneWorkOrderList() {
  return getWorkOrderSeed().map((r) => ({ ...r, participatedUserIds: [...(r.participatedUserIds || [])] }))
}

function matchKeyword(row, keyword) {
  if (!keyword.trim()) return true
  const k = keyword.trim().toLowerCase()
  const s = [row.id, row.summary, row.location, row.assigneeName, row.initiatorLabel]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return s.includes(k)
}

function inDateRange(iso, range) {
  if (!range || !range.length) return true
  const [a, b] = range
  if (!a || !b) return true
  const t = iso.slice(0, 10)
  return t >= a && t <= b
}

/**
 * 按视图 + 筛选项过滤
 * @param {string} view - all | todo | initiated | done | closed
 */
export function filterWorkOrders(rows, view, opts = {}) {
  const { status, urgency, category, dateRange, keyword } = opts
  let list = rows.slice()

  if (view === 'todo') {
    list = list.filter(
      (r) =>
        (r.status === 'pending' || r.status === 'processing') && r.assigneeId === CURRENT_USER.id
    )
  } else if (view === 'initiated') {
    list = list.filter(
      (r) => r.initiatorUserId === CURRENT_USER.id || r.includeInInitiated
    )
  } else if (view === 'done') {
    // 曾参与、尚未最终办结，且当前不由本人待办（转交他人后等）
    list = list.filter(
      (r) =>
        (r.participatedUserIds || []).includes(CURRENT_USER.id) &&
        (r.status === 'pending' || r.status === 'processing') &&
        r.assigneeId !== CURRENT_USER.id
    )
  } else if (view === 'closed') {
    list = list.filter((r) => r.status === 'done' || r.status === 'closed')
  }

  if (status) list = list.filter((r) => r.status === status)
  if (urgency) list = list.filter((r) => getDisplayUrgency(r).filterKey === urgency)
  if (category) list = list.filter((r) => r.category === category)
  if (dateRange) list = list.filter((r) => inDateRange(r.createTime, dateRange))
  if (keyword) list = list.filter((r) => matchKeyword(r, keyword))

  return list
}

export function findWorkOrderByEventId(eventId) {
  if (!eventId) return null
  return getWorkOrderSeed().find((x) => x.eventId === eventId) || null
}

/** 由事件 ID 查找关联工单号（用于风险看板「处置」跳转） */
export function findWorkOrderIdByEventId(eventId) {
  return findWorkOrderByEventId(eventId)?.id || null
}

export function findWorkOrderById(id) {
  if (!id) return null
  return getWorkOrderSeed().find((r) => r.id === id) || null
}

export function getEventContextForOrder(eventId) {
  if (!eventId) return null
  return getRealtimeEventById(eventId) || null
}

function addMinutesToDateTime(iso, minutes) {
  const d = new Date(iso.replace(' ', 'T'))
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`
}

/** 完成时限（演示：创建时间 + SLA 分钟；剩余时间为负时用固定超前量） */
export function getCompleteDueAtForRow(row) {
  if (row.completeDueAt) return row.completeDueAt
  const addMin = row.remainingMinutes > 0 ? row.remainingMinutes : 90
  return addMinutesToDateTime(row.createTime, addMin)
}

function creatorDisplayLabel(row, event) {
  if (row.initiatorUserId) return row.initiatorLabel
  if (row.category === 'risk' && event?.ruleName) {
    const short = row.initiatorLabel.replace(/^风险规则[-·]/, '风险规则·')
    return `${short}（${event.ruleName}）`
  }
  return row.initiatorLabel || '系统'
}

/** 处理流程时间线（演示数据，与当前 row 状态对齐） */
function buildFlowTimeline(row) {
  const st = (k) => WO_STATUS[k]?.label || k
  const items = []
  items.push({
    timestamp: row.createTime,
    title: '工单创建',
    description: `状态：${st('pending')}`,
    type: 'primary'
  })

  if (row.status === 'processing' || row.status === 'done' || row.status === 'closed') {
    const acceptAt = addMinutesToDateTime(row.createTime, 2)
    items.push({
      timestamp: acceptAt,
      title: `${row.assigneeName || '责任人'} 接单`,
      description: `状态：${st('processing')}`,
      type: 'primary'
    })
  }

  if (row.id === 'WO-20260427003') {
    items.push({
      timestamp: addMinutesToDateTime(row.createTime, 15),
      title: '张三 提交现场复核说明',
      description: '状态：处理中 · 已上传现场照片（演示）',
      type: 'success'
    })
  }

  if (row.status === 'done') {
    items.push({
      timestamp: addMinutesToDateTime(row.createTime, 45),
      title: `${row.assigneeName || '责任人'} 完成处理`,
      description: '状态：已完成（演示：待验收流程可对接审批）',
      type: 'success'
    })
  }

  if (row.status === 'closed') {
    items.push({
      timestamp: addMinutesToDateTime(row.createTime, 20),
      title: `${row.assigneeName || '责任人'} 关闭工单`,
      description: `状态：${st('closed')}（演示）`,
      type: 'info'
    })
  }

  return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function buildOperationLogs(row, event) {
  const logs = []
  const padSec = (base, sec) => {
    const d = new Date(base.replace(' ', 'T'))
    d.setSeconds(d.getSeconds() + sec)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}:${pad(d.getSeconds())}`
  }

  logs.push({
    time: padSec(row.createTime, 5),
    operator: '系统',
    content: `自动生成工单 · 类型 ${WO_CATEGORY[row.category]?.label || row.category}`
  })

  if (event?.ruleName) {
    logs.push({
      time: padSec(row.createTime, 6),
      operator: '风险引擎',
      content: `关联事件 ${row.eventId} · 规则 ${event.ruleName}`
    })
  }

  if (row.status !== 'pending') {
    logs.push({
      time: addMinutesToDateTime(row.createTime, 2),
      operator: row.assigneeName || '责任人',
      content: '接单 · 状态变更为处理中'
    })
  }

  if (row.id === 'WO-20260427003') {
    logs.push({
      time: addMinutesToDateTime(row.createTime, 14),
      operator: '张三',
      content: '上传现场复核附件 · 备注：大厅已安排保安巡查（演示）'
    })
  }

  if (row.status === 'done' || row.status === 'closed') {
    logs.push({
      time: addMinutesToDateTime(row.createTime, 40),
      operator: row.assigneeName || '责任人',
      content: row.status === 'done' ? '提交办结说明（演示）' : '关闭工单（演示）'
    })
  }

  return logs.sort((a, b) => a.time.localeCompare(b.time))
}

function buildAttachments(row) {
  if (row.category === 'repair' && row.id === 'WO-20260426010') {
    return [
      { name: '报修单-301.pdf', size: '128 KB', type: 'application/pdf' },
      { name: '现场照片-01.jpg', size: '890 KB', type: 'image/jpeg' }
    ]
  }
  if (row.id === 'WO-20260427003') {
    return [{ name: '告警截图-大厅.jpg', size: '420 KB', type: 'image/jpeg' }]
  }
  return []
}

/**
 * 模拟 GET /api/workorder/:id/detail 的聚合结果（仅供抽屉展示）
 */
export function getWorkOrderDrawerDetail(row) {
  const event = row.eventId ? getRealtimeEventById(row.eventId) : null
  const completeDueAt = getCompleteDueAtForRow(row)
  return {
    basic: {
      id: row.id,
      categoryLabel: WO_CATEGORY[row.category]?.label,
      status: row.status,
      statusLabel: WO_STATUS[row.status]?.label,
      urgency: getDisplayUrgency(row),
      summary: row.summary,
      location: row.location,
      assigneeName: row.assigneeName || '待分配',
      creatorLabel: creatorDisplayLabel(row, event),
      createTime: row.createTime,
      completeDueAt,
      remainingMinutes: row.remainingMinutes
    },
    flowTimeline: buildFlowTimeline(row),
    operationLogs: buildOperationLogs(row, event),
    attachments: buildAttachments(row),
    relatedEvent: event
      ? {
          id: row.eventId,
          name: event.name,
          ruleName: event.ruleName,
          ruleId: event.ruleId,
          conditionText: event.conditionText,
          metricName: event.metricName,
          levelLabel: event.levelLabel,
          thirdPartySystem: event.thirdPartySystem
        }
      : null
  }
}
