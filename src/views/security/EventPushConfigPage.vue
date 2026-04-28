<template>
  <div class="sec-push-config-page space-y-4">
    <h1 class="text-xl font-bold text-gray-800">事件推送配置</h1>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-3" @submit.prevent>
        <el-form-item label="事件分类" class="!mb-0">
          <el-select v-model="filters.category" placeholder="全部" clearable class="!w-40">
            <el-option label="全部" value="" />
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件等级" class="!mb-0">
          <el-select v-model="filters.level" placeholder="全部" clearable class="!w-32">
            <el-option label="全部" value="" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用来源" class="!mb-0">
          <el-select v-model="filters.applicableSource" placeholder="全部" clearable class="!w-40">
            <el-option
              v-for="o in applicableFilterOptions"
              :key="o.value || 'all'"
              :label="o.label"
              :value="o.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">清空</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div
      class="rounded-xl border bg-white p-0 shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <div class="flex items-center justify-between gap-2 px-4 py-3 border-b" style="border-color: var(--yw-border)">
        <el-button type="primary" @click="openCreate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增
        </el-button>
        <div class="flex items-center gap-1">
          <el-button :icon="Refresh" text @click="onSearch" />
        </div>
      </div>

      <el-table :data="pagedRows" border stripe>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="categoryLabel" label="事件分类" min-width="100" />
        <el-table-column prop="levelLabel" label="事件等级" width="90">
          <template #default="{ row }">
            <el-tag :type="row.level === 'high' ? 'danger' : row.level === 'medium' ? 'warning' : 'info'" size="small">
              {{ row.levelLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用来源" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ applicableSourceLabel(row.applicableSource) }}
          </template>
        </el-table-column>
        <el-table-column prop="method" label="通知方式" min-width="120" show-overflow-tooltip />
        <el-table-column prop="effective" label="生效时间" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" size="small" @change="ElMessage.success('已更新（演示）')" />
            <span class="text-xs text-gray-500 ml-1">{{ row.enabled ? '启用' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updater" label="更新人" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openView(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4 border-t" style="border-color: var(--yw-border)">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      destroy-on-close
      append-to-body
      class="push-config-dialog"
      @closed="onDialogClosed"
    >
      <div v-if="formMode !== 'view'" class="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
        <el-card shadow="never" class="detail-style-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">基本匹配规则</span>
          </template>
          <el-form label-width="100px" class="push-inner-form">
            <el-form-item label="事件分类" required>
              <el-select v-model="editForm.category" placeholder="请选择" class="!w-full" :disabled="formMode === 'view'">
                <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="事件等级" required>
              <el-select v-model="editForm.level" placeholder="请选择" class="!w-full" :disabled="formMode === 'view'">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
            <el-form-item label="适用来源" required>
              <el-select
                v-model="editForm.applicableSource"
                placeholder="请选择"
                class="!w-full"
                :disabled="formMode === 'view'"
              >
                <el-option
                  v-for="o in applicableSelectOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="detail-style-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">通知方式</span>
          </template>
          <el-checkbox-group v-model="editForm.notifyChannels" class="flex flex-wrap gap-x-4 gap-y-2">
            <el-checkbox label="ding" :disabled="formMode === 'view'">钉钉通知</el-checkbox>
            <el-checkbox label="sms" :disabled="formMode === 'view'">短信</el-checkbox>
            <el-checkbox label="email" :disabled="formMode === 'view'">邮件</el-checkbox>
            <el-checkbox label="wework" :disabled="formMode === 'view'">企业微信</el-checkbox>
          </el-checkbox-group>
          <div class="mt-3">
            <span class="text-sm text-gray-600 mr-3">生效时间</span>
            <el-radio-group v-model="editForm.effectiveMode" :disabled="formMode === 'view'">
              <el-radio label="permanent">永久生效</el-radio>
              <el-radio label="range">指定时间段</el-radio>
            </el-radio-group>
            <div v-if="editForm.effectiveMode === 'range'" class="mt-2 flex flex-wrap items-center gap-2">
              <el-date-picker
                v-model="editForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
                :disabled="formMode === 'view'"
              />
            </div>
      </div>
        </el-card>

        <el-card shadow="never" class="detail-style-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">工单处理</span>
          </template>
          <el-radio-group v-model="editForm.workOrderMode" :disabled="formMode === 'view'" class="flex flex-col items-start gap-2">
            <el-radio label="simple">简要工单处理（填写处理建议说明即可闭环）</el-radio>
            <el-radio label="full">完整工单处理（派单、审核、接单、报修、关单等完整流程）</el-radio>
          </el-radio-group>
        </el-card>

        <el-card shadow="never" class="detail-style-card">
          <template #header>
            <span class="text-sm font-semibold text-gray-800">推送内容模板</span>
          </template>
          <el-form-item label="模板" label-width="48px" class="!mb-2">
            <el-input
              v-model="editForm.template"
              type="textarea"
              :rows="3"
              :disabled="formMode === 'view'"
              placeholder="（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理"
            />
          </el-form-item>
          <div class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm">
            <div class="text-gray-500 mb-1">预览</div>
            <div class="text-gray-800 leading-relaxed">{{ templatePreview }}</div>
          </div>
        </el-card>
      </div>

      <div v-else class="space-y-4 max-h-[72vh] overflow-y-auto text-sm text-gray-700">
        <el-card shadow="never" class="detail-style-card">
          <template #header>基本匹配规则</template>
          <p>事件分类：{{ categoryLabel(editForm.category) }}</p>
          <p>事件等级：{{ levelLabel(editForm.level) }}</p>
          <p>适用来源：{{ applicableSourceLabel(editForm.applicableSource) }}</p>
        </el-card>
        <el-card shadow="never" class="detail-style-card">
          <template #header>通知方式</template>
          <p>{{ formatMethods(editForm.notifyChannels) }}</p>
          <p>生效时间：{{ formatEffective() }}</p>
        </el-card>
        <el-card shadow="never" class="detail-style-card">
          <template #header>工单处理</template>
          <p>{{ editForm.workOrderMode === 'full' ? '完整工单处理' : '简要工单处理' }}</p>
        </el-card>
        <el-card shadow="never" class="detail-style-card">
          <template #header>推送模板与预览</template>
          <p class="whitespace-pre-wrap m-0 mb-2">{{ editForm.template }}</p>
          <p class="text-gray-500 m-0">预览：{{ templatePreview }}</p>
        </el-card>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ formMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="formMode !== 'view'" type="primary" :disabled="!canSave" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  APPLICABLE_SOURCE,
  APPLICABLE_SOURCE_FILTER_OPTIONS,
  APPLICABLE_SOURCE_OPTIONS,
  applicableSourceLabel
} from '@/constants/eventSource'

const applicableFilterOptions = APPLICABLE_SOURCE_FILTER_OPTIONS
const applicableSelectOptions = APPLICABLE_SOURCE_OPTIONS

const categoryOptions = [
  { value: 'access', label: '门禁' },
  { value: 'video', label: '监控' },
  { value: 'fire', label: '消防' },
  { value: 'energy_anomaly', label: '能耗异常' },
  { value: 'lift', label: '电梯' },
  { value: 'canteen', label: '食堂' },
  { value: 'env', label: '环境' }
]

const categoryLabel = (v) => categoryOptions.find((c) => c.value === v)?.label || v
const levelLabel = (v) => ({ high: '高', medium: '中', low: '低' }[v] || v)

const filters = ref({ category: '', level: '', applicableSource: '' })
const page = ref(1)
const pageSize = ref(10)

function matchApplicableFilter(rowSource, filterVal) {
  if (!filterVal) return true
  return rowSource === filterVal
}

const mock = ref([
  {
    id: 1,
    category: 'access',
    categoryLabel: '门禁',
    level: 'high',
    levelLabel: '高',
    applicableSource: APPLICABLE_SOURCE.ALL,
    notifyChannels: ['ding'],
    effectiveMode: 'permanent',
    dateRange: [],
    workOrderMode: 'full',
    template:
      '（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理',
    method: '钉钉通知',
    effective: '永久有效',
    enabled: true,
    updater: '管理员'
  },
  {
    id: 2,
    category: 'video',
    categoryLabel: '监控',
    level: 'medium',
    levelLabel: '中',
    applicableSource: APPLICABLE_SOURCE.THIRD_PARTY_ONLY,
    notifyChannels: ['ding'],
    effectiveMode: 'range',
    dateRange: ['2023-10-14', '2023-10-22'],
    workOrderMode: 'simple',
    template:
      '（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理',
    method: '钉钉通知',
    effective: '2023-10-14 至 2023-10-22',
    enabled: true,
    updater: '张三'
  },
  {
    id: 3,
    category: 'fire',
    categoryLabel: '消防',
    level: 'low',
    levelLabel: '低',
    applicableSource: APPLICABLE_SOURCE.RULE_ONLY,
    notifyChannels: ['sms'],
    effectiveMode: 'permanent',
    dateRange: [],
    workOrderMode: 'full',
    template:
      '（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理',
    method: '短信',
    effective: '永久有效',
    enabled: false,
    updater: '李四'
  }
])

const filtered = computed(() => {
  return mock.value.filter((r) => {
    if (filters.value.level && r.level !== filters.value.level) return false
    if (filters.value.category && r.category !== filters.value.category) return false
    if (!matchApplicableFilter(r.applicableSource, filters.value.applicableSource)) return false
    return true
  })
})

const total = computed(() => filtered.value.length)
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function onSearch() {
  page.value = 1
  ElMessage.success('已搜索（演示）')
}
function onReset() {
  filters.value = { category: '', level: '', applicableSource: '' }
  page.value = 1
}

const dialogVisible = ref(false)
const formMode = ref('create')
const editingId = ref(null)
const editForm = ref({
  category: 'energy_anomaly',
  level: 'high',
  applicableSource: APPLICABLE_SOURCE.ALL,
  notifyChannels: ['ding', 'sms'],
  effectiveMode: 'range',
  dateRange: ['2026-04-28', '2026-12-31'],
  workOrderMode: 'simple',
  template: '（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理'
})

const dialogTitle = computed(() => {
  if (formMode.value === 'view') return '查看事件推送配置'
  if (formMode.value === 'edit') return '编辑事件推送配置'
  return '新增事件推送配置'
})

const previewSamples = {
  type: '能耗异常',
  time: '2026-04-28 14:00:00',
  location: '1号楼配电房',
  name: '用电量突增'
}

const templatePreview = computed(() => {
  let s = editForm.value.template || ''
  s = s.replace(/（事件类型）/g, previewSamples.type)
  s = s.replace(/（开始时间）/g, previewSamples.time)
  s = s.replace(/（所属位置）/g, previewSamples.location)
  s = s.replace(/（事件名称）/g, previewSamples.name)
  return s
})

function formatMethods(channels) {
  const m = { ding: '钉钉通知', sms: '短信', email: '邮件', wework: '企业微信' }
  if (!channels?.length) return '—'
  return channels.map((k) => m[k] || k).join('、')
}

function formatEffective() {
  if (editForm.value.effectiveMode === 'permanent') return '永久生效'
  const dr = editForm.value.dateRange
  if (dr && dr.length === 2) return `${dr[0]} 至 ${dr[1]}`
  return '—'
}

const canSave = computed(() => {
  return !!(editForm.value.category && editForm.value.level && editForm.value.applicableSource)
})

function rowToForm(row) {
  return {
    category: row.category,
    level: row.level,
    applicableSource: row.applicableSource,
    notifyChannels: [...(row.notifyChannels || [])],
    effectiveMode: row.effectiveMode || 'permanent',
    dateRange: row.dateRange?.length ? [...row.dateRange] : [],
    workOrderMode: row.workOrderMode || 'simple',
    template: row.template || ''
  }
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  editForm.value = {
    category: 'energy_anomaly',
    level: 'high',
    applicableSource: APPLICABLE_SOURCE.ALL,
    notifyChannels: ['ding', 'sms'],
    effectiveMode: 'range',
    dateRange: ['2026-04-28', '2026-12-31'],
    workOrderMode: 'simple',
    template: '（事件类型）于（开始时间）在（所属位置）发生（事件名称），请核实并及时处理'
  }
  dialogVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingId.value = row.id
  editForm.value = rowToForm(row)
  dialogVisible.value = true
}

function openView(row) {
  formMode.value = 'view'
  editingId.value = row.id
  editForm.value = rowToForm(row)
  dialogVisible.value = true
}

function onDialogClosed() {
  editingId.value = null
}

function syncRowDerivedFields(target) {
  target.categoryLabel = categoryLabel(target.category)
  target.levelLabel = levelLabel(target.level)
  target.method = formatMethods(target.notifyChannels)
  if (target.effectiveMode === 'permanent') {
    target.effective = '永久有效'
  } else if (target.dateRange?.length === 2) {
    target.effective = `${target.dateRange[0]} 至 ${target.dateRange[1]}`
  } else {
    target.effective = '—'
  }
}

function saveForm() {
  if (!canSave.value) return
  const base = {
    ...editForm.value,
    notifyChannels: [...editForm.value.notifyChannels],
    dateRange: editForm.value.dateRange ? [...editForm.value.dateRange] : []
  }
  if (formMode.value === 'create') {
    const id = Math.max(0, ...mock.value.map((r) => r.id)) + 1
    const row = {
      id,
      ...base,
      enabled: true,
      updater: '管理员'
    }
    syncRowDerivedFields(row)
    mock.value.push(row)
    ElMessage.success('已新增（演示）')
  } else if (editingId.value != null) {
    const row = mock.value.find((r) => r.id === editingId.value)
    if (row) {
      Object.assign(row, base)
      syncRowDerivedFields(row)
      ElMessage.success('已保存（演示）')
    }
  }
  dialogVisible.value = false
}

function onDelete(row) {
  ElMessageBox.confirm(`确定删除「${row.categoryLabel} / ${row.levelLabel}」配置吗？`, '删除', {
    type: 'warning'
  })
    .then(() => {
      mock.value = mock.value.filter((r) => r.id !== row.id)
      ElMessage.success('已删除（演示）')
    })
    .catch(() => {})
}
</script>

<style scoped>
.detail-style-card :deep(.el-card__header) {
  padding: 10px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--yw-border, #e5e7eb);
}
.detail-style-card :deep(.el-card__body) {
  padding: 14px 16px;
}
.push-inner-form :deep(.el-form-item) {
  margin-bottom: 12px;
}
.push-inner-form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
