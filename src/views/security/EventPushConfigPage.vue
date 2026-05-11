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
            <el-option v-for="c in categoryFilterOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件等级" class="!mb-0">
          <el-select v-model="filters.level" placeholder="全部" clearable class="!w-32">
            <el-option label="全部" value="" />
            <el-option
              v-for="opt in LEVEL_FILTER_OPTS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
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
            <el-tag
              :type="
                row.level === 'high' || row.level === 'urgent'
                  ? 'danger'
                  : row.level === 'medium'
                    ? 'warning'
                    : 'info'
              "
              size="small"
            >
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
            <el-switch
              :model-value="row.enabled"
              size="small"
              @change="(v) => onRowEnabled(row, v)"
            />
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
      width="720px"
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
              <EventCategoryField v-model="editForm.category" />
            </el-form-item>
            <el-form-item label="事件等级" required>
              <el-select v-model="editForm.level" placeholder="请选择" class="!w-full" :disabled="formMode === 'view'">
                <el-option
                  v-for="opt in LEVEL_FILTER_OPTS"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
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
          <div
            class="rounded-lg border px-3 py-2.5 mb-3"
            style="border-color: var(--yw-border); background: var(--yw-bg-page, #f9fafb)"
          >
            <p class="text-xs text-gray-600 m-0 mb-2">可用变量（点击插入到光标位置）：</p>
            <div class="flex flex-wrap gap-1.5">
              <el-button
                v-for="v in PUSH_TEMPLATE_VAR_OPTIONS"
                :key="v.key"
                size="small"
                @click="insertPushTemplateVar(v.placeholder)"
              >
                {{ v.label }}
              </el-button>
            </div>
          </div>

          <div class="text-sm text-gray-700 mb-1">模板内容</div>
          <el-input
            ref="templateInputRef"
            v-model="editForm.contentTemplate"
            type="textarea"
            :autosize="{ minRows: 5, maxRows: 12 }"
            :class="['push-template-input', { 'is-invalid-vars': invalidTemplateVars.length }]"
            placeholder="使用 {变量名} 插入动态内容，可自由编排标点与说明文字"
            @mouseup="cacheTemplateCaret"
            @keyup="cacheTemplateCaret"
            @select="cacheTemplateCaret"
            @focus="cacheTemplateCaret"
            @click="cacheTemplateCaret"
          />

          <el-alert
            v-if="invalidTemplateVars.length"
            type="error"
            :closable="false"
            show-icon
            class="mt-2"
            title="包含无效变量"
          >
            <p class="text-sm m-0 mb-2">仅允许使用已列出的变量占位符。请删除或修正以下占位符：</p>
            <div
              class="rounded border border-red-200 bg-red-50/80 px-2 py-2 font-mono text-sm leading-relaxed break-all whitespace-pre-wrap"
            >
              <template v-for="(seg, ix) in templateHighlightSegments" :key="ix">
                <mark v-if="seg.bad" class="push-tpl-bad-token">{{ seg.text }}</mark>
                <span v-else>{{ seg.text }}</span>
              </template>
            </div>
          </el-alert>

          <div class="mt-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm">
            <div class="text-gray-500 mb-1">预览（示例数据）</div>
            <div class="text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{{ templatePreview }}</div>
          </div>
          <p class="text-xs text-gray-500 mt-2 mb-0">
            可自由编辑文本和变量顺序；未在示例中出现的变量预览为空；入库字段对应服务端
            content_template。
          </p>
        </el-card>
      </div>

      <div v-else class="space-y-4 max-h-[72vh] overflow-y-auto text-sm text-gray-700">
        <el-card shadow="never" class="detail-style-card">
          <template #header>基本匹配规则</template>
          <p>事件分类：{{ getEventCategoryLabel(editForm.category) }}</p>
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
          <p class="text-xs text-gray-500 m-0 mb-1">content_template（模板原文）</p>
          <pre class="whitespace-pre-wrap m-0 mb-3 text-xs font-mono text-gray-800 bg-gray-50 border border-gray-100 rounded p-2">{{ editForm.contentTemplate }}</pre>
          <p class="text-xs text-gray-500 m-0 mb-1">渲染预览（示例）</p>
          <p class="text-gray-800 m-0 leading-relaxed whitespace-pre-wrap">{{ templatePreview }}</p>
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
import { computed, nextTick, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  APPLICABLE_SOURCE,
  APPLICABLE_SOURCE_FILTER_OPTIONS,
  APPLICABLE_SOURCE_OPTIONS,
  applicableSourceLabel
} from '@/constants/eventSource'
import EventCategoryField from '@/components/risk/EventCategoryField.vue'
import {
  eventPushConfigStore,
  upsertPushConfigRow,
  deletePushConfigRow,
  patchPushConfigRow
} from '@/data/eventPushConfigMock'
import { listEventCategories, getEventCategoryLabel, hydrateEventCategoriesOnce } from '@/data/eventCategories'
import { EVENT_LEVEL_META, EVENT_LEVEL_KEY_ORDER } from '@/constants/eventLevelStandards'
import {
  DEFAULT_PUSH_CONTENT_TEMPLATE,
  PUSH_TEMPLATE_VAR_OPTIONS,
  findInvalidTemplateVarKeys,
  renderPushContentTemplate,
  segmentTemplateForHighlight,
  validatePushContentTemplate
} from '@/utils/pushContentTemplate'

