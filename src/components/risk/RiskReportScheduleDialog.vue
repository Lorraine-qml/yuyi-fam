<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑定时任务' : '新增定时任务'"
    width="760px"
    class="schedule-task-dialog"
    align-center
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="132px" class="schedule-task-form">
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
        <el-radio-group
          v-model="form.cycle"
          class="flex flex-row flex-wrap gap-x-6 gap-y-2 items-center"
          @change="onCycleChange"
        >
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

      <div
        class="schedule-push-block rounded-lg border p-4 mb-1 -mx-1"
        style="border-color: var(--yw-border); background: rgba(249, 250, 251, 0.9)"
      >
        <div class="text-sm font-semibold text-gray-800 pb-3 border-b mb-3" style="border-color: var(--yw-border)">
          📤 推送设置
        </div>
        <el-form-item label="通知方式" prop="notifyMethodIds" class="push-form-item push-form-item--notify">
          <p class="text-xs text-gray-500 m-0 mb-2 w-full leading-normal">
            从「通知方式配置」读取已启用渠道，可多选；SMTP / Webhook 在配置中维护。
          </p>
          <el-checkbox-group v-model="form.notifyMethodIds" class="notify-checkbox-group w-full min-w-0">
            <el-checkbox v-for="m in pushMethodOptions" :key="m.id" :label="m.id" class="notify-checkbox">
              <span class="align-middle">{{ m.name }}</span>
              <span class="text-gray-400 text-xs ml-0.5 align-middle">（{{ NOTIFY_TYPE_META[m.type]?.label || m.type }}）</span>
            </el-checkbox>
          </el-checkbox-group>
          <p v-if="!pushMethodOptions.length" class="text-xs text-amber-600 mb-0 mt-1">
            暂无可用的钉钉 / 邮件 / 企业微信渠道，请先到「通知方式配置」维护。
          </p>
          <p
            class="text-xs text-indigo-900/85 bg-indigo-50 border border-indigo-100/80 rounded px-2.5 py-1.5 mt-2 mb-0 leading-relaxed"
          >
            💡 通知方式的 SMTP、钉钉/企微 Webhook 请在「通知方式配置」中维护；此处按渠道填写收件人即可。
          </p>
        </el-form-item>
        <el-form-item v-show="recipientShow.mail" label="收件人（邮件）" prop="recipientsMail" class="push-form-item">
          <el-input
            v-model="form.recipientsMail"
            clearable
            class="push-recipient-input"
            placeholder="多个邮箱用英文分号分隔，如 a@x.com; b@x.com"
          />
        </el-form-item>
        <el-form-item v-show="recipientShow.ding" label="收件人（钉钉）" prop="recipientsDing" class="push-form-item">
          <el-input
            v-model="form.recipientsDing"
            clearable
            class="push-recipient-input"
            placeholder="可选：@所有人 或手机号 / 用户 ID"
          />
        </el-form-item>
        <el-form-item v-show="recipientShow.wework" label="收件人（企微）" prop="recipientsWework" class="push-form-item !mb-0">
          <el-input
            v-model="form.recipientsWework"
            clearable
            class="push-recipient-input"
            placeholder="可选：企微 @ 相关标识"
          />
        </el-form-item>
      </div>

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
import { NOTIFY_TYPE_META, getNotificationMethod, listMethodsForSchedulePush } from '@/data/notificationMethodMock'

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
  notifyMethodIds: [],
  recipientsMail: '',
  recipientsDing: '',
  recipientsWework: '',
  enabled: true
})

const isEdit = computed(() => props.mode === 'edit')

const pushMethodOptions = computed(() => listMethodsForSchedulePush())

function inferNotifyMethodIds(record) {
  if (!record) return []
  const existing = Array.isArray(record.notifyMethodIds) ? record.notifyMethodIds : []
  if (existing.length) {
    const allowed = new Set(pushMethodOptions.value.map((m) => m.id))
    return existing.filter((id) => allowed.has(id))
  }
  const ids = []
  const pushable = listMethodsForSchedulePush()
  if (record.channelEmail) {
    const m = pushable.find((x) => x.type === 'mail')
    if (m) ids.push(m.id)
  }
  if (record.channelDing) {
    const m = pushable.find((x) => x.type === 'ding')
    if (m) ids.push(m.id)
  }
  if (record.channelWecom) {
    const m = pushable.find((x) => x.type === 'wework')
    if (m) ids.push(m.id)
  }
  return ids
}

const selectedRecipientTypes = computed(() => {
  const s = new Set()
  for (const id of form.notifyMethodIds) {
    const m = getNotificationMethod(id)
    if (m?.type) s.add(m.type)
  }
  return s
})

