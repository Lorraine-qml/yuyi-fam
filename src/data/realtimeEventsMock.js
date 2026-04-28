import { EVENT_SOURCE } from '@/constants/eventSource'

/**
 * 实时事件列表 + 详情（与消息 event_id、风险看板 eventId 对齐）
 * source: rule | third_party | manual
 */
export const REALTIME_EVENTS = [
  {
    id: 'evt-240424001',
    displayCode: 'EVT-20260427001',
    categoryLabel: '能耗异常',
    location: '1号楼配电房',
    name: '1号楼用电量突增32%',
    type: '规则预警',
    level: 'high',
    levelLabel: '高',
    source: EVENT_SOURCE.RULE,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 10:23:00',
    endTime: '—',
    pushStatus: '已推送',
    contentText: '当前值 1320 kWh，阈值 1000 kWh，环比 +38%',
    ruleVersion: 'v2',
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
    categoryLabel: '监控',
    location: '1号楼大厅',
    name: '区域入侵告警',
    type: '视频分析',
    level: 'high',
    levelLabel: '高',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 10:20:00',
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
    categoryLabel: '食堂',
    location: '食堂后厨',
    name: '食堂晨检不合格',
    type: '晨检',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.MANUAL,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-27 09:45:00',
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
    categoryLabel: '电梯',
    location: '3号梯',
    name: '电梯维保超期提醒',
    type: '维保',
    level: 'low',
    levelLabel: '低',
    source: EVENT_SOURCE.RULE,
    status: 'pending',
    statusLabel: '待处理',
    startTime: '2026-04-26 09:15:00',
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
    categoryLabel: '环境',
    location: 'B2 车库',
    name: '地下车库CO浓度偏高',
    type: '消防主机',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'processing',
    statusLabel: '处理中',
    startTime: '2026-04-26 08:40:00',
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
    categoryLabel: '监控',
    location: 'B1 电梯厅',
    name: '安防摄像头遮挡',
    type: '视频诊断',
    level: 'medium',
    levelLabel: '中',
    source: EVENT_SOURCE.THIRD_PARTY,
    status: 'closed',
    statusLabel: '已闭环',
    startTime: '2026-04-22 14:55:00',
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
