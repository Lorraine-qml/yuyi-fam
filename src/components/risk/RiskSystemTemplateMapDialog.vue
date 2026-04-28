<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="640px"
    align-center
    destroy-on-close
    class="risk-system-template-map-dialog"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <div v-if="template" class="space-y-4">
      <div class="text-sm space-y-1">
        <p><span class="text-gray-500">模板名称：</span>{{ template.name }}</p>
        <p>
          <span class="text-gray-500">模板类型：</span>
          <el-tag type="info" size="small" effect="plain">系统模板</el-tag>
        </p>
      </div>

      <div
        class="rounded-lg border p-4 space-y-3"
        style="border-color: var(--yw-border); background: var(--yw-bg-page)"
      >
        <p class="text-sm font-medium text-gray-800">请将模板中的标准指标映射到当前项目的实际指标</p>

        <div
          class="rounded-lg border px-3 py-2.5 space-y-1.5 bg-gray-50 dark:bg-neutral-950/30"
          style="border-color: var(--yw-border)"
        >
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-gray-500 shrink-0">标准指标类型</span>
            <span class="font-medium text-gray-800">{{ standardDef?.name || '—' }}</span>
            <el-tag type="info" size="small" effect="plain">平台预置</el-tag>
          </div>
          <p v-if="standardDef" class="text-xs text-gray-500 mb-0 leading-relaxed">
            平台枚举编码：
            <code class="text-indigo-700">{{ standardDef.key }}</code>
            （与项目指标编码无关；请在下方选择本项目中的对应指标）
          </p>
          <p v-else-if="template?.standardMetricTypeKey" class="text-xs text-amber-700 mb-0">
            未识别的标准类型：<code>{{ template.standardMetricTypeKey }}</code>
          </p>
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="text-sm">
            <span class="text-gray-600 mr-2">本项目指标</span>
            <el-select
              v-model="selectedMetricCode"
              filterable
              class="w-full max-w-md mt-1"
              placeholder="选择当前项目已有指标（可含项目编码后缀）"
              :empty-text="emptyHint"
            >
              <el-option
                v-for="m in dropdownOptions"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
          </div>
          <p class="text-xs text-gray-400 mb-0">仅列出当前项目中已有、且与映射逻辑相匹配的候选指标。</p>
        </div>

        <div v-if="selectedMetric" class="text-xs text-gray-600 pl-1">
          <span class="text-gray-500">表达式：</span>
          <code class="text-indigo-700">{{ template.expression }}</code>
        </div>

        <div v-if="standardDef" class="flex flex-wrap gap-3 text-xs">
          <span :class="unitMatch ? 'text-emerald-600' : 'text-amber-600'">
            单位匹配：{{ unitMatch ? '✅' : '⚠️' }}
            {{ selectedMetric ? `${selectedMetric.unit || '—'}（${unitMatch ? '与标准一致' : '与标准不一致'}）` : '—' }}
          </span>
          <span :class="dsMatch ? 'text-emerald-600' : 'text-amber-600'">
            数据源类型：{{ dsMatch ? '✅' : '⚠️' }}
            {{ selectedMetric ? `${dataSourceLabel(selectedMetric.dataSourceType)}（${dsMatch ? '一致' : '不一致'}）` : '—' }}
          </span>
        </div>

        <el-alert
          v-if="!dropdownOptions.length"
          type="warning"
          :closable="false"
          show-icon
          title="当前项目暂无可用指标，请先到「风险指标」创建与标准类型匹配的指标后再试。"
        />
        <p v-if="!dropdownOptions.length" class="text-xs text-gray-500 mb-0">
          <el-button type="primary" link size="small" @click="goQuickCreateMetric">去风险指标</el-button>
        </p>
        <p v-else class="text-xs text-gray-500 flex flex-wrap items-center gap-2 mb-0">
          <span>若列表中无合适项，请到「风险指标」创建后再返回此处。</span>
          <el-button type="primary" link size="small" @click="goQuickCreateMetric">去风险指标</el-button>
        </p>
      </div>

      <div v-if="mode === 'use'">
        <div class="text-sm font-medium text-gray-800 mb-2">规则配置（可修改）</div>
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="pr-1">
          <el-form-item label="规则名称" prop="name">
            <el-input v-model="form.name" maxlength="80" show-word-limit placeholder="规则名称" />
          </el-form-item>
          <el-form-item label="预警等级" prop="level">
            <el-select v-model="form.level" class="w-full">
              <el-option
                v-for="l in RULE_LEVEL_OPTIONS"
                :key="l.value"
                :label="l.label"
                :value="l.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="事件分类" prop="eventCategory">
            <el-select v-model="form.eventCategory" class="w-full" filterable>
              <el-option v-for="e in EVENT_CATEGORY_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="运行模式">
            <el-radio-group v-model="form.runMode">
              <el-radio value="production">正式运行</el-radio>
              <el-radio value="trial">试运行</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>

      <div v-else>
        <div class="text-sm font-medium text-gray-800 mb-2">另存为本项目模板</div>
        <el-form ref="saveFormRef" :model="saveForm" :rules="saveRules" label-width="108px">
          <el-form-item label="模板名称" prop="name">
            <el-input v-model="saveForm.name" maxlength="64" show-word-limit placeholder="项目内模板名称" />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="confirm">
        {{ mode === 'use' ? '确认使用' : '保存为项目模板' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  createEmptyRuleForm,
  EVENT_CATEGORY_OPTIONS,
  formToRulePayload,
  RULE_LEVEL_OPTIONS
} from '@/data/riskRulesMock'
import { getStandardMetricTypeByKey, normalizeStandardMetricKey } from '@/data/riskStandardMetrics'
import { DATA_SOURCE_TYPE_OPTIONS } from '@/data/riskMetricsMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** 'use' | 'saveAs' */
  mode: { type: String, default: 'use' },
  /** 系统模板项 */
  template: { type: Object, default: null },
  /** getRuleMetricOptions() 结果 */
  metricOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'use', 'saveAs'])

