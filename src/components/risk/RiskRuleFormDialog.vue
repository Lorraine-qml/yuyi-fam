<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? `编辑规则 ${record?.versionLabel || ''}` : '新增规则'"
    width="720px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-scrollbar max-height="72vh">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px" class="pr-2">
        <h4 class="text-sm font-semibold text-gray-800 mb-3">基本信息</h4>
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="关联指标" prop="metricCode">
          <el-select
            v-model="form.metricCode"
            filterable
            placeholder="选择指标"
            class="w-full"
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
        <el-form-item label="运行模式">
          <el-radio-group v-model="form.runMode">
            <el-radio value="production">正式运行</el-radio>
            <el-radio value="trial">试运行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="规则说明" />
        </el-form-item>

        <h4 class="text-sm font-semibold text-gray-800 mb-3 mt-2">触发条件（引导式）</h4>
        <div
          class="rounded-lg border p-4 mb-4 space-y-3"
          style="border-color: var(--yw-border); background: var(--yw-bg-page)"
        >
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="text-gray-600">当</span>
            <span class="font-medium text-gray-800">{{ primaryMetricLabel }}</span>
            <el-select v-model="form.primaryOp" class="w-24">
              <el-option v-for="o in OP_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input
              v-if="form.valueType === 'string'"
              v-model="form.primaryValue"
              class="w-36"
              placeholder="值"
            />
            <el-input-number v-else v-model="form.primaryValue" :controls="true" class="!w-36" />
            <el-input v-model="form.primaryUnit" class="w-24" placeholder="单位" />
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">值类型</span>
            <el-radio-group v-model="form.valueType" size="small">
              <el-radio-button value="number">数值</el-radio-button>
              <el-radio-button value="string">文本</el-radio-button>
            </el-radio-group>
          </div>

          <div v-for="(ex, idx) in form.extraConditions" :key="idx" class="flex flex-wrap items-center gap-2">
            <span class="text-gray-500 text-sm">附加</span>
            <el-select v-model="ex.metricCode" class="min-w-[200px]" @change="syncExtraName(ex)">
              <el-option
                v-for="m in metricOptions"
                :key="m.value"
                :label="m.label"
                :value="m.value"
              />
            </el-select>
            <el-select v-model="ex.op" class="w-24">
              <el-option v-for="o in OP_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input-number v-model="ex.value" class="!w-32" />
            <el-input v-model="ex.unit" class="w-20" placeholder="单位" />
            <el-button link type="danger" @click="form.extraConditions.splice(idx, 1)">移除</el-button>
          </div>
          <el-button size="small" @click="addExtra">+ 添加条件</el-button>

          <el-form-item label="条件组合" class="!mb-0">
            <el-radio-group v-model="form.conditionLogic">
              <el-radio value="AND">满足所有条件 (AND)</el-radio>
              <el-radio value="OR">满足任一条件 (OR)</el-radio>
            </el-radio-group>
          </el-form-item>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-gray-600">时间窗口</span>
            <el-select v-model="form.timeWindow" class="w-32">
              <el-option label="不限制" value="none" />
              <el-option label="每天" value="daily" />
            </el-select>
            <template v-if="form.timeWindow === 'daily'">
              <el-time-select v-model="form.dailyStart" start="00:00" step="00:30" end="23:30" placeholder="开始" />
              <span>至</span>
              <el-time-select v-model="form.dailyEnd" start="00:00" step="00:30" end="23:30" placeholder="结束" />
            </template>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">静默期</span>
            <el-input-number v-model="form.silenceMinutes" :min="0" class="!w-28" />
            <span class="text-gray-500">分钟内不重复触发</span>
          </div>
        </div>

        <h4 class="text-sm font-semibold text-gray-800 mb-3">触发动作</h4>
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
        <el-form-item label="事件分类">
          <el-select v-model="form.eventCategory" class="w-full">
            <el-option
              v-for="e in EVENT_CATEGORY_OPTIONS"
              :key="e.value"
              :label="e.label"
              :value="e.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="自动生成工单">
          <div class="flex flex-wrap items-center gap-3">
            <el-switch v-model="form.workOrderEnabled" active-text="是" inactive-text="否" />
            <el-select
              v-if="form.workOrderEnabled"
              v-model="form.workOrderType"
              class="flex-1 min-w-[200px]"
            >
              <el-option
                v-for="w in WORK_ORDER_TYPE_OPTIONS"
                :key="w.value"
                :label="w.label"
                :value="w.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="表达式预览">
          <el-input :model-value="previewExpr" type="textarea" :rows="2" readonly />
        </el-form-item>
      </el-form>
    </el-scrollbar>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" plain @click="emit('test', { ...previewPayload, name: form.name })"
        >测试规则</el-button
      >
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  createEmptyRuleForm,
  EVENT_CATEGORY_OPTIONS,
  formToRulePayload,
  OP_OPTIONS,
  ruleToForm,
  RULE_LEVEL_OPTIONS,
  WORK_ORDER_TYPE_OPTIONS
} from '@/data/riskRulesMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  record: { type: Object, default: null },
  metricOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'saved', 'test'])

const formRef = ref(null)
const form = reactive(createEmptyRuleForm())

const isEdit = computed(() => props.mode === 'edit')

const rules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  metricCode: [{ required: true, message: '请选择关联指标', trigger: 'change' }],
  level: [{ required: true, message: '请选择预警等级', trigger: 'change' }]
}

const primaryMetricLabel = computed(() => {
  const m = props.metricOptions.find((x) => x.value === form.metricCode)
  return m?.name || form.metricName || '（未选指标）'
})

const previewPayload = computed(() => formToRulePayload(form, props.metricOptions))

const previewExpr = computed(() => previewPayload.value.expressionDisplay)

function onMetricChange() {
  const m = props.metricOptions.find((x) => x.value === form.metricCode)
  form.metricName = m?.name || ''
  if (m?.unit && !form.primaryUnit) form.primaryUnit = m.unit
}

function syncExtraName(ex) {
  const m = props.metricOptions.find((x) => x.value === ex.metricCode)
  ex.metricName = m?.name || ''
}

function addExtra() {
  form.extraConditions.push({
    metricCode: form.metricCode || props.metricOptions[0]?.value,
    metricName: '',
    op: '>=',
    value: 0,
    unit: '',
    valueType: 'number'
  })
  const last = form.extraConditions[form.extraConditions.length - 1]
  syncExtraName(last)
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    if (props.record) {
      Object.assign(form, createEmptyRuleForm(), ruleToForm(props.record))
    } else {
      Object.assign(form, createEmptyRuleForm())
      if (props.metricOptions[0]) {
        form.metricCode = props.metricOptions[0].value
        onMetricChange()
      }
    }
  }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  /** 由父级校验（重名、同指标唯一启用）通过后关闭并提示 */
  emit('saved', formToRulePayload(form, props.metricOptions))
}

function setRuleName(n) {
  if (n != null) form.name = n
}

defineExpose({ setRuleName })
</script>
