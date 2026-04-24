<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑定时任务' : '新增定时任务'"
    width="560px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="任务名称" prop="name">
        <el-input v-model="form.name" maxlength="80" show-word-limit />
      </el-form-item>
      <el-form-item label="执行周期" prop="cycle">
        <el-select v-model="form.cycle" class="w-full" @change="syncCycleLabel">
          <el-option
            v-for="c in CYCLE_OPTIONS"
            :key="c.value"
            :label="c.label"
            :value="c.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="执行时间" prop="runTime">
        <el-time-select
          v-model="form.runTime"
          start="06:00"
          step="00:30"
          end="22:00"
          placeholder="选择时间"
          class="w-full"
        />
      </el-form-item>
      <el-form-item label="报告模板" prop="templateId">
        <el-select v-model="form.templateId" filterable class="w-full">
          <el-option
            v-for="t in templateOptions"
            :key="t.id"
            :label="`${t.name}（${periodLabel(t.periodType)}）`"
            :value="t.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="接收方式">
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
      <el-form-item label="任务状态">
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
import { CYCLE_OPTIONS, PERIOD_OPTIONS } from '@/data/riskReportMock'

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
  templateId: '',
  channelEmail: true,
  channelDing: true,
  channelWecom: false,
  recipients: '',
  enabled: true
})

const isEdit = computed(() => props.mode === 'edit')

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  recipients: [{ required: true, message: '请填写接收人', trigger: 'blur' }]
}

function periodLabel(pt) {
  return PERIOD_OPTIONS.find((p) => p.value === pt)?.label || pt
}

function syncCycleLabel() {
  const c = CYCLE_OPTIONS.find((x) => x.value === form.cycle)
  form.cycleLabel = c?.label || form.cycle
}

function resetForm() {
  form.name = ''
  form.cycle = 'daily'
  form.cycleLabel = '每日'
  form.runTime = '09:00'
  form.templateId = props.templateOptions[0]?.id || ''
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
      form.cycle = props.record.cycle
      form.cycleLabel = props.record.cycleLabel
      form.runTime = props.record.runTime
      form.templateId = props.record.templateId
      form.channelEmail = props.record.channelEmail
      form.channelDing = props.record.channelDing
      form.channelWecom = props.record.channelWecom
      form.recipients = props.record.recipients
      form.enabled = props.record.enabled
    } else resetForm()
  }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const tpl = props.templateOptions.find((t) => t.id === form.templateId)
  syncCycleLabel()
  emit('saved', {
    name: form.name.trim(),
    cycle: form.cycle,
    cycleLabel: form.cycleLabel,
    runTime: form.runTime,
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
