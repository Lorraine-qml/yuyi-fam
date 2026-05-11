<template>
  <div v-if="!isSystemSuperAdmin" class="rounded-xl border bg-white p-8 text-center" style="border-color: var(--yw-border)">
    <p class="text-gray-600 mb-2">仅超级管理员可维护事件分类。</p>
    <el-button type="primary" text @click="$router.push('/dashboard')">返回首页</el-button>
  </div>
  <div v-else class="event-cat-page space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-xl font-bold text-gray-800 m-0">事件分类管理</h1>
      <el-button type="primary" @click="openCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增分类
      </el-button>
    </div>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-3" @submit.prevent>
        <el-form-item label="所属板块" class="!mb-0">
          <el-select v-model="filt.sector" placeholder="全部" clearable class="!w-44">
            <el-option label="全部" value="" />
            <el-option v-for="s in EVENT_SECTOR_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-select v-model="filt.status" placeholder="全部" class="!w-32">
            <el-option label="全部" value="" />
            <el-option label="启用" value="on" />
            <el-option label="停用" value="off" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类名称" class="!mb-0">
          <el-input v-model="filt.keyword" placeholder="关键字" clearable class="!w-52" @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div
      class="rounded-xl border bg-white p-0 shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <el-table :data="displayRows" border stripe>
        <el-table-column type="index" label="序号" width="64" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="所属板块" width="120">
          <template #default="{ row }">
            {{ sectorDisplay(row.sector) }}
          </template>
        </el-table-column>
        <el-table-column label="关联规则数" width="112" align="center">
          <template #default="{ row }">
            <button
              type="button"
              class="stat-link tabular-nums"
              @click="goRiskRulesForCategory(row)"
            >
              {{ row.associatedRuleCount }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="关联事件数" width="112" align="center">
          <template #default="{ row }">
            <button
              type="button"
              class="stat-link tabular-nums"
              @click="goRealtimeEvents(row)"
            >
              {{ row.associatedEventCount }}
            </button>
          </template>
        </el-table-column>
        <el-table-column label="可用等级" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ allowedLevelsShort(row.allowedLevels) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="96">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
            <el-button v-if="row.enabled" type="warning" link size="small" @click="toggleEnabled(row, false)">停用</el-button>
            <el-button v-else type="success" link size="small" @click="toggleEnabled(row, true)">启用</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editId ? '编辑事件分类' : '新增事件分类'"
      width="620px"
      destroy-on-close
      append-to-body
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="112px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="唯一，如「用电异常」" />
        </el-form-item>
        <el-form-item label="所属板块" prop="sector">
          <el-select v-model="form.sector" class="w-full" placeholder="请选择">
            <el-option v-for="s in EVENT_SECTOR_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="可选" />
        </el-form-item>
        <el-divider content-position="left" class="!my-3">等级设置</el-divider>
        <el-form-item label="可用等级" prop="allowedLevels">
          <el-checkbox-group v-model="form.allowedLevels" class="flex flex-wrap gap-x-4 gap-y-1">
            <el-checkbox v-for="k in EVENT_LEVEL_KEY_ORDER" :key="k" :label="k">
              {{ EVENT_LEVEL_META[k].label }}
            </el-checkbox>
          </el-checkbox-group>
          <p class="text-xs text-gray-500 mt-1 mb-0">规则配置时，仅能选择上述勾选的预警等级。</p>
          <el-alert type="info" :closable="false" show-icon class="mt-2">
            <p class="text-sm m-0 leading-relaxed">
              第三方系统推送的事件将统一使用默认等级「中」（可在数据源配置中覆盖）。
            </p>
            <p class="text-xs text-gray-600 m-0 mt-1 leading-relaxed">
              若已与平台对齐等级，请在接口中直接使用低 / 中 / 高 / 紧急或对应英文。
            </p>
          </el-alert>
        </el-form-item>
        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EVENT_LEVEL_KEY_ORDER,
  EVENT_LEVEL_META,
  DEFAULT_ALLOWED_LEVEL_KEYS,
  normalizeAllowedLevelKeys
} from '@/constants/eventLevelStandards'
import {
  EVENT_SECTOR_OPTIONS,
  isEventCategoryDuplicateName,
  listEventCategories,
  upsertEventCategory,
  setEventCategoryEnabled,
  deleteEventCategory
} from '@/data/eventCategories'
import {
  countAssociatedProductionRules,
  countEventsLastNDays,
  countAllEventsForCategory
} from '@/data/eventCategoryStats'
import {
  countRiskRulesUsingCategory,
  countSystemTemplatesUsingCategory,
  countProjectTemplatesUsingCategory,
  countPushConfigsUsingCategory
} from '@/data/riskCategoryRefs'
import { useSystemAdmin } from '@/composables/useSystemAdmin'

const router = useRouter()
const { isSystemSuperAdmin } = useSystemAdmin()

const filt = reactive({ sector: '', status: '', keyword: '' })
const applied = reactive({ sector: '', status: '', keyword: '' })

