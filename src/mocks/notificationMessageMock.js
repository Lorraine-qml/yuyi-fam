import { getCurrentProjectId } from '@/composables/useCurrentProject'
import { getRealtimeEventById } from '@/data/realtimeEventsMock'

const MOCK_USER = 'u-demo'

/**
 * 与事件表一致：标题=event.name、描述=event.contentText、发生时间=startTime、等级=event.level、
 * 位置=location、状态=event.status。（API 命名为 event_name / event_content / occur_time）
 */
function resolveEventFields(row) {
  const ev = getRealtimeEventById(row.event_id)
  if (!ev) {
    return {
      eventName: row.title,
      eventContent: row.content,
      occurTime: row.create_time,
      eventLevel: row.level,
      eventStatus: row.status,
      location: row.location ?? null
    }
  }
  return {
    eventName: ev.name,
    eventContent: ev.contentText ?? row.content,
    occurTime: ev.startTime,
    eventLevel: ev.level,
    eventStatus: ev.status,
    location: ev.location || null
  }
}

/** 与实时事件、风险看板统一：按 event_id 补全 source / 规则名等 */
const EVENT_META_BY_EVENT_ID = {
  'evt-240424001': { source: 'rule', rule_name: '用电量过高', metric_name: '用电实时值' },
  'evt-240425011': { source: 'manual', creator_name: '周巡检' },
  'evt-240424018': { source: 'third_party', third_party_system: '综合安防平台' },
  'evt-240424006': { source: 'rule', rule_name: '电梯维保临期', metric_name: '下次年检日期' },
  'evt-240425002': { source: 'third_party', third_party_system: '消防综合监控平台' },
  'evt-240424011': { source: 'rule', rule_name: '配电温升监测', metric_name: '配电室温度' },
  'evt-240423015': { source: 'rule', rule_name: '工单积压阈值', metric_name: '待处理工单数' },
  'evt-240423004': { source: 'rule', rule_name: '夜间用水异常', metric_name: '小时用水量' },
  'evt-240422021': { source: 'third_party', third_party_system: '消防水泵远程系统' },
  'evt-240421003': { source: 'manual', creator_name: '李值班' },
  'evt-240420009': { source: 'rule', rule_name: '油烟清洗计划', metric_name: '清洗到期日' },
  'evt-240419007': { source: 'third_party', third_party_system: '室外消防物联网' },
  'evt-240418012': { source: 'rule', rule_name: '浊度上限', metric_name: '浊度 NTU' },
  'evt-240417003': { source: 'third_party', third_party_system: '视频监控平台' },
  'evt-240416001': { source: 'rule', rule_name: '集水井液位', metric_name: '液位高度' }
}

function mergeEventMeta(r) {
  const m = EVENT_META_BY_EVENT_ID[r.event_id] || { source: 'rule' }
  return {
    ...r,
    source: r.source || m.source,
    rule_name: r.rule_name ?? m.rule_name,
    metric_name: r.metric_name ?? m.metric_name,
    third_party_system: r.third_party_system ?? m.third_party_system,
    creator_name: r.creator_name ?? m.creator_name
  }
}

function lsKey(tenantId) {
  return `yuyi-notification-v2-${tenantId}`
}