const templateInputRef = ref(null)
let templateCaret = { start: 0, end: 0 }

const STATIC_PREVIEW_SAMPLES = Object.freeze({
  event_type: '用电异常',
  start_time: '2026-04-28 14:00:00',
  location: '1号楼配电房',
  event_name: '用电量突增',
  event_content: '当前值1320kWh，阈值1000kWh',
  threshold: '1000kWh',
  actual_value: '1320kWh'
})

hydrateEventCategoriesOnce()

const applicableFilterOptions = APPLICABLE_SOURCE_FILTER_OPTIONS
const applicableSelectOptions = APPLICABLE_SOURCE_OPTIONS

const categoryFilterOptions = computed(() =>
  listEventCategories({}).map((r) => ({ value: r.id, label: r.name }))
)

function defaultCategoryId() {
  const rows = listEventCategories({ enabledOnly: true })
  return rows[0]?.id || 'ec-energy-anomaly'
}

const LEVEL_FILTER_OPTS = EVENT_LEVEL_KEY_ORDER.map((k) => ({
  label: EVENT_LEVEL_META[k].label,
  value: EVENT_LEVEL_META[k].pushLevel
}))

function levelLabel(v) {
  for (const k of EVENT_LEVEL_KEY_ORDER) {
    if (EVENT_LEVEL_META[k].pushLevel === v) return EVENT_LEVEL_META[k].label
  }
  return v
}

const filters = ref({ category: '', level: '', applicableSource: '' })
const page = ref(1)
const pageSize = ref(10)

function matchApplicableFilter(rowSource, filterVal) {
  if (!filterVal) return true
  return rowSource === filterVal
}

const filtered = computed(() =>
  eventPushConfigStore.list.filter((r) => {
    if (filters.value.level && r.level !== filters.value.level) return false
    if (filters.value.category && r.category !== filters.value.category) return false
    if (!matchApplicableFilter(r.applicableSource, filters.value.applicableSource)) return false
    return true
  })
)

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
  category: defaultCategoryId(),
  level: 'high',
  applicableSource: APPLICABLE_SOURCE.ALL,
  notifyChannels: ['ding', 'sms'],
  effectiveMode: 'range',
  dateRange: ['2026-04-28', '2026-12-31'],
  workOrderMode: 'simple',
  contentTemplate: DEFAULT_PUSH_CONTENT_TEMPLATE
})

const dialogTitle = computed(() => {
  if (formMode.value === 'view') return '查看事件推送配置'
  if (formMode.value === 'edit') return '编辑事件推送配置'
  return '新增事件推送配置'
})

