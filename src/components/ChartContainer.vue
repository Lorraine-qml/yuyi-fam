<template>
  <div ref="chartRef" class="w-full min-w-0" :style="{ height }"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '280px' },
  /** e.g. { click: (params) => {} } — bound after init, cleared on unmount */
  chartEvents: { type: Object, default: null }
})

const chartRef = ref(null)
let chart = null

const resize = () => chart?.resize()

function bindChartEvents() {
  if (!chart || !props.chartEvents) return
  Object.entries(props.chartEvents).forEach(([evt, handler]) => {
    if (typeof handler === 'function') chart.on(evt, handler)
  })
}

function unbindChartEvents() {
  if (!chart || !props.chartEvents) return
  Object.keys(props.chartEvents).forEach((evt) => chart.off(evt))
}

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption(props.option)
  bindChartEvents()
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  (newOpt) => {
    chart?.setOption(newOpt, true)
  },
  { deep: true }
)

watch(
  () => props.chartEvents,
  () => {
    unbindChartEvents()
    bindChartEvents()
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  unbindChartEvents()
  chart?.dispose()
})
</script>
