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
        <el-button link type="primary" class="mt-2 !px-0" @click="scrollToPreview">查看全部 / 定位预览</el-button>
      </div>

      <div
        class="rounded-xl border bg-white p-4 shadow-sm"
        style="border-color: var(--yw-border)"
      >
        <h3 class="text-sm font-semibold text-gray-800 mb-3">定时任务</h3>
        <ul class="space-y-2.5 text-sm text-gray-600 mb-3">
          <li
            v-for="s in schedules.slice(0, 3)"
            :key="s.id"
            class="flex flex-col gap-0.5 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
          >
            <div class="flex justify-between gap-2 items-start">
              <span class="truncate font-medium text-gray-800">{{ s.name }}</span>
              <el-tag :type="s.enabled ? 'success' : 'info'" size="small" effect="plain">
                {{ s.enabled ? '启用' : '停用' }}
              </el-tag>
            </div>
            <div class="text-xs text-gray-500">
              {{ s.cycleLabel }} · {{ s.runTime }}
              <span v-if="s.cycle === 'cron' && s.cronExpr" class="ml-1 font-mono">({{ s.cronExpr }})</span>
            </div>
          </li>
        </ul>
        <el-button type="primary" plain class="w-full" @click="goSchedules">管理任务</el-button>
      </div>
    </div>

    <div
      ref="previewRef"
      v-loading="previewLoading"
      element-loading-text="正在生成预览…"
      class="rounded-xl border bg-white p-5 shadow-sm mb-4 min-h-[120px]"
      style="border-color: var(--yw-border)"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 class="text-lg font-semibold text-gray-800">
          【{{ periodTitle }}预览】{{ previewMeta.subtitle }}
        </h2>
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
        <h3 class="text-sm font-semibold text-gray-800 mb-1">四、高风险区域 TOP5</h3>
        <p class="text-xs text-gray-500 mb-4">按本周期内风险事件次数降序；条长表示相对最高频区域的占比。</p>
        <div class="region-top5-wrap mb-6">
          <div
            v-for="(row, i) in topRegionBars"
            :key="`${row.name}-${i}`"
            class="region-top5-item"
          >
            <div
              class="region-top5-rank"
              :data-rank="i + 1"
            >
              {{ i + 1 }}
            </div>
            <div class="region-top5-body">
              <div class="region-top5-head">
                <span class="region-top5-name" :title="row.name">{{ row.name }}</span>
                <div class="region-top5-meta">
                  <span class="region-top5-count">{{ row.count }}<small>次</small></span>
                  <span v-if="row.sharePct != null" class="region-top5-pct">占 {{ row.sharePct }}%</span>
                </div>
              </div>
              <div class="region-top5-track" aria-hidden="true">
                <div
                  class="region-top5-fill"
                  :style="{
                    width: `${row.barWidthPct}%`,
                    background: row.barGradient
                  }"
                />
              </div>
            </div>
          </div>
        </div>
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
import { computed, ref } from 'vue'
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
  previewLoading,
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

const RANK_BAR_GRADIENTS = [
  'linear-gradient(90deg, #DC2626 0%, #FCA5A5 100%)',
  'linear-gradient(90deg, #EA580C 0%, #FDBA74 100%)',
  'linear-gradient(90deg, #CA8A04 0%, #FDE047 100%)',
  'linear-gradient(90deg, #65A30D 0%, #BEF264 100%)',
  'linear-gradient(90deg, #0D9488 0%, #5EEAD4 100%)'
]

const topRegionBars = computed(() => {
  const list = previewMeta.value?.topRegions || []
  if (!list.length) return []
  const max = Math.max(...list.map((r) => r.count), 1)
  const total = list.reduce((s, r) => s + r.count, 0) || 1
  return list.map((r, i) => ({
    name: r.name,
    count: r.count,
    barWidthPct: Math.round((r.count / max) * 1000) / 10,
    sharePct: Math.round((r.count / total) * 1000) / 10,
    barGradient: RANK_BAR_GRADIENTS[Math.min(i, RANK_BAR_GRADIENTS.length - 1)]
  }))
})

function scrollToPreview() {
  previewRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

function goSchedules() {
  router.push({ name: 'RiskReportSchedules' })
}
</script>

<style scoped>
.region-top5-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.region-top5-item {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 640px) {
  .region-top5-item {
    gap: 1rem;
  }
}

.region-top5-rank {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.region-top5-rank[data-rank='1'] {
  background: linear-gradient(135deg, #e11d48, #f43f5e);
}
.region-top5-rank[data-rank='2'] {
  background: linear-gradient(135deg, #ea580c, #fb7185);
}
.region-top5-rank[data-rank='3'] {
  background: linear-gradient(135deg, #d97706, #fbbf24);
}
.region-top5-rank[data-rank='4'] {
  background: linear-gradient(135deg, #4f46e5, #818cf8);
}
.region-top5-rank[data-rank='5'] {
  background: linear-gradient(135deg, #0d9488, #2dd4bf);
}

.region-top5-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%);
  border: 1px solid var(--yw-border, #e5e7eb);
}

.region-top5-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
}

.region-top5-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.region-top5-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
  font-size: 0.75rem;
}

.region-top5-count {
  font-size: 1rem;
  font-weight: 700;
  color: #4f46e5;
  font-variant-numeric: tabular-nums;
}

.region-top5-count small {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  margin-left: 0.125rem;
}

.region-top5-pct {
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
}

.region-top5-track {
  height: 0.625rem;
  border-radius: 9999px;
  background: #e5e7eb;
  overflow: hidden;
  width: 100%;
}

.region-top5-fill {
  height: 100%;
  min-width: 4px;
  border-radius: 9999px;
  transition: width 0.5s ease-out;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
</style>