const previewValueMap = computed(() => ({
  ...STATIC_PREVIEW_SAMPLES,
  level: levelLabel(editForm.value.level)
}))

const invalidTemplateVars = computed(() =>
  findInvalidTemplateVarKeys(editForm.value.contentTemplate || '')
)

const templateHighlightSegments = computed(() =>
  segmentTemplateForHighlight(editForm.value.contentTemplate || '', invalidTemplateVars.value)
)

const templatePreview = computed(() =>
  renderPushContentTemplate(editForm.value.contentTemplate || '', previewValueMap.value)
)

function cacheTemplateCaret() {
  const ta = templateInputRef.value?.textarea
  if (ta && typeof ta.selectionStart === 'number') {
    templateCaret = { start: ta.selectionStart, end: ta.selectionEnd }
  }
}

function insertPushTemplateVar(placeholder) {
  const ta = templateInputRef.value?.textarea
  const cur = editForm.value.contentTemplate ?? ''
  let start = ta ? ta.selectionStart : templateCaret.start
  let end = ta ? ta.selectionEnd : templateCaret.end
  if (typeof start !== 'number' || typeof end !== 'number') {
    start = end = cur.length
  }
  const next = cur.slice(0, start) + placeholder + cur.slice(end)
  editForm.value.contentTemplate = next
  nextTick(() => {
    const ta2 = templateInputRef.value?.textarea
    if (ta2) {
      const pos = start + placeholder.length
      ta2.focus()
      ta2.setSelectionRange(pos, pos)
      templateCaret = { start: pos, end: pos }
    }
  })
}

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
    contentTemplate: row.contentTemplate || DEFAULT_PUSH_CONTENT_TEMPLATE
  }
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  editForm.value = {
    category: defaultCategoryId(),
    level: 'high',
    applicableSource: APPLICABLE_SOURCE.ALL,
    notifyChannels: ['ding', 'sms'],
    effectiveMode: 'range',
    dateRange: ['2026-04-28', '2026-12-31'],
    workOrderMode: 'simple',
    contentTemplate: DEFAULT_PUSH_CONTENT_TEMPLATE
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

function saveForm() {
  if (!canSave.value) return
  const { ok } = validatePushContentTemplate(editForm.value.contentTemplate || '')
  if (!ok) {
    ElMessage.error('包含无效变量')
    return
  }
  const base = {
    category: editForm.value.category,
    level: editForm.value.level,
    applicableSource: editForm.value.applicableSource,
    notifyChannels: [...editForm.value.notifyChannels],
    effectiveMode: editForm.value.effectiveMode,
    dateRange: editForm.value.dateRange ? [...editForm.value.dateRange] : [],
    workOrderMode: editForm.value.workOrderMode,
    contentTemplate: editForm.value.contentTemplate || DEFAULT_PUSH_CONTENT_TEMPLATE
  }
  if (formMode.value === 'create') {
    upsertPushConfigRow({
      ...base,
      enabled: true,
      updater: '管理员'
    })
    ElMessage.success('已新增（演示）')
  } else if (editingId.value != null) {
    const row = eventPushConfigStore.list.find((r) => r.id === editingId.value)
    if (row) {
      upsertPushConfigRow({
        ...base,
        id: row.id,
        enabled: row.enabled,
        updater: row.updater || '管理员'
      })
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
      deletePushConfigRow(row.id)
      ElMessage.success('已删除（演示）')
    })
    .catch(() => {})
}

function onRowEnabled(row, val) {
  patchPushConfigRow(row.id, { enabled: Boolean(val) })
  ElMessage.success('已更新（演示）')
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
.push-template-input :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}
.push-template-input.is-invalid-vars :deep(textarea) {
  border-color: var(--el-color-error);
}
.push-tpl-bad-token {
  background: rgb(254 226 226);
  color: rgb(153 27 27);
  border-radius: 2px;
  padding: 0 2px;
}
</style>