function seedForTenant(tenantId) {
  return [
    {
      id: 'nm-001',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240424001',
      workorder_id: 'wo-240001',
      title: '1号楼用电量突增32%',
      content: '当前值1320kWh，阈值1000kWh，环比+38%',
      level: 'high',
      status: 'pending',
      is_read: 0,
      create_time: '2026-04-27 10:23:00',
      read_time: null
    },
    {
      id: 'nm-002',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240425011',
      workorder_id: null,
      title: '食堂晨检不合格',
      content: '晨检记录异常，请检查',
      level: 'medium',
      status: 'pending',
      is_read: 0,
      create_time: '2026-04-27 09:45:00',
      read_time: null
    },
    {
      id: 'nm-003',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240424018',
      workorder_id: 'wo-240018',
      title: '消防通道堵塞告警',
      content: '主楼一层东侧通道堆放杂物',
      level: 'medium',
      status: 'processing',
      is_read: 0,
      create_time: '2026-04-27 11:20:00',
      read_time: null
    },
    {
      id: 'nm-004',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240424006',
      workorder_id: null,
      title: '电梯维保超期提醒',
      content: '3号梯下次年检将于5日内到期',
      level: 'low',
      status: 'pending',
      is_read: 0,
      create_time: '2026-04-26 09:15:00',
      read_time: null
    },
    {
      id: 'nm-005',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240425002',
      workorder_id: 'wo-240200',
      title: '地下车库CO浓度偏高',
      content: 'B2区传感器读数45ppm',
      level: 'medium',
      status: 'processing',
      is_read: 0,
      create_time: '2026-04-26 08:40:12',
      read_time: null
    },
    {
      id: 'nm-006',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240424011',
      workorder_id: 'wo-240011',
      title: '配电房温升异常',
      content: '1号楼配电室温度58℃',
      level: 'high',
      status: 'closed',
      is_read: 0,
      create_time: '2026-04-24 19:22:18',
      read_time: null
    },
    {
      id: 'nm-007',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240423015',
      workorder_id: 'wo-240315',
      title: '工单积压超阈值',
      content: '物业待处理工单12条，超目标10条',
      level: 'medium',
      status: 'closed',
      is_read: 0,
      create_time: '2026-04-24 16:00:00',
      read_time: null
    },
    {
      id: 'nm-008',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240423004',
      workorder_id: null,
      title: '夜间用水异常',
      content: '凌晨0-5点用水量突增',
      level: 'low',
      status: 'pending',
      is_read: 0,
      create_time: '2026-04-24 02:11:44',
      read_time: null
    },
    {
      id: 'nm-009',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240422021',
      workorder_id: 'wo-240221',
      title: '消防泵房压力不足',
      content: '稳压泵出口压力低于设定15%',
      level: 'medium',
      status: 'processing',
      is_read: 0,
      create_time: '2026-04-23 10:18:00',
      read_time: null
    },
    {
      id: 'nm-010',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240421003',
      workorder_id: null,
      title: '访客闸机离线',
      content: '南门闸机心跳丢失超5分钟',
      level: 'low',
      status: 'pending',
      is_read: 0,
      create_time: '2026-04-22 14:55:22',
      read_time: null
    },
    {
      id: 'nm-011',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240420009',
      workorder_id: 'wo-240009',
      title: '油烟管道清洗到期',
      content: '食堂排油烟系统清洗计划已逾期2天',
      level: 'low',
      status: 'closed',
      is_read: 0,
      create_time: '2026-04-21 09:00:00',
      read_time: null
    },
    {
      id: 'nm-012',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240419007',
      workorder_id: 'wo-240007',
      title: '室外消火栓渗漏',
      content: '西侧广场消火栓接口滴水',
      level: 'medium',
      status: 'closed',
      is_read: 0,
      create_time: '2026-04-20 13:42:08',
      read_time: null
    },
    {
      id: 'nm-013',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240418012',
      workorder_id: 'wo-240812',
      title: '二次供水浊度飘高',
      content: '生活泵房出口浊度0.8NTU',
      level: 'low',
      status: 'closed',
      is_read: 1,
      create_time: '2026-04-19 11:00:00',
      read_time: '2026-04-19 12:00:00'
    },
    {
      id: 'nm-014',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240417003',
      workorder_id: null,
      title: '安防摄像头遮挡',
      content: 'B1电梯厅摄像头无画面',
      level: 'medium',
      status: 'closed',
      is_read: 1,
      create_time: '2026-04-18 08:20:00',
      read_time: '2026-04-18 09:00:00'
    },
    {
      id: 'nm-015',
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: 'evt-240416001',
      workorder_id: 'wo-240601',
      title: '集水井高液位',
      content: '地库集水井B区液位达高位',
      level: 'high',
      status: 'closed',
      is_read: 1,
      create_time: '2026-04-17 16:10:00',
      read_time: '2026-04-18 10:00:00'
    }
  ]
}

function loadRows(tenantId) {
  if (!tenantId) tenantId = getCurrentProjectId()
  try {
    const raw = localStorage.getItem(lsKey(tenantId))
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr) && arr.length) return arr.map(mergeEventMeta)
    }
  } catch {
    /* ignore */
  }
  const seed = seedForTenant(tenantId).map(mergeEventMeta)
  saveRows(tenantId, seed)
  return seed
}

function saveRows(tenantId, rows) {
  try {
    localStorage.setItem(lsKey(tenantId), JSON.stringify(rows))
  } catch {
    /* ignore */
  }
}

function toDto(r) {
  const row = mergeEventMeta(r)
  const f = resolveEventFields(row)
  const ev = getRealtimeEventById(row.event_id)
  return {
    id: row.id,
    eventId: row.event_id,
    workorderId: row.workorder_id || null,
    /** 与事件表 event_name 同源（见 resolveEventFields） */
    title: f.eventName,
    /** 与事件表 event_content 同源 */
    content: f.eventContent,
    /** 与事件表 event_level 同源 */
    level: f.eventLevel,
    /** 与事件表 status 同源 */
    status: f.eventStatus,
    isRead: !!row.is_read,
    /** 与事件表 occur_time 同源 */
    createTime: f.occurTime,
    location: f.location || undefined,
    source: ev?.source || row.source || 'rule',
    ruleName: (ev?.ruleName ?? row.rule_name) || null,
    metricName: (ev?.metricName ?? row.metric_name) || null,
    thirdPartySystem: (ev?.thirdPartySystem ?? row.third_party_system) || null,
    creatorName: (ev?.creatorName ?? row.creator_name) || null
  }
}

