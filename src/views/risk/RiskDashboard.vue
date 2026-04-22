<template>
  <div class="px-6 py-6 max-w-[1600px] mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">机管局风险看板</h1>
      <p class="text-gray-500 text-sm mt-1">实时监控风险态势，支持预警与闭环处置</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <StatCard
        title="未处置风险"
        :value="unhandledCount"
        subText="超时未处置：2"
        :iconComponent="Warning"
        iconBgClass="bg-red-50"
        iconColorClass="text-red-500"
        linkText="查看详情"
      />
      <StatCard
        title="今日新增"
        :value="todayNewCount"
        subText="较昨日 +12%"
        :iconComponent="Plus"
        iconBgClass="bg-blue-50"
        iconColorClass="text-blue-500"
      />
      <StatCard title="处理中" :value="processingCount" :iconComponent="Clock" />
      <StatCard title="已闭环" :value="closedCount" :iconComponent="CircleCheck" />
    </div>

    <SearchBar @search="onSearch" @reset="onReset" @export="exportReport" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h3 class="font-semibold text-gray-800 mb-3">近7天风险趋势</h3>
          <ChartContainer :option="trendChartOption" height="280px" />
        </div>
      </div>
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm border p-5">
          <h3 class="font-semibold text-gray-800 mb-2">未处置风险等级分布</h3>
          <ChartContainer :option="pieChartOption" height="220px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { CircleCheck, Clock, Plus, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ChartContainer from '@/components/ChartContainer.vue'
import SearchBar from '@/components/SearchBar.vue'
import StatCard from '@/components/StatCard.vue'

const unhandledCount = ref(12)
const todayNewCount = ref(5)
const processingCount = ref(8)
const closedCount = ref(21)

const trendChartOption = reactive({
  color: ['#4f46e5'],
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: [6, 9, 8, 10, 12, 11, 7] }]
})

const pieChartOption = reactive({
  color: ['#ef4444', '#f59e0b', '#10b981'],
  tooltip: { trigger: 'item' },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      data: [
        { value: 4, name: '高' },
        { value: 5, name: '中' },
        { value: 3, name: '低' }
      ]
    }
  ]
})

const onSearch = (params) => {
  ElMessage.success(`已查询：${params.keyword || '全部'}`)
}

const onReset = () => {
  ElMessage.success('筛选条件已重置')
}

const exportReport = () => {
  ElMessage.success('导出任务已提交')
}
</script>
