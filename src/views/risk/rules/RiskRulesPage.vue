<template>
  <div class="risk-rules-page">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-800">风险规则配置</h1>
      <div class="flex flex-wrap gap-2">
        <el-button type="primary" @click="openCreate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增规则
        </el-button>
        <el-button @click="templateDrawer = true">
          <el-icon class="mr-1"><Document /></el-icon>
          模板库
        </el-button>
        <el-button @click="triggerImport">
          <el-icon class="mr-1"><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="exportJson">
          <el-icon class="mr-1"><Download /></el-icon>
          导出
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImportFile"
        />
      </div>
    </div>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm mb-4"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-3">
        <el-form-item label="规则名称" class="!mb-0">
          <el-input v-model="filterName" placeholder="名称关键字" clearable class="w-44" />
        </el-form-item>
        <el-form-item label="关联指标" class="!mb-0">
          <el-select v-model="filterMetric" placeholder="全部" clearable class="w-52" filterable>
            <el-option label="全部" value="" />
            <el-option
              v-for="m in metricOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="等级" class="!mb-0">
          <el-select v-model="filterLevel" placeholder="全部" clearable class="w-32" @change="page = 1">
            <el-option label="全部" value="" />
            <el-option
              v-for="l in RULE_LEVEL_OPTIONS"
              :key="l.value"
              :label="l.labelShort"
              :value="l.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-select v-model="filterStatus" placeholder="全部" clearable class="w-28" @change="page = 1">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="page = 1">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <el-table :data="pagedRows" row-key="id">
        <el-table-column prop="name" label="规则名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="metricName" label="关联指标" min-width="120" show-overflow-tooltip />
        <el-table-column label="表达式" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="text-xs text-gray-700">{{ row.expressionDisplay || row.expression }}</code>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="88" align="center">
          <template #default="{ row }">
            <el-tag :type="row.levelTag" size="small" effect="light">{{ row.levelLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="88" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 'enabled'"
              inline-prompt
              active-text="启"
              inactive-text="停"
              @change="(v) => onToggleStatus(row, v)"
            />
          </template>
        </el-table-column>
        <el-table-column label="试运行" width="88" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.runMode === 'trial'" type="warning" size="small" effect="plain">
              试运行
            </el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="72" align="center">
          <template #default="{ row }">
            <span class="text-xs text-gray-600">{{ row.versionLabel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openTest(row)">测试</el-button>
            <el-button link type="primary" size="small" @click="copyRule(row)">复制</el-button>
            <el-button
              v-if="row.runMode === 'trial'"
              link
              type="primary"
              size="small"
              @click="openTrialLog(row)"
              >日志</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div
        class="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-t text-sm text-gray-500"
        style="border-color: var(--yw-border)"
      >
        <span>共 {{ filteredRows.length }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="filteredRows.length"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next, sizes"
          background
        />
      </div>
    </div>

    <RiskRuleFormDialog
      v-model:visible="formVisible"
      :mode="formMode"
      :record="editingRecord"
      :metric-options="metricOptions"
      @saved="onFormSaved"
      @test="onFormTest"
    />

    <RiskRuleTestDialog v-model:visible="testVisible" :rule="testingRule" />

    <RiskRuleTrialLogDialog v-model:visible="trialLogVisible" :rule="trialLogRule" />

    <el-drawer v-model="templateDrawer" title="规则模板库" size="400px">
      <div class="space-y-6">
        <div v-for="cat in templateCategories" :key="cat">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">{{ cat }}</h4>
          <ul class="space-y-2">
            <li
              v-for="t in templatesByCat[cat]"
              :key="t.name + t.metricCode"
              class="rounded-lg border p-3 cursor-pointer hover:bg-gray-50 text-sm"
              style="border-color: var(--yw-border)"
              @click="applyTemplate(t)"
            >
              <div class="font-medium text-gray-800">{{ t.name }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ t.description }}</div>
              <code class="text-xs text-primary-600 block mt-1">{{ t.expression }}</code>
            </li>
          </ul>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Document, Download, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import RiskRuleFormDialog from '@/components/risk/RiskRuleFormDialog.vue'
import RiskRuleTestDialog from '@/components/risk/RiskRuleTestDialog.vue'
import RiskRuleTrialLogDialog from '@/components/risk/RiskRuleTrialLogDialog.vue'
import { getMetricSelectOptions } from '@/data/riskMetricsMock'
import {
  expandRulesTo32,
  levelMeta,
  RULE_LEVEL_OPTIONS,
  RULE_TEMPLATES,
  seedRiskRules
} from '@/data/riskRulesMock'

const list = ref(expandRulesTo32(seedRiskRules()))
const metricOptions = ref(getMetricSelectOptions())

const filterName = ref('')
const filterMetric = ref('')
const filterLevel = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const fileInputRef = ref(null)

const formVisible = ref(false)
const formMode = ref('create')
const editingRecord = ref(null)

const testVisible = ref(false)
const testingRule = ref(null)

const trialLogVisible = ref(false)
const trialLogRule = ref(null)

const templateDrawer = ref(false)

const templateCategories = ['能耗', '安全', '食堂', '物业']
const templatesByCat = computed(() => {
  const m = { 能耗: [], 安全: [], 食堂: [], 物业: [] }
  RULE_TEMPLATES.forEach((t) => {
    if (m[t.category]) m[t.category].push(t)
  })
  return m
})

const filteredRows = computed(() => {
  let rows = list.value.filter((r) => !r.deleted)
  if (filterMetric.value) rows = rows.filter((r) => r.metricCode === filterMetric.value)
  if (filterLevel.value !== '' && filterLevel.value != null)
    rows = rows.filter((r) => r.level === filterLevel.value)
  if (filterStatus.value) rows = rows.filter((r) => r.status === filterStatus.value)
  if (filterName.value.trim()) {
    const q = filterName.value.trim().toLowerCase()
    rows = rows.filter((r) => r.name.toLowerCase().includes(q))
  }
  return rows
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function resetFilters() {
  filterName.value = ''
  filterMetric.value = ''
  filterLevel.value = ''
  filterStatus.value = ''
  page.value = 1
}

function openCreate() {
  formMode.value = 'create'
  editingRecord.value = null
  formVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingRecord.value = row
  formVisible.value = true
}

function openTest(row) {
  testingRule.value = { ...row }
  testVisible.value = true
}

function onFormTest(payload) {
  testingRule.value = { ...payload }
  testVisible.value = true
}

function openTrialLog(row) {
  trialLogRule.value = row
  trialLogVisible.value = true
}

function applyTemplate(t) {
  const lm = levelMeta(t.level)
  templateDrawer.value = false
  formMode.value = 'create'
  editingRecord.value = {
    id: 'temp',
    name: t.name,
    metricCode: t.metricCode,
    metricName: t.metricName,
    expression: t.expression,
    expressionDisplay: t.expression,
    level: t.level,
    levelLabel: lm.labelShort,
    levelTag: lm.tag,
    eventCategory: t.eventCategory,
    description: t.description,
    primaryOp: t.primaryOp,
    primaryValue: t.primaryValue,
    primaryUnit: t.primaryUnit || '',
    valueType: t.valueType || 'number',
    runMode: 'trial',
    lifecycleStatus: 'trial',
    status: 'enabled',
    silenceMinutes: 30,
    conditionLogic: 'AND',
    timeWindow: 'none',
    dailyStart: '09:00',
    dailyEnd: '18:00',
    workOrderEnabled: true,
    workOrderType: '简要工单处理',
    extraConditions: [],
    eventPreview: t.eventPreview || '',
    version: 1,
    versionLabel: 'v1'
  }
  formVisible.value = true
}

function copyRule(row) {
  list.value.unshift({
    ...JSON.parse(JSON.stringify(row)),
    id: `rr-${Date.now()}`,
    name: `${row.name}（副本）`,
    version: 1,
    versionLabel: 'v1',
    status: 'enabled',
    deleted: false
  })
  page.value = 1
  ElMessage.success('已复制规则，请编辑后保存')
}

function onFormSaved(payload) {
  if (formMode.value === 'create') {
    const lm = levelMeta(payload.level)
    list.value.unshift({
      id: `rr-${Date.now()}`,
      ...payload,
      levelLabel: lm.labelShort,
      levelTag: lm.tag,
      status: 'enabled',
      lifecycleStatus: payload.runMode === 'trial' ? 'trial' : 'production',
      version: 1,
      versionLabel: 'v1',
      deleted: false
    })
    page.value = 1
  } else if (editingRecord.value) {
    const idx = list.value.findIndex((r) => r.id === editingRecord.value.id)
    if (idx !== -1) {
      const nextVer = (list.value[idx].version || 1) + 1
      const lm = levelMeta(payload.level)
      list.value[idx] = {
        ...list.value[idx],
        ...payload,
        levelLabel: lm.labelShort,
        levelTag: lm.tag,
        id: list.value[idx].id,
        version: nextVer,
        versionLabel: `v${nextVer}`,
        lifecycleStatus: payload.runMode === 'trial' ? 'trial' : 'production'
      }
    }
  }
}

function onToggleStatus(row, enabled) {
  row.status = enabled ? 'enabled' : 'disabled'
  ElMessage.success(enabled ? '已启用' : '已停用（不再参与计算）')
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      const arr = Array.isArray(data) ? data : data.rules
      if (!Array.isArray(arr)) throw new Error('invalid')
      let n = 0
      arr.forEach((item) => {
        if (!item.name || !item.metricCode) return
        const lm = levelMeta(item.level || 3)
        list.value.unshift({
          id: `rr-${Date.now()}-${n}`,
          ...item,
          levelLabel: item.levelLabel || lm.labelShort,
          levelTag: item.levelTag || lm.tag,
          version: item.version || 1,
          versionLabel: item.versionLabel || 'v1',
          status: item.status || 'enabled',
          deleted: false,
          expressionDisplay: item.expressionDisplay || item.expression
        })
        n += 1
      })
      ElMessage.success(`已导入 ${n} 条规则`)
    } catch {
      ElMessage.error('JSON 格式错误')
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function exportJson() {
  const rows = filteredRows.value.map((r) => {
    const { id, deleted, ...rest } = r
    return rest
  })
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-rules-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>