const router = useRouter()
const formRef = ref(null)
const saveFormRef = ref(null)
const selectedMetricCode = ref('')

const form = reactive(createEmptyRuleForm())
const saveForm = reactive({ name: '' })

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择', trigger: 'change' }],
  eventCategory: [{ required: true, message: '请选择', trigger: 'change' }]
}

const saveRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }]
}

const dialogTitle = computed(() =>
  props.mode === 'use' ? `使用系统模板 — ${props.template?.name || ''}` : `另存为项目模板 — ${props.template?.name || ''}`
)

const standardDef = computed(() => {
  const k = props.template?.standardMetricTypeKey
  return k ? getStandardMetricTypeByKey(k) : null
})

const candidateMetrics = computed(() => {
  const t = props.template
  if (!t || !props.metricOptions.length) return []
  const keyNorm = normalizeStandardMetricKey(t.standardMetricTypeKey || '')
  const name = t.standardMetricTypeName
  const sameKey = props.metricOptions.filter((m) => {
    const mk = normalizeStandardMetricKey(m.standardMetricTypeKey || '')
    return mk && mk === keyNorm
  })
  if (sameKey.length) return sameKey
  const sameName = props.metricOptions.filter((m) => m.name === name)
  if (sameName.length) return sameName
  return [...props.metricOptions]
})

const dropdownOptions = computed(() => candidateMetrics.value)

const emptyHint = '暂无可选指标'

const selectedMetric = computed(() =>
  props.metricOptions.find((m) => m.value === selectedMetricCode.value) || null
)

const unitMatch = computed(() => {
  if (!standardDef.value || !selectedMetric.value) return true
  const u = (selectedMetric.value.unit || '').trim()
  return u === (standardDef.value.defaultUnit || '').trim()
})

const dsMatch = computed(() => {
  if (!standardDef.value || !selectedMetric.value) return true
  return (selectedMetric.value.dataSourceType || '') === (standardDef.value.defaultDataSourceType || '')
})

const canSubmit = computed(() => !!selectedMetricCode.value && !!selectedMetric.value)

function dataSourceLabel(v) {
  return DATA_SOURCE_TYPE_OPTIONS.find((x) => x.value === v)?.label || v || '—'
}

function goQuickCreateMetric() {
  const raw = props.template?.standardMetricTypeKey
  const k = raw ? normalizeStandardMetricKey(raw) || raw : ''
  emit('update:visible', false)
  router.push({
    path: '/risk/metrics',
    query: k ? { standardMetricKey: k } : {}
  })
}

function mergeTemplateToForm() {
  const t = props.template
  if (!t) return
  Object.assign(form, createEmptyRuleForm(), {
    name: `${t.name}_副本`,
    metricCode: '',
    description: t.description || '',
    valueType: t.valueType || 'number',
    primaryOp: t.primaryOp,
    primaryValue: t.primaryValue,
    primaryUnit: t.primaryUnit || '',
    level: t.level,
    eventCategory: t.eventCategory,
    runMode: 'trial'
  })
  form.extraConditions = []
  form.conditionLogic = 'AND'
  form.timeWindow = 'none'
  form.silenceMinutes = 30
  saveForm.name = `${t.name}_副本`
}

function applySelectedMetricToForm() {
  const m = selectedMetric.value
  if (!m) return
  form.metricCode = m.value
  form.metricName = m.name
}

watch(
  () => [props.visible, props.template, props.mode, props.metricOptions],
  () => {
    if (!props.visible || !props.template) return
    mergeTemplateToForm()
    const first = candidateMetrics.value[0]?.value || ''
    selectedMetricCode.value = first
    applySelectedMetricToForm()
  }
)

watch(selectedMetricCode, () => {
  applySelectedMetricToForm()
})

async function confirm() {
  if (!props.template || !selectedMetric.value) return
  applySelectedMetricToForm()
  if (props.mode === 'use') {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    const payload = formToRulePayload(form, props.metricOptions)
    emit('use', {
      payload,
      eventPreview: props.template.eventPreview || ''
    })
  } else {
    try {
      await saveFormRef.value?.validate()
    } catch {
      return
    }
    const t = props.template
    const m = selectedMetric.value
    emit('saveAs', {
      name: saveForm.name.trim(),
      category: t.category,
      metricCode: m.value,
      metricName: m.name,
      expression: t.expression,
      level: t.level,
      eventCategory: t.eventCategory,
      description: t.description || '',
      primaryOp: t.primaryOp,
      primaryValue: t.primaryValue,
      primaryUnit: t.primaryUnit || '',
      valueType: t.valueType || 'number',
      eventPreview: t.eventPreview || '',
      standardMetricTypeKey: t.standardMetricTypeKey
    })
  }
  /** 成功：由父级在保存规则/项目模板后关窗，校验失败时保持打开 */
  if (props.mode === 'saveAs') {
    emit('update:visible', false)
  }
}
</script>
