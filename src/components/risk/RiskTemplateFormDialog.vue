<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="640px"
    align-center
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="pr-1">
      <el-form-item label="业务板块" prop="category">
        <el-select v-model="form.category" class="w-full" placeholder="板块">
          <el-option v-for="c in TEMPLATE_SECTOR_TABS" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="form.name" maxlength="64" show-word-limit placeholder="模板名称" />
      </el-form-item>
      <el-form-item label="关联指标" prop="metricCode">
        <el-select
          v-model="form.metricCode"
          filterable
          class="w-full"
          placeholder="选择指标"
          :disabled="lockMetric"
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
      <el-form-item label="值类型">
        <el-radio-group v-model="form.valueType" size="small">
          <el-radio-button value="number">数值</el-radio-button>
          <el-radio-button value="string">文本</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="条件">
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
      <el-form-item v-if="form.valueType === 'string'" label="事件预览">
        <el-input v-model="form.eventPreview" placeholder="可选，用于试运行展示" />
      </el-form-item>
      <el-form-item label="说明">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="模板说明" />
      </el-form-item>
      <el-form-item label="表达式预览">
        <el-input :model-value="exprPreview" type="textarea" :rows="2" readonly />
      </el-form-item>
      <p v-if="lockMetric" class="text-xs text-amber-700 -mt-2 mb-0">
        项目模板中关联指标不可直接修改；需更换指标时请删除后从系统模板重新另存。
      </p>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createEmptyRuleForm,
  EVENT_CATEGORY_OPTIONS,
  formToRulePayload,
  OP_OPTIONS,
  RULE_LEVEL_OPTIONS
} from '@/data/riskRulesMock'

const TEMPLATE_SECTOR_TABS = ['能耗', '安全', '食堂', '物业', '资产']

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  /** 自定义模板对象；预置转自定义时传入预置结构 */
  record: { type: Object, default: null },
  metricOptions: { type: Array, default: () => [] },
  /** 来自「本项目模板」且已绑定项目指标时，禁止修改指标 */
  lockMetric: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)
const form = reactive({
  ...createEmptyRuleForm(),
  category: '能耗',
  eventPreview: ''
})

const rules = {
  category: [{ required: true, message: '请选择板块', trigger: 'change' }],
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  metricCode: [{ required: true, message: '请选择指标', trigger: 'change' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  eventCategory: [{ required: true, message: '请选择事件分类', trigger: 'change' }]
}

const dialogTitle = computed(() => {
  if (props.mode === 'edit') return '编辑模板'
  if (props.record && props.record.isPreset) return '基于预置新建自定义模板'
  return '新增模板'
})

const exprPreview = computed(() => {
  try {
    return formToRulePayload(form, props.metricOptions).expression
  } catch {
    return ''
  }
})

function onMetricChange() {
  const m = props.metricOptions.find((x) => x.value === form.metricCode)
  form.metricName = m?.name || ''
}

function applyRecord(t) {
  if (!t) {
    Object.assign(form, createEmptyRuleForm(), {
      category: '能耗',
      eventPreview: ''
    })
    if (props.metricOptions[0]) {
      form.metricCode = props.metricOptions[0].value
      onMetricChange()
    }
    return
  }
  Object.assign(form, createEmptyRuleForm(), {
    name: t.name || '',
    metricCode: t.metricCode || '',
    metricName: t.metricName || '',
    description: t.description || '',
    valueType: t.valueType || 'number',
    primaryOp: t.primaryOp || '>',
    primaryValue: t.primaryValue ?? 0,
    primaryUnit: t.primaryUnit || '',
    level: t.level ?? 3,
    eventCategory: t.eventCategory || '能耗异常',
    eventPreview: t.eventPreview || '',
    category: t.category || '能耗',
    runMode: 'trial',
    extraConditions: [],
    conditionLogic: 'AND',
    timeWindow: 'none',
    silenceMinutes: 30
  })
  onMetricChange()
}

watch(
  () => [props.visible, props.mode, props.record],
  () => {
    if (!props.visible) return
    applyRecord(props.record)
  }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const fp = formToRulePayload(form, props.metricOptions)
  const out = {
    id: props.mode === 'edit' && props.record?.id ? props.record.id : `ct-${Date.now()}`,
    category: form.category,
    name: form.name.trim(),
    metricCode: form.metricCode,
    metricName: fp.metricName,
    expression: fp.expression,
    level: form.level,
    eventCategory: form.eventCategory,
    description: form.description || '',
    primaryOp: form.primaryOp,
    primaryValue: form.primaryValue,
    primaryUnit: form.primaryUnit || '',
    valueType: form.valueType,
    eventPreview: form.eventPreview || ''
  }
  emit('saved', out)
  emit('update:visible', false)
  ElMessage.success(props.mode === 'edit' ? '模板已更新' : '模板已保存')
}
</script>
