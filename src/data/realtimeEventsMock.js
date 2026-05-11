import { EVENT_SOURCE } from '@/constants/eventSource'

/**
 * 实时事件列表 + 详情（与消息 event_id、风险看板 eventId 对齐）
 * source: rule | third_party | manual
 */
export const REALTIME_EVENTS = [
  {
    id: 'evt-240424001',
    displayCode: 'EVT-20260427001',
    categoryId: 'ec-energy-anomaly',
    categoryLabel: '用电异常',
    location: '1号楼配电房',
    name: '1号楼用电量突增32%',
    type: '规则预警',
    level: 'high',
    levelLabel: '高',
    source: EVENT_SOURCE.RULE,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 10:23:00',
    updatedTime: '2026-04-27 10:25:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '当前值 1320 kWh，阈值 1000 kWh，环比 +38%',
    ruleVersion: '第 2 版',
    triggerValue: '1320 kWh',
    thresholdText: '1000 kWh',
    /** 规则详情（source=rule） */
    ruleName: '用电量过高',
    metricName: '用电实时值',
    metricCode: 'ENERGY-HP-001',
    ruleId: 'rule-energy-001',
    metricId: 'metric-hp-001',
    conditionText: '当前值 1320 kWh > 阈值 1000 kWh',
    ruleExtra: '当前环比 +38% (超过规则设定 30%)',
    thirdPartySystem: null,
    creatorName: null,
    currentAssigneeName: '张三',
    linkedWorkOrder: {
      id: 'WO-20260427001',
      statusLabel: '待接单',
      assigneeName: '张三'
    },
    pushLogs: [
      { time: '2026-04-27 10:23:05', text: '钉钉通知已发送给张三、李四' },
      { time: '2026-04-27 10:23:05', text: '按配置生成完整工单 WO-20260427001' }
    ]
  },
  {
    id: 'evt-240424018',
    displayCode: 'EVT-20260427018',
    categoryId: 'ec-safety-alert',
    location: '1号楼大厅',
    name: '区域入侵告警',
    type: '视频分析',
    level: 'high',
    levelLabel: '高',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 10:20:00',
    updatedTime: '2026-04-27 10:21:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '视频分析系统推送入侵告警，置信度 0.92（演示）',
    ruleVersion: null,
    triggerValue: null,
    thresholdText: null,
    ruleName: null,
    metricName: null,
    metricCode: null,
    ruleId: null,
    metricId: null,
    conditionText: null,
    ruleExtra: null,
    thirdPartySystem: '视频分析系统',
    creatorName: null,
    currentAssigneeName: '张三',
    linkedWorkOrder: {
      id: 'WO-20260427003',
      statusLabel: '处理中',
      assigneeName: '张三'
    },
    pushLogs: [
      { time: '2026-04-27 10:20:02', text: '钉钉通知已发送给值班班长' },
      { time: '2026-04-27 10:20:03', text: '已关联工单 WO-20260427003' }
    ]
  },
  {
    id: 'evt-240425011',
    displayCode: 'EVT-20260425011',
    categoryId: 'ec-canteen-morning',
    categoryLabel: '晨检异常',
    location: '食堂后厨',
    name: '食堂晨检不合格',
    type: '晨检',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.MANUAL,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 09:45:00',
    updatedTime: '2026-04-27 09:50:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '晨检表第 3 项不合格，需复核（演示）',
    ruleVersion: null,
    triggerValue: null,
    thresholdText: null,
    ruleName: null,
    metricName: null,
    metricCode: null,
    ruleId: null,
    metricId: null,
    conditionText: null,
    ruleExtra: null,
    thirdPartySystem: null,
    creatorName: '周巡检',
    currentAssigneeName: '李四',
    linkedWorkOrder: {
      id: 'WO-20260427002',
      statusLabel: '待接单',
      assigneeName: '李四'
    },
    pushLogs: [{ time: '2026-04-27 09:45:10', text: '短信通知已发送至责任人李四' }]
  },
  {
    id: 'evt-240424006',
    displayCode: 'EVT-20260424006',
    categoryId: 'ec-property-ops',
    location: '3号梯',
    name: '电梯维保超期提醒',
    type: '维保',
    level: 'low',
    levelLabel: '低',
    source: EVENT_SOURCE.RULE,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-26 09:15:00',
    updatedTime: '2026-04-26 09:16:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '距下次年检不足 5 个自然日',
    ruleVersion: null,
    triggerValue: null,
    thresholdText: null,
    ruleName: '电梯维保临期',
    metricName: '下次年检日期',
    metricCode: 'LIFT-MAINT-01',
    ruleId: 'rule-lift-01',
    metricId: 'metric-lift-01',
    conditionText: '距下次年检不足 5 个自然日',
    ruleExtra: '计划维保窗口：4/30 前',
    thirdPartySystem: null,
    creatorName: null,
    currentAssigneeName: '王五',
    linkedWorkOrder: {
      id: 'WO-20260427004',
      statusLabel: '待接单',
      assigneeName: '王五'
    },
    pushLogs: [{ time: '2026-04-26 09:15:02', text: '钉钉通知已发送给维保负责人' }]
  },
  {
    id: 'evt-240425002',
    displayCode: 'EVT-20260425002',
    categoryId: 'ec-fire-alarm',
    location: 'B2 车库',
    name: '地下车库CO浓度偏高',
    type: '消防主机',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'processing',
    statusLabel: '处理中',
    startTime: '2026-04-26 08:40:00',
    updatedTime: '2026-04-26 09:10:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '消防主机上报 CO 浓度超阈值（演示）',
    ruleName: null,
    thirdPartySystem: '消防综合监控平台',
    creatorName: null,
    currentAssigneeName: '张三',
    linkedWorkOrder: {
      id: 'WO-20260427005',
      statusLabel: '已完成',
      assigneeName: '张三'
    },
    pushLogs: [
      { time: '2026-04-26 08:40:05', text: '短信+钉钉已推送' },
      { time: '2026-04-26 08:41:00', text: '生成跟踪工单 WO-20260427005' }
    ]
  },
  {
    id: 'evt-240421003',
    displayCode: 'EVT-20260421003',
    categoryId: 'ec-safety-alert',
    location: 'B1 电梯厅',
    name: '安防摄像头遮挡',
    type: '视频诊断',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'closed',
    statusLabel: '已闭环',
    startTime: '2026-04-22 14:55:00',
    updatedTime: '2026-04-22 16:00:00',
    closedTime: '2026-04-22 16:00:00',
    endTime: '2026-04-22 16:00:00',
    pushStatus: '已推送',
    contentText: '摄像头画面异常，疑似遮挡',
    ruleName: null,
    thirdPartySystem: '视频监控平台',
    creatorName: null,
    currentAssigneeName: '—',
    linkedWorkOrder: null,
    pushLogs: [{ time: '2026-04-22 16:00:00', text: '事件已闭环，工单已归档（演示）' }]
  }
]

