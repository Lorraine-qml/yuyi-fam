<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="560px"
    align-center
    destroy-on-close
    append-to-body
    class="risk-system-tpl-form-dialog"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="pr-1">
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="唯一名称" />
      </el-form-item>
      <el-form-item label="业务板块" prop="category">
        <el-select v-model="form.category" class="w-full" placeholder="选择板块">
          <el-option v-for="c in CATEGORY_OPTIONS" :key="c" :label="sectorLabel(c)" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="标准指标类型" prop="standardMetricTypeKey">
        <el-select
          v-model="form.standardMetricTypeKey"
          filterable
          class="w-full"
          placeholder="从平台预定义字典选择"
          @change="onStdMetricChange"
        >
          <el-option
            v-for="m in stdSelectOptions"
            :key="m.key"
            :label="m.name"
            :value="m.key"
          >
            <el-tooltip placement="right" :show-after="280">
              <template #content>
                <div class="text-xs leading-relaxed space-y-1 max-w-[280px]">
                  <div>编码：<code>{{ m.key }}</code></div>
                  <div>典型单位：{{ m.defaultUnit || '—' }}</div>
                  <div>预期数据源：{{ standardMetricDataSourceLabel(m.defaultDataSourceType) }}</div>
                </div>
              </template>
              <span class="block truncate">{{ m.name }}</span>
            </el-tooltip>
          </el-option>
        </el-select>
        <p class="text-xs text-gray-500 mt-1.5 leading-relaxed mb-0">
          标准指标类型是平台预定义的通用类型，所有项目共有。使用时需映射到本项目实际指标。
        </p>
      </el-form-item>
      <el-form-item label="值类型">
        <el-radio-group v-model="form.valueType" size="small">
          <el-radio-button value="number">数值</el-radio-button>
          <el-radio-button value="string">文本</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="触发条件" required>
        <div class="flex flex-wrap items-center gap-2">
          <el-select v-model="form.primaryOp" class="w-28">
            <el-option v-for="o in OP_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-input
            v-if="form.valueType === 'string'"
            v-model="form.primaryValue"
            class="w-40"
            placeholder="阈值"
          />
          <el-input-number v-else v-model="form.primaryValue" class="!w-40" :controls="true" />
          <el-input v-model="form.primaryUnit" class="w-24" placeholder="单位" />
        </div>
      </el-form-item>
      <el-form-item label="表达式">
        <el-input :model-value="exprPreview" type="textarea" :rows="2" readonly />
      </el-form-item>
      <el-form-item label="预警等级" prop="level">
        <el-select v-model="form.level" class="w-full" placeholder="等级">
          <el-option
            v-for="l in RULE_LEVEL_OPTIONS"
            :key="l.value"
            :label="`${l.labelShort}（${l.label}）`"
            :value="l.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="事件分类" prop="eventCategory">
        <el-select v-model="form.eventCategory" class="w-full" filterable>
          <el-option v-for="e in EVENT_CATEGORY_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选，说明模板用途" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  STANDARD_METRIC_TYPES,
  normalizeStandardMetricKey,
  standardMetricDataSourceLabel
} from '@/data/riskStandardMetrics'
import {
  buildSystemTemplateExpression,
  systemTemplateNameExists,
  systemTemplateCategoryDisplay,
  upsertSystemTemplate
} from '@/data/riskSystemTemplates'
import { EVENT_CATEGORY_OPTIONS, OP_OPTIONS, RULE_LEVEL_OPTIONS } from '@/data/riskRulesMock'

const CATEGORY_OPTIONS = ['能耗', '安全', '食堂', '物业', '资产']

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

function sectorLabel(c) {
  return systemTemplateCategoryDisplay(c)
}

const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  id: '',
  name: '',
  category: '能耗',
  standardMetricTypeKey: '',
  valueType: 'number',
  primaryOp: '>',
  primaryValue: 0,
  primaryUnit: '',
  level: 3,
  eventCategory: '能耗异常',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择业务板块', trigger: 'change' }],
  standardMetricTypeKey: [{ required: true, message: '请选择标准指标类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择预警等级', trigger: 'change' }],
  eventCategory: [{ required: true, message: '请选择事件分类', trigger: 'change' }]
}

