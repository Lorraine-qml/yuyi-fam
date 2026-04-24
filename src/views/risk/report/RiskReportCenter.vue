<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <h3 class="text-sm font-semibold text-gray-800 mb-3">快速生成</h3>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500">报告周期</label>
            <el-select v-model="quick.period" class="w-full mt-1" @change="onPeriodChange">
              <el-option
                v-for="p in PERIOD_OPTIONS"
                :key="p.value"
                :label="p.label"
                :value="p.value"
              />
            </el-select>
          </div>
          <div>
            <label class="text-xs text-gray-500">时间范围</label>
            <el-input :model-value="timeRangeText" readonly class="mt-1" />
          </div>
          <div>
            <label class="text-xs text-gray-500">模板</label>
            <el-select v-model="quick.templateId" class="w-full mt-1" filterable>
              <el-option
                v-for="t in filteredTemplates"
                :key="t.id"
                :label="`${t.name}`"
                :value="t.id"
              />
            </el-select>
          </div>
          <div class="flex flex-wrap gap-2 pt-2">
            <el-button type="primary" @click="generateReport">生成报告</el-button>
            <el-button @click="exportCurrent('pdf')">导出</el-button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <h3 class="text-sm font-semibold text-gray-800 mb-3">我的报告</h3>
        <ul class="space-y-2 text-sm max-h-[220px] overflow-y-auto">
          <li
            v-for="r in myReports"
            :key="r.id"
            class="py-2 px-2 rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700 border border-transparent"
            :class="{ 'border-primary-200 bg-indigo-50/50': previewRefId === r.id }"
            @click="loadHistoryReport(r)"
          >
            <div class="font-medium">{{ r.title }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ r.generatedAt }}</div>
          </li>
        </ul>
        <el-button link type="primary" class="mt-2 !px-0" @click="scrollToPreview">查看预览区</el-button>
      </div>

      <div
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <h3 class="text-sm font-semibold text-gray-800 mb-3">定时任务</h3>
        <ul class="space-y-2 text-sm text-gray-600 mb-3">
          <li v-for="s in schedules.slice(0, 3)" :key="s.id" class="flex justify-between gap-2">
            <span class="truncate">{{ s.name }}</span>
            <el-tag :type="s.enabled ? 'success' : 'info'" size="small">{{ s.cycleLabel }}</el-tag>
          </li>
        </ul>
        <el-button type="primary" plain class="w-full" @click="goSchedules">管理任务</el-button>
      </div>
    </div>

    <div
      ref="previewRef"
      class="rounded-xl border bg-white p-5 shadow-sm mb-4"
      style="border-color: var(--yw-border)"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 class="text-lg font-semibold text-gray-800">【{{ periodTitle }}预览】{{ previewMeta.subtitle }}</h2>
        <div class="flex flex-wrap gap-2">
          <el-button size="small" @click="exportCurrent('pdf')">导出 PDF</el-button>
          <el-button size="small" @click="exportCurrent('excel')">导出 Excel</el-button>
          <el-button size="small" @click="exportCurrent('word')">导出 Word</el-button>
          <el-button size="small" type="primary" @click="pushDialog = true">推送</el-button>
        </div>
      </div>

      <div v-if="activeSections.header" class="text-sm text-gray-500 mb-4 pb-3 border-b" style="border-color: var(--yw-border)">
        生成人：系统管理员 · 生成时间：{{ nowText }} · 模板：{{ activeTemplate?.name || '—' }}
      </div>

      <template v-if="activeSections.overviewCards">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">一、{{ overviewSectionTitle }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div
            v-for="c in overviewCards"
            :key="c.label"
            class="rounded-xl border p-4 text-center"
            style="border-color: var(--yw-border)"
          >
            <div class="text-2xl font-bold text-gray-800">{{ c.value }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ c.label }}</div>
          </div>
        </div>
      </template>

      <template v-if="activeSections.levelPie">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">二、风险等级分布</h3>
        <div class="mb-6 max-w-md mx-auto">
          <ChartContainer :option="pieOption" height="260px" />
        </div>
      </template>

      <template v-if="activeSections.trendLine">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">三、近8周风险趋势</h3>
        <ChartContainer :option="trendOption" height="280px" />
      </template>

      <template v-if="activeSections.regionTable">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">四、高风险区域 TOP5</h3>
        <ol class="list-decimal list-inside text-sm text-gray-700 space-y-1 mb-6">
          <li v-for="(r, i) in previewMeta.topRegions" :key="i">
            {{ r.name }}（{{ r.count }}次）
          </li>
        </ol>
      </template>

      <template v-if="activeSections.openRisksTable">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">未处置风险明细（示例）</h3>
        <el-table :data="mockOpenRisks" border size="small" class="mb-4">
          <el-table-column prop="title" label="风险事件" min-width="120" />
          <el-table-column prop="level" label="等级" width="72" />
          <el-table-column prop="time" label="发生时间" width="140" />
          <el-table-column prop="area" label="所属区域" width="100" />
          <el-table-column prop="owner" label="责任人" width="88" />
          <el-table-column prop="status" label="状态" width="88" />
        </el-table>
      </template>

      <template v-if="activeSections.ruleStats">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">预警规则触发统计 TOP5（示例）</h3>
        <el-table :data="mockRuleHits" border size="small" class="mb-4">
          <el-table-column prop="name" label="规则" />
          <el-table-column prop="cnt" label="触发次数" width="100" />
        </el-table>
      </template>

      <template v-if="activeSections.efficiencyBar">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">处置效率（示例）</h3>
        <ChartContainer :option="effBarOption" height="240px" />
      </template>

      <div v-if="activeSections.footer" class="text-xs text-gray-400 pt-4 border-t" style="border-color: var(--yw-border)">
        本报告由机管局风险管理平台自动生成，数据来源于指标与规则引擎汇总结果。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/ChartContainer.vue'
import {
  mockOpenRisks,
  mockRuleHits,
  useRiskReportShared
} from './riskReportShared'

const router = useRouter()
const previewRef = ref(null)

const {
  PERIOD_OPTIONS,
  schedules,
  myReports,
  quick,
  previewRefId,
  previewMeta,
  pieOption,
  trendOption,
  effBarOption,
  pushDialog,
  filteredTemplates,
  activeTemplate,
  activeSections,
  periodTitle,
  timeRangeText,
  overviewSectionTitle,
  overviewCards,
  nowText,
  onPeriodChange,
  generateReport,
  loadHistoryReport,
  exportCurrent
} = useRiskReportShared()

function scrollToPreview() {
  previewRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

function goSchedules() {
  router.push({ name: 'RiskReportSchedules' })
}
</script>
