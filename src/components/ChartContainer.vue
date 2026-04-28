<template>
  <div ref="chartRef" class="w-full min-w-0" :style="{ height }"></div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '280px' },
  /** e.g. { click: (params) => {} } — bound after init, cleared on unmount */
  chartEvents: { type: Object, default: null }
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null

const resize = () => chart?.resize()

function afterChartLayout() {
  nextTick(() => {
    requestAnimationFrame(() => {
      chart?.resize()
      setTimeout(() => chart?.resize(), 100)
    })
  })
}

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
  chart.setOption(props.option, { notMerge: true })
  bindChartEvents()
  window.addEventListener('resize', resize)
  if (typeof ResizeObserver !== 'undefined' && chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chart?.resize()
    })
    resizeObserver.observe(chartRef.value)
  }
  afterChartLayout()
})

watch(
  () => props.option,
  (newOpt) => {
    chart?.setOption(newOpt, { notMerge: true })
    afterChartLayout()
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
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', resize)
  unbindChartEvents()
  chart?.dispose()
})
</script>