const recipientShow = computed(() => ({
  mail: selectedRecipientTypes.value.has('mail'),
  ding: selectedRecipientTypes.value.has('ding'),
  wework: selectedRecipientTypes.value.has('wework')
}))

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

function channelFlagsFromMethods(ids) {
  let channelEmail = false
  let channelDing = false
  let channelWecom = false
  for (const id of ids) {
    const m = getNotificationMethod(id)
    if (!m) continue
    if (m.type === 'mail') channelEmail = true
    else if (m.type === 'ding') channelDing = true
    else if (m.type === 'wework') channelWecom = true
  }
  return { channelEmail, channelDing, channelWecom }
}

const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  templateId: [{ required: true, message: '请选择模板', trigger: 'change' }],
  notifyMethodIds: [
    {
      validator: (_r, v, cb) => {
        if (!Array.isArray(v) || !v.length) return cb(new Error('请至少选择一种通知方式'))
        cb()
      },
      trigger: 'change'
    }
  ],
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
  recipientsMail: [
    {
      validator: (_r, v, cb) => {
        if (!recipientShow.value.mail) return cb()
        if (!v || !String(v).trim()) return cb(new Error('勾选邮件时需填写收件人邮箱'))
        cb()
      },
      trigger: 'blur'
    }
  ]
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

function defaultNotifyIds() {
  const list = pushMethodOptions.value
  const ids = []
  const ding = list.find((m) => m.type === 'ding')
  const mail = list.find((m) => m.type === 'mail')
  if (mail) ids.push(mail.id)
  if (ding) ids.push(ding.id)
  return ids
}

function resetForm() {
  form.name = ''
  form.cycle = 'daily'
  form.cycleLabel = '每日'
  form.runTime = '09:00'
  form.cronExpr = '0 9 * * *'
  form.templateId = templateChoices.value[0]?.id || ''
  form.notifyMethodIds = defaultNotifyIds()
  form.recipientsMail = ''
  form.recipientsDing = ''
  form.recipientsWework = ''
  form.enabled = true
}

function loadRecord(record) {
  form.name = record.name
  form.cycle = record.cycle || 'daily'
  form.cycleLabel = record.cycleLabel || cycleToLabel(form.cycle)
  form.runTime = record.runTime || '09:00'
  form.cronExpr = record.cronExpr || '0 9 * * *'
  form.templateId = record.templateId
  form.enabled = record.enabled !== false

  let ids = inferNotifyMethodIds(record)
  if (!ids.length) ids = defaultNotifyIds()
  form.notifyMethodIds = ids

  const rm = record.recipientsMail?.trim?.() ? record.recipientsMail : ''
  const legacyRc = record.recipients?.trim?.() ? record.recipients : ''
  form.recipientsMail =
    rm || (record.channelEmail && legacyRc ? legacyRc : '')
  form.recipientsDing = record.recipientsDing ?? ''
  form.recipientsWework = record.recipientsWework ?? ''
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    if (props.record) loadRecord(props.record)
    else resetForm()
  }
)

watch(pushMethodOptions, () => {
  if (!props.visible) return
  const ok = new Set(pushMethodOptions.value.map((m) => m.id))
  form.notifyMethodIds = form.notifyMethodIds.filter((id) => ok.has(id))
})

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
  const channels = channelFlagsFromMethods(form.notifyMethodIds)
  emit('saved', {
    name: form.name.trim(),
    cycle: form.cycle,
    cycleLabel: form.cycleLabel,
    runTime: form.runTime,
    cronExpr: form.cycle === 'cron' ? form.cronExpr.trim() : '',
    templateId: form.templateId,
    templateName: tpl?.name || '',
    notifyMethodIds: [...form.notifyMethodIds],
    recipientsMail: form.recipientsMail.trim(),
    recipientsDing: form.recipientsDing.trim(),
    recipientsWework: form.recipientsWework.trim(),
    ...channels,
    recipients: form.recipientsMail.trim()
  })
  emit('update:visible', false)
  ElMessage.success('任务已保存')
}
</script>

<style scoped>
/* 弹窗内表单：标签不换行，与输入同一行对齐 */
.schedule-task-form :deep(.el-form-item__label) {
  white-space: nowrap;
}

.schedule-push-block :deep(.el-form-item__content) {
  min-width: 0;
}

/* 通知方式：横向排列，固定行高 */
.notify-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 1.25rem;
  line-height: 1.5;
}

.notify-checkbox-group :deep(.el-checkbox) {
  margin-right: 0;
  height: auto;
  white-space: nowrap;
}

.push-form-item {
  margin-bottom: 14px;
}

.push-form-item--notify {
  margin-bottom: 16px;
}

/* 收件人单行占满内容区 */
.push-recipient-input {
  width: 100%;
  max-width: 100%;
}
</style>
