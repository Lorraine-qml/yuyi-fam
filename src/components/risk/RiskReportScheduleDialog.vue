<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑定时任务' : '新增定时任务'"
    width="580px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="form.name" maxlength="80" show-word-limit placeholder="如：每日风险日报推送" />
      </el-form-item>
      <el-form-item label="报告模板" prop="templateId">
        <el-select v-model="form.templateId" filterable class="w-full" placeholder="选择与周期类型一致的模板">
          <el-option
            v-for="t in templateChoices"
            :key="t.id"
            :label="`${t.name}（${periodLabel(t.periodType)}）`"
            :value="t.id"
          />
        </el-select>
        <p v-if="!templateChoices.length" class="text-xs text-amber-600 mt-1">
          当前周期下无可用项目模板，请先在「模板管理」中启用对应类型的模板。
        </p>
      </el-form-item>
      <el-form-item label="执行周期" required>
        <el-radio-group v-model="form.cycle" class="flex flex-col gap-2 items-start" @change="onCycleChange">
          <el-radio value="daily">每日</el-radio>
          <el-radio value="weekly_mon">每周一</el-radio>
          <el-radio value="monthly_1">每月 1 日</el-radio>
          <el-radio value="cron">自定义 Cron</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.cycle !== 'cron'" label="执行时间" prop="runTime">
        <el-time-select
          v-model="form.runTime"
          start="06:00"
          step="00:30"
          end="23:30"
          placeholder="选择时间"
          class="w-full max-w-xs"
        />
      </el-form-item>
      <el-form-item v-else label="Cron" prop="cronExpr">
        <el-input
          v-model="form.cronExpr"
          placeholder="如 0 9 * * *（每日 9:00，演示）"
          class="font-mono text-sm"
        />
      </el-form-item>
      <el-form-item label="推送方式">
        <el-checkbox v-model="form.channelEmail">邮件</el-checkbox>
        <el-checkbox v-model="form.channelDing">钉钉</el-checkbox>
        <el-checkbox v-model="form.channelWecom">企业微信</el-checkbox>
      </el-form-item>
      <el-form-item label="接收人" prop="recipients">
        <el-input
          v-model="form.recipients"
          type="textarea"
          :rows="2"
          placeholder="多个邮箱或账号用分号分隔"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.enabled">
          <el-radio :label="true">启用</el-radio>
          <el-radio :label="false">停用</el-radio>
        </el-radio-group>
      </el-form-item>
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
import { cycleToPeriodType, PERIOD_OPTIONS } from '@/data/riskReportMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  record: { type: Object, default: null },
  templateOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)
const form = reactive({
  name: '',
  cycle: 'daily',
  cycleLabel: '每日',
  runTime: '09:00',
  cronExpr: '0 9 * * *',
  templateId: '',
  channelEmail: true,
  channelDing: true,
  channelWecom: false,
  recipients: '',
  enabled: true
})

const isEdit = computed(() => props.mode === 'edit')

const expectedPeriod = computed(() => {
  if (form.cycle === 'cron') return null
  return cycleToPeriodType(form.cycle)
})

const templateChoices = computed(() => {
  const list = props.templateOptions.filter((t) => !t.deleted && t.status === 'enabled')
  if (form.cycle === 'cron') return list
  const ep = expectedPeriod.value
  if (!ep) return list
  return list.filter((t) => t.periodType === ep)
})

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  runTime: [
    {
      validator: (_r, v, cb) => {
        if (form.cycle === 'cron') return cb()
        if (!v) return cb(new Error('请选择执行时间'))
        cb()
      },
      trigger: 'change'
    }
  ],
  cronExpr: [
    {
      validator: (_r, v, cb) => {
        if (form.cycle !== 'cron') return cb()
        if (!v || !String(v).trim()) return cb(new Error('请填写 Cron 表达式'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  recipients: [{ required: true, message: '请填写接收人', trigger: 'blur' }]
}

function periodLabel(pt) {
  return PERIOD_OPTIONS.find((p) => p.value === pt)?.label || pt
}

function cycleToLabel(c) {
  const map = {
    daily: '每日',
    weekly_mon: '每周一',
    monthly_1: '每月1日',
    cron: 'Cron'
  }
  return map[c] || c
}

function syncCycleLabel() {
  form.cycleLabel = cycleToLabel(form.cycle)
}

function onCycleChange() {
  syncCycleLabel()
  const first = templateChoices.value[0]
  if (first && !templateChoices.value.some((t) => t.id === form.templateId)) {
    form.templateId = first.id
  }
}

function resetForm() {
  form.name = ''
  form.cycle = 'daily'
  form.cycleLabel = '每日'
  form.runTime = '09:00'
  form.cronExpr = '0 9 * * *'
  form.templateId = templateChoices.value[0]?.id || ''
  form.channelEmail = true
  form.channelDing = true
  form.channelWecom = false
  form.recipients = ''
  form.enabled = true
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    if (props.record) {
      form.name = props.record.name
      form.cycle = props.record.cycle || 'daily'
      form.cycleLabel = props.record.cycleLabel || cycleToLabel(form.cycle)
      form.runTime = props.record.runTime || '09:00'
      form.cronExpr = props.record.cronExpr || '0 9 * * *'
      form.templateId = props.record.templateId
      form.channelEmail = props.record.channelEmail
      form.channelDing = props.record.channelDing
      form.channelWecom = props.record.channelWecom
      form.recipients = props.record.recipients
      form.enabled = props.record.enabled
    } else resetForm()
  }
)

watch(templateChoices, () => {
  if (props.visible && form.templateId && !templateChoices.value.some((t) => t.id === form.templateId)) {
    form.templateId = templateChoices.value[0]?.id || ''
  }
})

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const tpl = props.templateOptions.find((t) => t.id === form.templateId)
  if (form.cycle !== 'cron' && tpl && expectedPeriod.value && tpl.periodType !== expectedPeriod.value) {
    ElMessage.error('任务周期与报告模板类型不一致，请更换模板或调整周期')
    return
  }
  syncCycleLabel()
  emit('saved', {
    name: form.name.trim(),
    cycle: form.cycle,
    cycleLabel: form.cycleLabel,
    runTime: form.runTime,
    cronExpr: form.cycle === 'cron' ? form.cronExpr.trim() : '',
    templateId: form.templateId,
    templateName: tpl?.name || '',
    channelEmail: form.channelEmail,
    channelDing: form.channelDing,
    channelWecom: form.channelWecom,
    recipients: form.recipients.trim(),
    enabled: form.enabled
  })
  emit('update:visible', false)
  ElMessage.success('任务已保存')
}
</script>