/**
 * 列表筛选
 * @param {string} scope - all | unread | processing | closed
 * @param {string} eventStatus - 与接口 status 同：pending|processing|closed 或空
 * @param {string} level - high|medium|low 或空
 * @param {string} keyword
 */
function applyFilters(rows, { scope, status: eventStatus, level, keyword, source }) {
  let list = rows.map(mergeEventMeta)
  if (scope === 'unread') list = list.filter((r) => !r.is_read)
  else if (scope === 'processing') {
    list = list.filter((r) => resolveEventFields(r).eventStatus === 'processing')
  } else if (scope === 'closed') {
    list = list.filter((r) => resolveEventFields(r).eventStatus === 'closed')
  }
  if (eventStatus) {
    list = list.filter((r) => resolveEventFields(r).eventStatus === eventStatus)
  }
  if (level) {
    list = list.filter((r) => resolveEventFields(r).eventLevel === level)
  }
  if (source) {
    list = list.filter((r) => {
      const row = mergeEventMeta(r)
      const ev = getRealtimeEventById(row.event_id)
      const src = ev?.source ?? row.source ?? 'rule'
      return src === source
    })
  }
  if (keyword && String(keyword).trim()) {
    const k = String(keyword).trim().toLowerCase()
    list = list.filter((r) => {
      const f = resolveEventFields(r)
      const blob = [f.eventName, f.eventContent, f.location || ''].join(' ').toLowerCase()
      return blob.includes(k)
    })
  }
  list.sort(
    (a, b) => String(resolveEventFields(b).occurTime).localeCompare(String(resolveEventFields(a).occurTime))
  )
  return list
}

export function getUnreadCount(tenantId) {
  return loadRows(tenantId).filter((r) => !r.is_read).length
}

/**
 * @returns {{ total: number, records: object[] }}
 */
export function getMessagePage(tenantId, { page = 1, size = 20, scope, status, level, keyword, source } = {}) {
  const all = loadRows(tenantId)
  const filtered = applyFilters(all, { scope, status, level, keyword, source })
  const total = filtered.length
  const start = (Number(page) - 1) * Number(size)
  const records = filtered.slice(start, start + Number(size)).map(toDto)
  return { total, records }
}

export function markAsRead(tenantId, messageId) {
  const rows = loadRows(tenantId)
  const t = new Date()
  const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
  for (const r of rows) {
    if (r.id === messageId) {
      r.is_read = 1
      r.read_time = ts
      break
    }
  }
  saveRows(tenantId, rows)
}

export function markAllRead(tenantId) {
  const rows = loadRows(tenantId)
  const t = new Date()
  const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
  for (const r of rows) {
    if (!r.is_read) {
      r.is_read = 1
      r.read_time = ts
    }
  }
  saveRows(tenantId, rows)
}

export function setWorkorderForEvent(tenantId, eventId, workorderId) {
  const rows = loadRows(tenantId)
  for (const r of rows) {
    if (r.event_id === eventId) r.workorder_id = workorderId
  }
  saveRows(tenantId, rows)
}

/**
 * 模拟从事件创建工单
 */
export function createWorkorderFromEvent(tenantId, eventId) {
  const newId = `wo-${String(Date.now()).slice(-8)}`
  setWorkorderForEvent(tenantId, eventId, newId)
  return { workorderId: newId }
}

/** 模拟新消息：用于联调/演示时触发铃铛 +1、toast */
export function injectMockMessage(tenantId) {
  const rows = loadRows(tenantId)
  const t = new Date()
  const ts = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:${String(t.getSeconds()).padStart(2, '0')}`
  const id = `nm-${Date.now()}`
  rows.unshift(
    mergeEventMeta({
      id,
      tenant_id: tenantId,
      user_id: MOCK_USER,
      event_id: `evt-${String(Date.now()).slice(-6)}`,
      workorder_id: null,
      title: '模拟新增预警',
      content: '这是一条用于演示的推送',
      level: 'medium',
      status: 'pending',
      is_read: 0,
      create_time: ts,
      read_time: null,
      source: 'rule',
      rule_name: '演示规则',
      metric_name: '模拟指标'
    })
  )
  saveRows(tenantId, rows)
  return toDto(rows[0])
}
