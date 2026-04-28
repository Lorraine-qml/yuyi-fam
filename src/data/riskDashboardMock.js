/** 风险看板模拟数据与图表配置 */

export const TIME_RANGE_OPTIONS = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]

export const SECTOR_FILTER_OPTIONS = [
  { label: '全部板块', value: 'all' },
  { label: '能耗管理', value: 'energy' },
  { label: '安全管理', value: 'security' },
  { label: '食堂管理', value: 'canteen' },
  { label: '物业管理', value: 'property' },
  { label: '资产管理', value: 'asset' }
]

export const LEVEL_FILTER_OPTIONS = [
  { label: '全部等级', value: 'all' },
  { label: '高风险', value: 'high' },
  { label: '中风险', value: 'medium' },
  { label: '低风险', value: 'low' }
]

const KPI_BY_RANGE = {
  today: {
    unhandled: 12,
    overdueUnhandled: 2,
    todayNew: 5,
    todayNewHint: '较昨日 +12%',
    processing: 8,
    pendingAssign: 3,
    closed: 21,
    closedAvgHours: '4.2',
    closeRate: 82,
    closeRateHint: '较上周 +5%'
  },
  week: {
    unhandled: 28,
    overdueUnhandled: 5,
    todayNew: 23,
    todayNewHint: '本周累计',
    processing: 18,
    pendingAssign: 6,
    closed: 96,
    closedAvgHours: '4.5',
    closeRate: 79,
    closeRateHint: '较上周 +2%'
  },
  month: {
    unhandled: 45,
    overdueUnhandled: 9,
    todayNew: 118,
    todayNewHint: '本月累计',
    processing: 32,
    pendingAssign: 11,
    closed: 402,
    closedAvgHours: '5.1',
    closeRate: 81,
    closeRateHint: '较上月 +1%'
  }
}

export function getKpiSnapshot(timeRange) {
  return { ...KPI_BY_RANGE[timeRange] }
}

/** 近7天趋势：含分级明细供 tooltip */
export function getTrendSeries() {
  const days = ['4/18', '4/19', '4/20', '4/21', '4/22', '4/23', '4/24']
  const totals = [5, 7, 10, 12, 15, 9, 8]
  const highs = [1, 1, 2, 3, 4, 2, 2]
  const mids = [2, 3, 4, 5, 6, 4, 3]
  const lows = [2, 3, 4, 4, 5, 3, 3]
  const lastWeek = [6, 8, 9, 11, 14, 10, 9]
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length
  return { days, totals, highs, mids, lows, lastWeek, avg }
}

export function buildTrendChartOption(timeRange) {
  const { days, totals, highs, mids, lows, lastWeek, avg } = getTrendSeries()
  const showCompare = timeRange !== 'today'

  return {
    color: ['#4F46E5', '#9CA3AF'],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter(params) {
        const i = params[0]?.dataIndex
        if (i === undefined) return ''
        const h = highs[i]
        const m = mids[i]
        const l = lows[i]
        const t = totals[i]
        let s = `${days[i]}<br/>风险数量：${t} 起<br/>`
        s += `其中：高 ${h} 起，中 ${m} 起，低 ${l} 起`
        return s
      }
    },
    legend: showCompare
      ? { data: ['本周', '上周同期'], bottom: 0, textStyle: { color: '#5B6871' } }
      : { show: false },
    grid: { left: '3%', right: '4%', bottom: showCompare ? '48' : '8%', top: '14%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#E4E7EC' } },
      axisLabel: { color: '#5B6871' }
    },
    yAxis: {
      type: 'value',
      name: '风险数量',
      nameTextStyle: { color: '#5B6871', fontSize: 11 },
      splitLine: { lineStyle: { color: '#EEF2F6' } },
      axisLabel: { color: '#5B6871' }
    },
    series: [
      {
        name: showCompare ? '本周' : '风险数量',
        type: 'line',
        smooth: true,
        data: totals,
        lineStyle: { color: '#4F46E5', width: 2 },
        itemStyle: { color: '#4F46E5', borderColor: '#fff', borderWidth: 2 },
        symbol: 'circle',
        symbolSize: 8,
        areaStyle: {
          color: {
            type: 'linear',
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(79,70,229,0.22)' },
              { offset: 1, color: 'rgba(79,70,229,0.02)' }
            ]
          }
        },
        markLine: {
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#A5B4FC' },
          data: [{ yAxis: avg, label: { formatter: `均值 ${avg.toFixed(1)}`, color: '#6B7280' } }]
        }
      },
      ...(showCompare
        ? [
            {
              name: '上周同期',
              type: 'line',
              smooth: true,
              data: lastWeek,
              lineStyle: { color: '#9CA3AF', width: 2, type: 'dashed' },
              itemStyle: { color: '#9CA3AF' },
              symbol: 'circle',
              symbolSize: 6,
              areaStyle: undefined
            }
          ]
        : [])
    ]
  }
}

