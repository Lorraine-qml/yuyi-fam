/** 风险报告：周期、模板、历史记录、定时任务（模拟） */

export const PERIOD_OPTIONS = [
  { label: '日报', value: 'day' },
  { label: '周报', value: 'week' },
  { label: '月报', value: 'month' },
  { label: '季报', value: 'quarter' },
  { label: '年报', value: 'year' }
]

export const CHART_THEME_OPTIONS = [{ label: '禹翼主题', value: 'yuyi' }]
export const CHART_SIZE_OPTIONS = [
  { label: '小', value: 'sm' },
  { label: '中', value: 'md' },
  { label: '大', value: 'lg' }
]

export const DEFAULT_SECTIONS = () => ({
  header: true,
  overviewCards: true,
  levelPie: true,
  trendLine: true,
  regionTable: true,
  ruleStats: false,
  efficiencyBar: false,
  openRisksTable: true,
  footer: false
})

let _tid = 0
function tid() {
  _tid += 1
  return `rtpl-${_tid}`
}

let _sid = 0
function sid() {
  _sid += 1
  return `rsch-${_sid}`
}

export function seedReportTemplates() {
  return [
    {
      id: tid(),
      name: '标准日报模板',
      periodType: 'day',
      status: 'enabled',
      deleted: false,
      chartTheme: 'yuyi',
      chartSize: 'md',
      showDataLabel: true,
      sections: { ...DEFAULT_SECTIONS(), ruleStats: false }
    },
    {
      id: tid(),
      name: '标准周报模板',
      periodType: 'week',
      status: 'enabled',
      deleted: false,
      chartTheme: 'yuyi',
      chartSize: 'md',
      showDataLabel: true,
      sections: { ...DEFAULT_SECTIONS() }
    },
    {
      id: tid(),
      name: '标准月报模板',
      periodType: 'month',
      status: 'enabled',
      deleted: false,
      chartTheme: 'yuyi',
      chartSize: 'md',
      showDataLabel: true,
      sections: {
        ...DEFAULT_SECTIONS(),
        ruleStats: true,
        efficiencyBar: true,
        footer: true
      }
    }
  ]
}

export function seedReportHistory(templates) {
  const w = templates.find((t) => t.periodType === 'week') || templates[1]
  const m = templates.find((t) => t.periodType === 'month') || templates[2]
  return [
    {
      id: 'rh-1',
      title: '2026-04-20 周报',
      periodType: 'week',
      templateId: w?.id,
      templateName: w?.name,
      generatedAt: '2026-04-20 09:05:00'
    },
    {
      id: 'rh-2',
      title: '2026-04-13 周报',
      periodType: 'week',
      templateId: w?.id,
      templateName: w?.name,
      generatedAt: '2026-04-13 08:58:00'
    },
    {
      id: 'rh-3',
      title: '2026-03 月报',
      periodType: 'month',
      templateId: m?.id,
      templateName: m?.name,
      generatedAt: '2026-04-01 09:00:00'
    }
  ]
}

export function seedScheduleTasks(templates) {
  const d = templates.find((t) => t.periodType === 'day') || templates[0]
  const w = templates.find((t) => t.periodType === 'week') || templates[1]
  const m = templates.find((t) => t.periodType === 'month') || templates[2]
  return [
    {
      id: sid(),
      name: '每日风险日报推送',
      cycle: 'daily',
      cycleLabel: '每日',
      runTime: '09:00',
      templateId: d?.id,
      templateName: d?.name,
      channelEmail: true,
      channelDing: true,
      channelWecom: false,
      recipients: 'zhangsan@example.com; lisi@example.com',
      enabled: true,
      lastRunAt: '2026-04-24 09:00:15'
    },
    {
      id: sid(),
      name: '每周风险周报',
      cycle: 'weekly_mon',
      cycleLabel: '每周一',
      runTime: '08:00',
      templateId: w?.id,
      templateName: w?.name,
      channelEmail: true,
      channelDing: true,
      channelWecom: false,
      recipients: 'risk-team@example.com',
      enabled: true,
      lastRunAt: '2026-04-21 08:02:00'
    },
    {
      id: sid(),
      name: '每月风险月报',
      cycle: 'monthly_1',
      cycleLabel: '每月1日',
      runTime: '08:00',
      templateId: m?.id,
      templateName: m?.name,
      channelEmail: true,
      channelDing: false,
      channelWecom: false,
      recipients: 'leader@example.com',
      enabled: false,
      lastRunAt: '2026-04-01 08:00:00'
    }
  ]
}

/** 预览用统计与文案 */
export function buildPreviewMeta(periodType, refDate = new Date(2026, 3, 24)) {
  const y = refDate.getFullYear()
  const m = refDate.getMonth() + 1
  const d = refDate.getDate()
  let title = ''
  let subtitle = ''
  if (periodType === 'day') {
    title = `【风险日报】${y}年${m}月${d}日`
    subtitle = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  } else if (periodType === 'week') {
    const weekNum = 16
    title = `【风险周报】${y}年第${weekNum}周（04月14日 - 04月20日）`
    subtitle = `2026年第${weekNum}周风险报告`
  } else if (periodType === 'month') {
    title = `【风险月报】${y}年${m}月`
    subtitle = `${y}年${m}月`
  } else if (periodType === 'quarter') {
    title = `【风险季报】${y}年第2季度`
    subtitle = `${y}Q2`
  } else {
    title = `【风险年报】${y}年度`
    subtitle = `${y}年`
  }
  return {
    title,
    subtitle,
    stats: {
      newTotal: 23,
      newHigh: 5,
      newMid: 12,
      newLow: 6,
      processing: 8,
      closed: 19,
      closeRate: 82,
      avgHours: 6.5,
      wow: 12
    },
    topRegions: [
      { name: '1号楼配电房', count: 8 },
      { name: '食堂后厨', count: 5 },
      { name: '地下车库B区', count: 4 },
      { name: '主楼消防通道', count: 3 },
      { name: '中央空调机房', count: 2 }
    ]
  }
}

export function buildPieOption(showLabel = true) {
  return {
    color: ['#EF4444', '#F59E0B', '#10B981'],
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        label: { show: showLabel, formatter: '{b}: {d}%' },
        data: [
          { value: 5, name: '高' },
          { value: 12, name: '中' },
          { value: 6, name: '低' }
        ]
      }
    ]
  }
}

export function buildTrendWeeksOption() {
  return {
    color: ['#4F46E5'],
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16'],
      axisLine: { lineStyle: { color: '#E4E7EC' } },
      axisLabel: { color: '#5B6871' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#EEF2F6' } },
      axisLabel: { color: '#5B6871' }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: [18, 21, 19, 24, 22, 25, 23, 23],
        areaStyle: {
          color: {
            type: 'linear',
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79,70,229,0.2)' },
              { offset: 1, color: 'rgba(79,70,229,0.02)' }
            ]
          }
        }
      }
    ]
  }
}

export const CYCLE_OPTIONS = [
  { label: '每日', value: 'daily' },
  { label: '每周一', value: 'weekly_mon' },
  { label: '每月1日', value: 'monthly_1' }
]
