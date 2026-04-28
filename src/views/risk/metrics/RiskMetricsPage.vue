<template>
  <div class="risk-metrics-page">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-800">风险指标管理</h1>
      <div class="flex flex-wrap gap-2">
        <el-button type="primary" @click="openCreate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增指标
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
        <el-form-item label="业务板块" class="!mb-0">
          <el-select v-model="filterSector" placeholder="全部" clearable class="w-40" @change="page = 1">
            <el-option label="全部" value="" />
            <el-option
              v-for="s in SECTOR_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="指标名称" class="!mb-0">
          <el-input
            v-model="filterName"
            placeholder="名称或编码"
            clearable
            class="w-48"
            @keyup.enter="page = 1"
          />
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-select v-model="filterStatus" placeholder="全部" clearable class="w-32" @change="page = 1">
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
      <el-table
        :data="pagedRows"
        row-key="id"
        @selection-change="(s) => (selection = s)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column prop="code" label="指标编码" min-width="150" show-overflow-tooltip />
        <el-table-column prop="name" label="指标名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="板块" width="100">
          <template #default="{ row }">{{ row.sectorLabel }}</template>
        </el-table-column>
        <el-table-column prop="dataSourceName" label="数据源" min-width="110" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="72" />
        <el-table-column label="状态" width="100">
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
        <el-table-column label="操作" width="328" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openTest(row)">测试</el-button>
            <el-button link type="primary" size="small" @click="openTrialLog(row)">试运行日志</el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-t text-sm text-gray-500" style="border-color: var(--yw-border)">
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

    <RiskMetricFormDialog
      v-model:visible="formVisible"
      :mode="formMode"
      :record="editingRecord"
      :existing-codes="existingCodes"
      :metric-prefill="metricPrefill"
      @saved="onFormSaved"
    />

    <RiskMetricTestDialog v-model:visible="testVisible" :metric="testingMetric" />

    <RiskMetricTrialLogDialog v-model:visible="trialLogVisible" :metric="trialLogMetric" />

    <RiskMetricDeleteSuccessDialog
      v-model:visible="deleteSuccessVisible"
      :metric-name="deleteSuccessContext.name"
      :linked-rule-count="deleteSuccessContext.ruleCount"
      @view-rules="onViewRulesAfterDelete"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStandardMetricTypeByKey } from '@/data/riskStandardMetrics'
