<template>
  <div class="space-y-6">
    <div
      class="rounded-xl px-5 py-4 sm:px-6 sm:py-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
    >
      <div>
        <p class="text-white/90 text-sm">欢迎回来</p>
        <p class="text-lg sm:text-xl font-semibold mt-1">
          {{ userLabel }} · {{ roleLabel }}
        </p>
      </div>
      <div class="text-sm sm:text-base font-medium tabular-nums opacity-95">
        {{ clockText }}
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <router-link
        v-for="card in moduleCards"
        :key="card.path"
        :to="card.path"
        class="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
            :style="{ background: card.color }"
          >
            <el-icon :size="20"><component :is="card.icon" /></el-icon>
          </div>
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
              {{ card.title }}
            </h3>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ card.desc }}</p>
          </div>
        </div>
      </router-link>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="font-semibold text-gray-800 mb-3">近 7 日工单趋势</h3>
        <ChartContainer :option="lineOption" height="260px" />
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="font-semibold text-gray-800 mb-3">本月能耗概览</h3>
        <ChartContainer :option="barOption" height="260px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  Box,
  DataAnalysis,
  Lightning,
  Lock,
  OfficeBuilding,
  Warning
} from '@element-plus/icons-vue'
import ChartContainer from '@/components/ChartContainer.vue'

const userLabel = ref('管理员')
const roleLabel = ref('园区运营经理')
const clockText = ref('')

let timer = null

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function tick() {
  const d = new Date()
  clockText.value = `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const moduleCards = [
  {
    title: '资产管理',
    desc: '台账、盘点与折旧',
    path: '/asset',
    icon: Box,
    color: '#4f46e5'
  },
  {
    title: '物业管理',
    desc: '工单、巡检、维保',
    path: '/property',
    icon: OfficeBuilding,
    color: '#f97316'
  },
  {
    title: '运营管理',
    desc: '指标与合同报表',
    path: '/operation',
    icon: DataAnalysis,
    color: '#22c55e'
  },
  {
    title: '能源管理',
    desc: '水电气耗与告警',
    path: '/energy',
    icon: Lightning,
    color: '#eab308'
  },
  {
    title: '安全管理',
    desc: '消防、安防、监控',
    path: '/security',
    icon: Lock,
    color: '#64748b'
  },
  {
    title: '风险管理',
    desc: '看板、指标与规则',
    path: '/risk/dashboard',
    icon: Warning,
    color: '#ef4444'
  }
]

const lineOption = reactive({
  color: ['#4F46E5', '#10B981'],
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增工单', '完成工单'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
      name: '新增工单',
      type: 'line',
      smooth: true,
      data: [12, 15, 11, 18, 14, 9, 13],
      lineStyle: { color: '#4F46E5', width: 2 },
      itemStyle: { color: '#4F46E5' }
    },
    {
      name: '完成工单',
      type: 'line',
      smooth: true,
      data: [10, 14, 12, 16, 15, 8, 12],
      lineStyle: { color: '#10B981', width: 2 },
      itemStyle: { color: '#10B981' }
    }
  ]
})

const barOption = reactive({
  color: ['#4F46E5'],
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: '#E4E7EC' } },
    axisLabel: { color: '#5B6871' }
  },
  yAxis: {
    type: 'value',
    name: 'kWh',
    splitLine: { lineStyle: { color: '#EEF2F6' } },
    axisLabel: { color: '#5B6871' }
  },
  series: [
    {
      type: 'bar',
      data: [4200, 3980, 4510, 4120, 3890, 4050],
      barMaxWidth: 36,
      itemStyle: { color: '#4F46E5' }
    }
  ]
})

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>