const byId = new Map(REALTIME_EVENTS.map((e) => [e.id, e]))

export function getRealtimeEventById(id) {
  if (!id) return null
  return byId.get(id) || null
}

/** 详情页未知 ID 时的占位 */
export function buildPlaceholderEvent(id) {
  return {
    id,
    displayCode: id.replace(/^evt-/i, 'EVT-').toUpperCase(),
    categoryId: '',
    categoryLabel: '—',
    location: '—',
    name: '未找到事件',
    type: '—',
    level: 'low',
    levelLabel: '低',
    source: EVENT_SOURCE.MANUAL,
    status: 'closed',
    statusLabel: '已闭环',
    startTime: '—',
    endTime: '—',
    pushStatus: '—',
    contentText: '—',
    ruleName: null,
    thirdPartySystem: null,
    creatorName: null,
    currentAssigneeName: '—',
    linkedWorkOrder: null,
    pushLogs: []
  }
}

/**
 * KPI「今日新增」演示锚点日与列表 mock 对齐（非同设备本地日时仍稳定可测）
 */
export const REALTIME_EVENTS_DEMO_TODAY = '2026-04-27'

/** 会话内事件状态补丁（前端演示：开始处理/闭环等不落库） */
const runtimeEventOverlay = {}

function defaultUpdatedTime(row) {
  return row.updatedTime || row.startTime
}

/** 合并基线事件与运行时补丁 */
export function mergeRealtimeEvent(row) {
  if (!row) return row
  const o = runtimeEventOverlay[row.id] || {}
  const merged = { ...row, ...o }
  if (!merged.updatedTime) merged.updatedTime = defaultUpdatedTime(row)
  if (merged.status === 'closed' && merged.closedTime == null && merged.endTime && merged.endTime !== '—') {
    merged.closedTime = merged.endTime
  }
  return merged
}

export function patchRealtimeEventOverlay(id, patch) {
  if (!id) return
  runtimeEventOverlay[id] = {
    ...(runtimeEventOverlay[id] || {}),
    ...patch
  }
}

export function listRealtimeEventsMerged() {
  return REALTIME_EVENTS.map((e) => mergeRealtimeEvent(e))
}

export function getMergedRealtimeEvent(id) {
  const base = getRealtimeEventById(id)
  if (!base) return null
  return mergeRealtimeEvent(base)
}