import { Download, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RiskMetricDeleteSuccessDialog from '@/components/risk/RiskMetricDeleteSuccessDialog.vue'
import RiskMetricFormDialog from '@/components/risk/RiskMetricFormDialog.vue'
import RiskMetricTestDialog from '@/components/risk/RiskMetricTestDialog.vue'
import RiskMetricTrialLogDialog from '@/components/risk/RiskMetricTrialLogDialog.vue'
import {
  expandMockRows,
  SECTOR_OPTIONS,
  seedRiskMetrics
} from '@/data/riskMetricsMock'

const router = useRouter()
const route = useRoute()
const metricPrefill = ref(null)

const list = ref(expandMockRows(seedRiskMetrics()))

const filterSector = ref('')
const filterName = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const selection = ref([])
const fileInputRef = ref(null)

const formVisible = ref(false)
const formMode = ref('create')
const editingRecord = ref(null)

const testVisible = ref(false)
const testingMetric = ref(null)

const trialLogVisible = ref(false)
const trialLogMetric = ref(null)

const deleteSuccessVisible = ref(false)
const deleteSuccessContext = ref({ name: '', ruleCount: 0 })

const existingCodes = computed(() =>
  list.value.filter((r) => !r.deleted).map((r) => r.code)
)

const filteredRows = computed(() => {
  let rows = list.value.filter((r) => !r.deleted)
  if (filterSector.value) rows = rows.filter((r) => r.sector === filterSector.value)
  if (filterStatus.value) rows = rows.filter((r) => r.status === filterStatus.value)
  if (filterName.value.trim()) {
    const q = filterName.value.trim().toLowerCase()
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)
    )
  }
  return rows
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function resetFilters() {
  filterSector.value = ''
  filterName.value = ''
  filterStatus.value = ''
  page.value = 1
}

function tryOpenFromStandardQuery() {
  const k = route.query.standardMetricKey
  if (!k) return
  const std = getStandardMetricTypeByKey(String(k))
  if (!std) {
    router.replace({ path: route.path, query: {} })
    return
  }
  metricPrefill.value = {
    name: std.name,
    unit: std.defaultUnit,
    dataSourceType: std.defaultDataSourceType
  }
  formMode.value = 'create'
  editingRecord.value = null
  formVisible.value = true
  router.replace({ path: route.path, query: {} })
}

watch(
  () => route.query.standardMetricKey,
  (k) => {
    if (k) tryOpenFromStandardQuery()
  },
  { immediate: true }
)

function openCreate() {
  metricPrefill.value = null
  formMode.value = 'create'
  editingRecord.value = null
  formVisible.value = true
}

function openView(row) {
  formMode.value = 'view'
  editingRecord.value = row
  formVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingRecord.value = row
  formVisible.value = true
}

function openTest(row) {
  testingMetric.value = row
  testVisible.value = true
}

function openTrialLog(row) {
  trialLogMetric.value = row
  trialLogVisible.value = true
}

function onFormSaved(payload) {
  if (formMode.value === 'view') return
  metricPrefill.value = null
  if (formMode.value === 'create') {
    list.value.unshift({
      id: `rm-${Date.now()}`,
      ...payload,
      deleted: false,
      referencedByRules: 0
    })
    page.value = 1
  } else if (editingRecord.value) {
    const idx = list.value.findIndex((r) => r.id === editingRecord.value.id)
    if (idx !== -1) {
      list.value[idx] = {
        ...list.value[idx],
        ...payload,
        id: list.value[idx].id,
        referencedByRules: list.value[idx].referencedByRules
      }
    }
  }
}

async function onToggleStatus(row, enabled) {
  const next = enabled ? 'enabled' : 'disabled'
  if (!enabled && row.referencedByRules > 0) {
    try {
      await ElMessageBox.confirm(
        '停用后关联规则将自动失效，是否继续？',
        '停用指标',
        { type: 'warning' }
      )
    } catch {
      return
    }
  }
  row.status = next
  ElMessage.success(next === 'enabled' ? '已启用' : '已停用')
}

async function onDelete(row) {
  const linked = row.referencedByRules || 0
  const msg =
    linked > 0
      ? `确认删除指标「${row.name}」？关联的 ${linked} 条规则将自动停用。（软删除，可从备份恢复）`
      : `确认删除该指标？（软删除，可从备份恢复）`
  try {
    await ElMessageBox.confirm(msg, '删除', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const name = row.name
  const ruleCount = linked
  row.deleted = true
  deleteSuccessContext.value = { name, ruleCount }
  deleteSuccessVisible.value = true
}

function onViewRulesAfterDelete() {
  router.push({ name: 'RiskRules' })
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
      const arr = Array.isArray(data) ? data : data.metrics
      if (!Array.isArray(arr)) throw new Error('格式应为指标数组或 { metrics: [] }')
      let n = 0
      arr.forEach((item) => {
        if (!item.code || !item.name) return
        if (list.value.some((r) => r.code === item.code && !r.deleted)) return
        list.value.unshift({
          id: `rm-${Date.now()}-${n}`,
          sector: item.sector || 'ENERGY',
          sectorLabel:
            SECTOR_OPTIONS.find((s) => s.value === (item.sector || 'ENERGY'))?.label || '能耗管理',
          dataSourceName: item.dataSourceName || '导入',
          dataSourceType: item.dataSourceType || 'API',
          referencedByRules: 0,
          deleted: false,
          ...item
        })
        n += 1
      })
      ElMessage.success(`已导入 ${n} 条指标`)
      page.value = 1
    } catch (err) {
      ElMessage.error('JSON 解析失败，请检查文件格式')
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function exportJson() {
  const exportList = selection.value.length
    ? selection.value
    : filteredRows.value
  const payload = exportList.map(({ id, deleted, ...rest }) => rest)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-metrics-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}
</script>
