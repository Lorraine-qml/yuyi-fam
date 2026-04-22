<template>
  <div ref="chartRef" :style="{ height }"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '280px' }
})

const chartRef = ref(null)
let chart = null

const resize = () => chart?.resize()

onMounted(() => {
  chart = echarts.init(chartRef.value)
  chart.setOption(props.option)
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  (newOpt) => {
    chart?.setOption(newOpt, true)
  },
  { deep: true }
)

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
})
</script>
