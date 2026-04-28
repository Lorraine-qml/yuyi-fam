<template>
  <el-dialog
    :model-value="visible"
    title="基于模板创建规则"
    width="640px"
    align-center
    destroy-on-close
    class="risk-template-apply-dialog"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <div v-if="snapshot" class="space-y-5">
      <div>
        <div class="text-sm font-medium text-gray-800 mb-2">模板信息</div>
        <div
          class="rounded-lg border p-3 text-sm space-y-1.5"
          style="border-color: var(--yw-border); background: var(--yw-bg-page)"
        >
          <p><span class="text-gray-500">模板名称：</span>{{ snapshot.name }}</p>
          <p><span class="text-gray-500">所属板块：</span>{{ sectorLabelForMetricCode(snapshot.metricCode) }}</p>
          <p>
            <span class="text-gray-500">表达式：</span
            ><code class="text-xs text-gray-800 ml-1">{{ snapshot.expression }}</code>
          </p>
          <p>
            <span class="text-gray-500">预警等级：</span
            >{{ (levelMeta(snapshot.level) || {}).labelShort || '—' }}
          </p>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px" class="pr-1">
        <div class="text-sm font-medium text-gray-800 mb-1">规则配置（可修改）</div>
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" maxlength="80" show-word-limit placeholder="规则名称" />
        </el-form-item>
        <el-form-item label="关联指标" prop="metricCode">
          <el-select
            v-model="form.metricCode"
            filterable
            class="w-full"
            placeholder="选择指标"
            @change="onMetricChange"
          >
            <el-option
              v-for="m in metricOptions"
              :key="m.value"
              :label="m.label"
              :value="m.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="触发条件">
          <el-input :model-value="triggerPreview" type="textarea" :rows="2" readonly class="!text-sm" />
        </el-form-item>
        <el-form-item label="预警等级" prop="level">
          <el-select v-model="form.level" class="w-full" placeholder="等级">
            <el-option
              v-for="l in RULE_LEVEL_OPTIONS"
              :key="l.value"
              :label="l.label"
              :value="l.value"
            />
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

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">创建规则</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  createEmptyRuleForm,
  formToRulePayload,
  levelMeta,
  RULE_LEVEL_OPTIONS,
  sectorLabelForMetricCode
} from '@/data/riskRulesMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  /** RULE_TEMPLATES 中的一项 */
  template: { type: Object, default: null },
  metricOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'created'])

const formRef = ref(null)
const submitting = ref(false)
const snapshot = ref(null)
const form = reactive(createEmptyRuleForm())

const formRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  metricCode: [{ required: true, message: '请选择关联指标', trigger: 'change' }],
  level: [{ required: true, message: '请选择预警等级', trigger: 'change' }]
}

const triggerPreview = computed(() => {
  try {
    return formToRulePayload(form, props.metricOptions).expressionDisplay || '—'
  } catch {
    return '—'
  }
})

function onMetricChange() {
  const m = props.metricOptions.find((x) => x.value === form.metricCode)
  form.metricName = m?.name || ''
}

function mergeTemplate(t) {
  if (!t) return
  snapshot.value = { ...t }
  Object.assign(form, createEmptyRuleForm(), {
    name: t.name,
    metricCode: t.metricCode,
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
  onMetricChange()
}

watch(
  () => [props.visible, props.template],
  () => {
    if (props.visible && props.template) mergeTemplate(props.template)
    if (!props.visible) snapshot.value = null
  }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = formToRulePayload(form, props.metricOptions)
    const eventPreview = props.template?.eventPreview || ''
    /** 由父级校验通过后再关窗 */
    emit('created', { payload, eventPreview: eventPreview || undefined })
  } finally {
    submitting.value = false
  }
}

function applySuggestedName(name) {
  if (name != null) form.name = name
}

defineExpose({ applySuggestedName })
</script>
