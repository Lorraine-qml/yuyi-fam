<template>
  <el-dialog
    :model-value="visible"
    :title="titleText"
    width="900px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <div
      class="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b"
      style="border-color: var(--yw-border)"
    >
      <span class="text-sm text-gray-600 shrink-0">时间范围：</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        class="!w-[280px] sm:!w-[320px]"
      />
      <el-button type="primary" @click="runQuery">查询</el-button>
      <el-button @click="exportRows">导出</el-button>
    </div>

    <el-table :data="pagedData" border stripe size="small" class="w-full">
      <el-table-column prop="time" label="时间" min-width="160" />
      <el-table-column prop="metricValue" label="指标值" width="100" align="center" />
      <el-table-column label="是否触发" width="96" align="center">
        <template #default="{ row }">
          <el-tag :type="row.triggered ? 'warning' : 'info'" size="small" effect="light">
            {{ row.triggered ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="expectedLevel" label="预期等级" width="100" align="center" />
      <el-table-column prop="expectedEvent" label="预期事件内容" min-width="180" show-overflow-tooltip />
    </el-table>

    <div class="flex justify-end mt-4">
      <el-pagination
        v-model:current-page="logPage"
        v-model:page-size="logPageSize"
        :total="filteredLogs.length"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next, sizes"
        background
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: { type: Boolean, default: false },
  rule: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const titleText = computed(() => {
  const n = props.rule?.name || '规则'
  return `试运行日志 - ${n}`
})

const dateRange = ref(['2026-04-01', '2026-04-24'])
const allLogs = ref([])
const filteredLogs = ref([])
const logPage = ref(1)
const logPageSize = ref(10)

const pagedData = computed(() => {
  const start = (logPage.value - 1) * logPageSize.value
  return filteredLogs.value.slice(start, start + logPageSize.value)
})

function pad(n) {
  return String(n).padStart(2, '0')
}

function eventLabel(rule) {
  if (!rule) return '-'
  if (rule.eventPreview) return rule.eventPreview
  if (rule.name?.includes('晨检')) return '食堂晨检不合格'
  return `${rule.eventCategory || '预警'}：${rule.name}`
}

function levelWhenTriggered(rule) {
  return rule?.levelLabel || '橙色'
}

function buildMockLogs(rule, rangeStart, rangeEnd) {
  const ev = eventLabel(rule)
  const lv = levelWhenTriggered(rule)
  const rows = []
  const start = new Date(rangeStart + 'T00:00:00')
  const end = new Date(rangeEnd + 'T00:00:00')
  const oneDay = 86400000
  for (let t = end.getTime(); t >= start.getTime(); t -= oneDay) {
    const d = new Date(t)
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const minute = 10 + ((y + Number(m) + Number(day)) % 12)
    const timeStr = `${y}-${m}-${day} 08:${pad(minute)}`
    const daySeed = y + Number(m) * 31 + Number(day)
    const triggered = daySeed % 3 !== 0
    const metricValue =
      rule?.valueType === 'string' ? (triggered ? '不合格' : '合格') : triggered ? 1 : 0
    rows.push({
      time: timeStr,
      metricValue,
      triggered,
      expectedLevel: triggered ? lv : '-',
      expectedEvent: triggered ? ev : '-'
    })
  }
  return rows
}

function runQuery() {
  if (!props.rule || !dateRange.value?.[0] || !dateRange.value?.[1]) {
    ElMessage.warning('请选择时间范围')
    return
  }
  allLogs.value = buildMockLogs(props.rule, dateRange.value[0], dateRange.value[1])
  filteredLogs.value = [...allLogs.value]
  logPage.value = 1
  ElMessage.success(`已加载 ${filteredLogs.value.length} 条试运行记录（模拟）`)
}

function exportRows() {
  const rows = filteredLogs.value.length ? filteredLogs.value : allLogs.value
  if (!rows.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const header = ['时间', '指标值', '是否触发', '预期等级', '预期事件内容']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.time,
        r.metricValue,
        r.triggered ? '是' : '否',
        r.expectedLevel,
        `"${String(r.expectedEvent).replace(/"/g, '""')}"`
      ].join(',')
    )
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `规则试运行日志-${props.rule?.name || 'rule'}-${dateRange.value?.join('_') || ''}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.rule) {
      dateRange.value = ['2026-04-01', '2026-04-24']
      logPage.value = 1
      logPageSize.value = 10
      allLogs.value = buildMockLogs(props.rule, dateRange.value[0], dateRange.value[1])
      filteredLogs.value = [...allLogs.value]
    }
  }
)
</script>