export function buildLevelPieOption() {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {d}% ({c}起)' },
    color: ['#EF4444', '#F59E0B', '#10B981'],
    legend: { bottom: 0, textStyle: { color: '#5B6871' } },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '46%'],
        data: [
          { value: 3, name: '高' },
          { value: 12, name: '中' },
          { value: 8, name: '低' }
        ],
        label: { show: true, formatter: '{b}\n{d}%' },
        emphasis: { scale: true, scaleSize: 6 }
      }
    ]
  }
}

export function buildSectorBarOption() {
  const data = [
    { name: '能耗', pct: 35, wow: 8 },
    { name: '安全', pct: 28, wow: -3 },
    { name: '食堂', pct: 18, wow: 5 },
    { name: '物业', pct: 12, wow: 0 },
    { name: '资产', pct: 7, wow: -2 }
  ]
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter(params) {
        const p = params[0]
        const row = data[p.dataIndex]
        if (!row) return ''
        const arrow = row.wow > 0 ? `↑${row.wow}%` : row.wow < 0 ? `↓${Math.abs(row.wow)}%` : '→'
        return `${row.name}<br/>占比：${row.pct}%<br/>环比：${arrow}`
      }
    },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#5B6871' },
      splitLine: { lineStyle: { color: '#EEF2F6' } }
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: '#E4E7EC' } },
      axisLabel: { color: '#5B6871' }
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.pct),
        barMaxWidth: 22,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#6366F1' },
              { offset: 1, color: '#4F46E5' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: ({ value }) => `${value}%`,
          color: '#5B6871',
          fontSize: 11
        }
      }
    ]
  }
}

export function buildDeptEfficiencyBarOption() {
  const names = ['食堂科', '能耗科', '安全科', '物业科', '资产科']
  const hours = [2.5, 2.8, 3.2, 4.5, 5.1]
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '小时',
      nameTextStyle: { color: '#5B6871', fontSize: 11 },
      splitLine: { lineStyle: { color: '#EEF2F6' } },
      axisLabel: { color: '#5B6871' }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#E4E7EC' } },
      axisLabel: { color: '#5B6871' }
    },
    series: [
      {
        type: 'bar',
        data: hours,
        barMaxWidth: 18,
        itemStyle: { color: '#4F46E5', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          formatter: ({ value }) => `${value}h`,
          color: '#5B6871',
          fontSize: 11
        }
      }
    ]
  }
}

export const TOP_HOTSPOTS_MOCK = [
  {
    rank: 1,
    name: '1号楼配电房',
    count: 8,
    delta: 2,
    types: '用电突增、设备离线'
  },
  {
    rank: 2,
    name: '食堂后厨',
    count: 5,
    delta: -1,
    types: '晨检不合格、三清三关未完成'
  },
  {
    rank: 3,
    name: 'B1消防泵房',
    count: 4,
    delta: 0,
    types: '水压异常、设备离线'
  },
  {
    rank: 4,
    name: '综合办公楼3F',
    count: 3,
    delta: 3,
    types: '烟感告警、通道占用'
  },
  {
    rank: 5,
    name: '工程楼机房',
    count: 2,
    delta: -2,
    types: '温湿度异常'
  }
]

export const LATEST_EVENTS_MOCK = [
  {
    id: 'R240424001',
    eventId: 'evt-240424001',
    source: 'rule',
    time: '10:23',
    title: '1号楼用电量突增32%',
    summary: '当前值1320kWh，环比上升38%，超过阈值30%',
    level: 'high',
    action: 'dispose'
  },
  {
    id: 'R240424002',
    eventId: 'evt-240424018',
    source: 'third_party',
    time: '09:45',
    title: 'B1层烟感探测器报警',
    summary: '火警确认中，消防值班室已接收',
    level: 'high',
    action: 'detail'
  },
  {
    id: 'R240424003',
    eventId: 'evt-240425011',
    source: 'manual',
    time: '08:15',
    title: '食堂晨检不合格',
    summary: '晨检记录异常，请检查当日晨检数据',
    level: 'medium',
    action: 'dispose'
  },
  {
    id: 'R240424004',
    eventId: 'evt-240421003',
    source: 'third_party',
    time: '07:50',
    title: '电表离线(3号楼总电表)',
    summary: '电表离线超10分钟，请检查通信链路',
    level: 'medium',
    action: 'detail'
  },
  {
    id: 'R240424005',
    eventId: 'evt-240423004',
    source: 'rule',
    time: '06:30',
    title: '夜间用水异常',
    summary: '凌晨2:00-4:00持续用水，疑似漏水',
    level: 'low',
    action: 'detail'
  }
]

export function trendSummaryStats() {
  return {
    vsLastWeek: '-2.3%',
    peakDay: '4/21',
    peakVal: 15,
    peakHint: '较上周下降8%',
    dailyAvg: '11.2',
    dailyHint: '较上周下降5%'
  }
}

export function sectorSummaryLine() {
  return { totalWow: 12 }
}

export const EFFICIENCY_KPI_MOCK = {
  responseMin: 12,
  responseDelta: '↓2分钟 较昨日',
  disposeHours: '4.2',
  disposeDelta: '↓0.3h 较昨日',
  overtimeRate: '8.5',
  overtimeDelta: '↓1.2% 较昨日'
}