const stdSelectOptions = computed(() => {
  const list = STANDARD_METRIC_TYPES.slice()
  const r = props.record
  const raw = r?.standardMetricTypeKey
  const canon = raw ? normalizeStandardMetricKey(raw) : ''
  if (
    props.mode === 'edit' &&
    raw &&
    !list.some((x) => x.key === raw) &&
    !list.some((x) => x.key === canon)
  ) {
    list.unshift({
      key: raw,
      name: r.standardMetricTypeName || raw,
      defaultUnit: '',
      defaultDataSourceType: ''
    })
  }
  return list
})

const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑系统模板' : '新增系统模板'))

const exprPreview = computed(() => buildSystemTemplateExpression(form))

function onStdMetricChange() {
  const t = stdSelectOptions.value.find((x) => x.key === form.standardMetricTypeKey)
  if (t?.defaultUnit) form.primaryUnit = t.defaultUnit
}

function resetEmpty() {
  Object.assign(form, {
    id: '',
    name: '',
    category: '能耗',
    standardMetricTypeKey: STANDARD_METRIC_TYPES[0]?.key || '',
    valueType: 'number',
    primaryOp: '>',
    primaryValue: 0,
    primaryUnit: '',
    level: 3,
    eventCategory: '能耗异常',
    description: ''
  })
  onStdMetricChange()
}

function applyRecord(r) {
  if (!r) {
    resetEmpty()
    return
  }
  const sk = r.standardMetricTypeKey
  Object.assign(form, {
    id: r.id,
    name: r.name || '',
    category: r.category || '能耗',
    standardMetricTypeKey: sk ? normalizeStandardMetricKey(sk) || sk : '',
    valueType: r.valueType || 'number',
    primaryOp: r.primaryOp || '>',
    primaryValue: r.primaryValue ?? 0,
    primaryUnit: r.primaryUnit || '',
    level: r.level ?? 3,
    eventCategory: r.eventCategory || '能耗异常',
    description: r.description || ''
  })
  if (!form.standardMetricTypeKey && STANDARD_METRIC_TYPES[0]) {
    form.standardMetricTypeKey = STANDARD_METRIC_TYPES[0].key
  }
}

watch(
  () => [props.visible, props.mode, props.record],
  () => {
    if (!props.visible) return
    applyRecord(props.mode === 'edit' ? props.record : null)
  },
  { deep: true }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const name = String(form.name || '').trim()
  if (!name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (systemTemplateNameExists(name, props.mode === 'edit' ? form.id : null)) {
    ElMessage.error('模板名称已存在，请使用唯一名称')
    return
  }
  const expr = buildSystemTemplateExpression(form)
  if (!expr) {
    ElMessage.error('请完善触发条件')
    return
  }
  const st = stdSelectOptions.value.find((x) => x.key === form.standardMetricTypeKey)
  submitting.value = true
  try {
    const canonKey =
      normalizeStandardMetricKey(form.standardMetricTypeKey) || form.standardMetricTypeKey
    const canonicalSt =
      stdSelectOptions.value.find((x) => x.key === canonKey) ||
      STANDARD_METRIC_TYPES.find((x) => x.key === canonKey)

    const payload = {
      id: form.id,
      tenant_id: 0,
      isSystem: true,
      name,
      category: form.category,
      standardMetricTypeKey: canonKey,
      standardMetricTypeName: canonicalSt?.name || st?.name || '',
      expression: expr,
      level: form.level,
      eventCategory: form.eventCategory,
      description: form.description || '',
      valueType: form.valueType,
      primaryOp: form.primaryOp,
      primaryValue: form.primaryValue,
      primaryUnit: form.primaryUnit || '',
      eventPreview: ''
    }
    if (props.mode === 'create') {
      delete payload.id
    }
    upsertSystemTemplate(payload)
    ElMessage.success(props.mode === 'edit' ? '系统模板已更新' : '系统模板已新增')
    emit('saved')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}
</script>