const dialogVisible = ref(false)
const editId = ref(null)
const formRef = ref(null)
const form = reactive({
  name: '',
  sector: 'ENERGY',
  description: '',
  enabled: true,
  allowedLevels: [...DEFAULT_ALLOWED_LEVEL_KEYS]
})

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sector: [{ required: true, message: '请选择所属板块', trigger: 'change' }],
  allowedLevels: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: '请至少勾选一个可用等级',
      trigger: 'change'
    }
  ]
}

function allowedLevelsShort(keys) {
  const arr = normalizeAllowedLevelKeys(keys)
  return arr.map((k) => EVENT_LEVEL_META[k]?.label || k).join('、') || '—'
}

function sectorDisplay(sector) {
  return EVENT_SECTOR_OPTIONS.find((s) => s.value === sector)?.label || sector
}

const filteredRows = computed(() => {
  let rows = listEventCategories({
    sector: applied.sector || undefined,
    keyword: applied.keyword || undefined
  })
  if (applied.status === 'on') rows = rows.filter((r) => r.enabled)
  if (applied.status === 'off') rows = rows.filter((r) => !r.enabled)
  return rows
})

const displayRows = computed(() =>
  filteredRows.value.map((row) => ({
    ...row,
    associatedRuleCount: countAssociatedProductionRules(row.id),
    associatedEventCount: countEventsLastNDays(row.id, 30)
  }))
)

/** 跳转规则列表并按事件分类筛选（支持 /risk-rules 别名路由） */
function goRiskRulesForCategory(row) {
  router.push({
    path: '/risk/rules',
    query: { eventCategoryId: row.id }
  })
}

function goRealtimeEvents(row) {
  router.push({
    path: '/security/events/realtime',
    query: { category: row.id, timeRange: '30d' }
  })
}

function onSearch() {
  applied.sector = filt.sector
  applied.status = filt.status
  applied.keyword = filt.keyword
}

function onReset() {
  filt.sector = ''
  filt.status = ''
  filt.keyword = ''
  onSearch()
}

function openCreate() {
  editId.value = null
  Object.assign(form, {
    name: '',
    sector: 'ENERGY',
    description: '',
    enabled: true,
    allowedLevels: [...DEFAULT_ALLOWED_LEVEL_KEYS]
  })
  dialogVisible.value = true
}

function openEdit(row) {
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    sector: row.sector,
    description: row.description || '',
    enabled: row.enabled !== false,
    allowedLevels: [...normalizeAllowedLevelKeys(row.allowedLevels)]
  })
  dialogVisible.value = true
}

function onDialogClosed() {
  editId.value = null
}

async function saveForm() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const name = String(form.name || '').trim()
  if (isEventCategoryDuplicateName(name, editId.value)) {
    ElMessage.warning('分类名称已存在')
    return
  }
  const allowedLevels = normalizeAllowedLevelKeys(form.allowedLevels)
  upsertEventCategory({
    id: editId.value,
    name,
    sector: form.sector,
    description: form.description,
    enabled: form.enabled,
    allowedLevels
  })
  ElMessage.success('已保存')
  dialogVisible.value = false
}

function toggleEnabled(row, enabled) {
  setEventCategoryEnabled(row.id, enabled)
  ElMessage.success(enabled ? '已启用' : '已停用')
}

function onDelete(row) {
  const id = row.id
  const prodRules = countAssociatedProductionRules(id)
  const anyRules = countRiskRulesUsingCategory(id)
  const configRefs =
    countSystemTemplatesUsingCategory(id) +
    countProjectTemplatesUsingCategory(id) +
    countPushConfigsUsingCategory(id)

  if (prodRules > 0) {
    ElMessageBox.alert(
      `无法删除分类「${row.name}」，该分类已被 ${prodRules} 条规则引用。\n请先修改规则中的事件分类或删除规则后再试。`,
      '无法删除',
      { type: 'error', confirmButtonText: '我知道了' }
    )
    return
  }
  if (anyRules > 0) {
    ElMessageBox.alert(
      `无法删除分类「${row.name}」，该分类仍被 ${anyRules} 条风险规则引用（试运行或停用中的规则仍有关联）。\n请先修改规则中的事件分类或删除规则后再试。`,
      '无法删除',
      { type: 'error', confirmButtonText: '我知道了' }
    )
    return
  }
  if (configRefs > 0) {
    ElMessage.warning(
      `已被系统/项目模板或推送配置引用（共 ${configRefs} 处），请先修改或删除关联配置`
    )
    return
  }

  const histEvents = countAllEventsForCategory(id)
  const doDelete = () => {
    deleteEventCategory(row.id)
    ElMessage.success('已删除')
  }

  if (histEvents > 0) {
    ElMessageBox.confirm(
      `该分类已被 ${histEvents} 条历史事件使用，删除后历史事件仍保留，但新事件无法选择该分类。\n确认删除吗？`,
      '确认删除',
      { type: 'warning' }
    )
      .then(doDelete)
      .catch(() => {})
    return
  }

  ElMessageBox.confirm(`确定删除分类「${row.name}」吗？`, '删除', { type: 'warning' })
    .then(doDelete)
    .catch(() => {})
}

onSearch()
</script>

<style scoped>
.stat-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: var(--el-color-primary);
  font: inherit;
  text-decoration: none;
}

.stat-link:hover {
  text-decoration: underline;
}
</style>
