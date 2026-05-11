/**
 * 定时任务「立即执行」流程（前端演示）：模拟报告生成与各渠道投递校验，
 * 产出与 schedule_execution_log 表结构对齐的日志对象，便于将来对接后端。
 */
import {
  getNotificationMethod,
  listMethodsForSchedulePush as listPushMethods
} from '@/data/notificationMethodMock'

/** @typedef {'success'|'fail'|'partial'} ScheduleExecStatus */

const NOTIFY_TYPE_LABEL = { mail: '邮件', ding: '钉钉', wework: '企业微信' }

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function splitEmails(s) {
  if (!s || typeof s !== 'string') return []
  return s
    .split(/[;；,，\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/** 模板 id → 演示用统计周期文案 */
export function scheduleTimeRangeHint(scheduleRow) {
  const c = scheduleRow?.cycle
  if (c === 'daily') return '统计范围：前一自然日（演示）'
  if (c === 'weekly_mon') return '统计范围：上一完整自然周（演示）'
  if (c === 'monthly_1') return '统计范围：上一自然月（演示）'
  if (c === 'cron') return '统计范围：按 Cron 规则推算（演示）'
  return '统计范围（演示）'
}

function resolveNotifyMethodIdsSync(row) {
  const ids = Array.isArray(row.notifyMethodIds) ? row.notifyMethodIds.filter(Boolean) : []
  if (ids.length) return ids
  const methods = listPushMethods()
  const out = []
  if (row.channelEmail) {
    const m = methods.find((x) => x.type === 'mail')
    if (m) out.push(m.id)
  }
  if (row.channelDing) {
    const m = methods.find((x) => x.type === 'ding')
    if (m) out.push(m.id)
  }
  if (row.channelWecom) {
    const m = methods.find((x) => x.type === 'wework')
    if (m) out.push(m.id)
  }
  return out
}

function logId() {
  return `sel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 模拟执行一次定时任务。
 * @param {object} scheduleRow 任务行
 * @param {string} executeTime ISO 样式时间串（与界面一致）
 * @returns {Promise<{ log: object, toastType: 'success'|'warning'|'error', toastMessage: string, myReportEntry: object|null }>}
 */
export async function executeScheduleTask(scheduleRow, executeTime) {
  await delay(520 + Math.floor(Math.random() * 380))

  const taskName = scheduleRow.name || '未命名任务'
  const ids = resolveNotifyMethodIdsSync(scheduleRow)

  const baseLog = {
    id: logId(),
    schedule_id: scheduleRow.id,
    task_name: taskName,
    execute_time: executeTime,
    push_channels: '',
    receivers: '',
    error_message: null,
    file_size_kb: null,
    detail: ''
  }

  if (!scheduleRow.templateId) {
    const log = {
      ...baseLog,
      status: 'fail',
      error_message: '未绑定报告模板',
      detail: ['任务校验失败：未绑定报告模板，无法生成报告文件。'].join('\n'),
      push_target_count: 0
    }
    return {
      log,
      toastType: 'error',
      toastMessage: `❌ 执行失败：${log.error_message}`,
      myReportEntry: null
    }
  }

  if (!ids.length) {
    const log = {
      ...baseLog,
      status: 'fail',
      error_message: '未配置可用的通知方式',
      detail: ['未勾选任何推送渠道（或没有在「通知方式配置」中可用的钉钉/邮件/企微）。'].join('\n'),
      push_target_count: 0
    }
    return {
      log,
      toastType: 'error',
      toastMessage: `❌ 执行失败：${log.error_message}`,
      myReportEntry: null
    }
  }

  const mailRaw = scheduleRow.recipientsMail || scheduleRow.recipients || ''
  const emails = splitEmails(mailRaw)

  const channelParts = []
  const receiverParts = []
  const pushNotes = []
  const errors = []

  let mailDelivered = false
  let dingDeliverCount = 0
  let weworkDeliverCount = 0

  let file_kb = Math.floor(880 + Math.random() * 520)

  for (const nid of ids) {
    const m = getNotificationMethod(nid)
    const labelShort = NOTIFY_TYPE_LABEL[m?.type] || '渠道'

    if (!m || m.enabled === false) {
      errors.push(`${labelShort}：配置不存在或已停用`)
      continue
    }

    if (m.type === 'mail') {
      channelParts.push('邮件')
      if (!String(m.smtpHost || '').trim()) {
        errors.push('邮件：SMTP 服务器未配置')
        pushNotes.push('【邮件】未发送（SMTP 未配置）')
        continue
      }
      if (!emails.length) {
        errors.push('邮件：未填写收件人')
        pushNotes.push('【邮件】未发送（无收件人）')
        continue
      }
      receiverParts.push(`邮件：${emails.join('、')}`)
      pushNotes.push(`【邮件】已发送 PDF 附件至 ${emails.length} 个邮箱（演示）`)
      mailDelivered = true
      continue
    }

    if (m.type === 'ding') {
      channelParts.push('钉钉')
      if (!String(m.webhookUrl || '').trim()) {
        errors.push('钉钉：Webhook 未配置')
        pushNotes.push('【钉钉】未推送（Webhook 未配置）')
        continue
      }
      const drec = String(scheduleRow.recipientsDing || '').trim()
      receiverParts.push(drec ? `钉钉：${drec}` : '钉钉：运维群（未 @ 单人）')
      pushNotes.push('【钉钉】已推送 Markdown + 下载链接（演示）')
      dingDeliverCount += 1
      continue
    }

    if (m.type === 'wework') {
      channelParts.push('企业微信')
      if (!String(m.webhookUrl || '').trim()) {
        errors.push('企业微信：Webhook 未配置')
        pushNotes.push('【企业微信】未推送（Webhook 未配置）')
        continue
      }
      const wrec = String(scheduleRow.recipientsWework || '').trim()
      receiverParts.push(wrec ? `企微：${wrec}` : '企微：群机器人')
      pushNotes.push('【企业微信】已推送图文 + 下载链接（演示）')
      weworkDeliverCount += 1
      continue
    }
  }

  const uniqChannels = [...new Set(channelParts)]
  const okPush = pushNotes.filter((p) => p.includes('已'))
  const hasAnySuccess = okPush.length > 0
  const hasAnyError = errors.length > 0

  /** @type {ScheduleExecStatus} */
  let status = 'success'
  if (!hasAnySuccess && hasAnyError) status = 'fail'
  else if (hasAnySuccess && hasAnyError) status = 'partial'

  const fileLabel = `${(file_kb / 1024).toFixed(1)} MB`

  const detailLines = [
    `任务：${taskName}`,
    `执行时间：${executeTime}`,
    scheduleTimeRangeHint(scheduleRow),
    `报告模板：${scheduleRow.templateName || scheduleRow.templateId || '—'}`,
    `生成文件：${scheduleRow.templateName || '报告'}_${executeTime.slice(0, 10)}.pdf（演示）`,
    `文件大小：约 ${fileLabel}（${file_kb} KB）`,
    '',
    '推送明细：',
    ...pushNotes,
    ...(errors.length ? ['', '异常/跳过：', ...errors.map((e) => `· ${e}`)] : [])
  ]

  const log = {
    ...baseLog,
    status,
    file_size_kb: file_kb,
    push_channels: uniqChannels.join('、'),
    receivers: receiverParts.join('；') || '—',
    error_message: errors.length ? errors.join('；') : null,
    detail: detailLines.join('\n')
  }

  let toastType = 'success'
  let toastMessage = ''

  const approxPeople = (mailDelivered ? emails.length : 0) + dingDeliverCount + weworkDeliverCount
  log.push_target_count = hasAnySuccess ? Math.max(approxPeople, 1) : 0

  if (status === 'success') {
    toastMessage = `✅ 报告已生成并发送至 ${log.push_target_count} 个目标（${formatReceiverToast(scheduleRow, emails)}）`
  } else if (status === 'partial') {
    toastType = 'warning'
    toastMessage = `⚠️ 部分成功：报告已生成，已向 ${log.push_target_count} 个目标投递；${errors[0] || '部分渠道未送达'}。可在「历史」中查看明细。`
  } else {
    toastType = 'error'
    toastMessage = `❌ 执行失败：${errors[0] || '全部推送渠道均未成功'}`
  }

  const myReportEntry = {
    id: `rh-${Date.now()}`,
    title: `${taskName} · 手动执行`,
    periodType: inferPeriodFromSchedule(scheduleRow),
    templateId: scheduleRow.templateId,
    templateName: scheduleRow.templateName,
    generatedAt: executeTime,
    source: 'schedule_manual',
    scheduleId: scheduleRow.id
  }

  return {
    log,
    toastType,
    toastMessage,
    myReportEntry: log.file_size_kb != null ? myReportEntry : null
  }
}

function inferPeriodFromSchedule(row) {
  const c = row?.cycle
  if (c === 'daily') return 'day'
  if (c === 'weekly_mon') return 'week'
  if (c === 'monthly_1') return 'month'
  return 'week'
}

function formatReceiverToast(row, emails) {
  const parts = []
  if (emails.length) parts.push(`邮件：${emails.slice(0, 2).join('、')}${emails.length > 2 ? ' 等' : ''}`)
  if (String(row.recipientsDing || '').trim()) parts.push(`钉钉：${String(row.recipientsDing).trim()}`)
  if (String(row.recipientsWework || '').trim()) parts.push(`企微：${String(row.recipientsWework).trim()}`)
  return parts.length ? parts.join('；') : '各渠道已投递'
}

/** 列表「最近执行结果」摘要文案 */
export function formatLastResultSummary(log) {
  if (!log) return ''
  const n =
    typeof log.push_target_count === 'number' && Number.isFinite(log.push_target_count)
      ? log.push_target_count
      : countTargetsInLog(log)
  if (log.status === 'success') return `✅ 成功（已推送 ${n} 个目标）`
  if (log.status === 'partial') {
    const em = String(log.error_message || '')
    if (em.includes('邮件')) return '⚠️ 部分成功（邮件失败）'
    if (em.includes('钉钉')) return '⚠️ 部分成功（钉钉失败）'
    if (em.includes('企业微信') || em.includes('企微')) return '⚠️ 部分成功（企微失败）'
    return '⚠️ 部分成功（部分渠道失败）'
  }
  const errFull = String(log.error_message || '')
  const err = errFull.slice(0, 24)
  return err ? `❌ 失败（${err}${errFull.length > 24 ? '…' : ''}）` : '❌ 失败'
}

function countTargetsInLog(log) {
  const r = String(log.receivers || '')
  const mailMatches = r.match(/@/g)
  let n = mailMatches ? mailMatches.length : 0
  if (/钉钉/.test(log.push_channels || '')) n += 1
  if (/企业微信|企微/.test(log.push_channels || '')) n += 1
  return Math.max(n, 1)
}

/**
 * 新建项目时的演示执行历史（与 seed 任务 id 对齐）
 * @param {Array<{ id: string, name: string }>} schedules
 */
export function seedScheduleExecutionLogs(schedules) {
  const [s0, s1, s2] = schedules
  const logs = []
  if (s0) {
    logs.push({
      id: 'sel-seed-a',
      schedule_id: s0.id,
      task_name: s0.name,
      execute_time: '2026-05-06 09:00:12',
      status: 'success',
      file_size_kb: 1180,
      push_target_count: 3,
      push_channels: '邮件、钉钉',
      receivers: 'zhangsan@example.com；lisi@example.com；钉钉：@所有人',
      error_message: null,
      detail: ''
    })
    logs.push({
      id: 'sel-seed-b',
      schedule_id: s0.id,
      task_name: s0.name,
      execute_time: '2026-05-05 09:00:08',
      status: 'success',
      file_size_kb: 1120,
      push_target_count: 2,
      push_channels: '邮件、钉钉',
      receivers: 'zhangsan@example.com；钉钉：@所有人',
      error_message: null,
      detail: ''
    })
  }
  if (s1) {
    logs.push({
      id: 'sel-seed-c',
      schedule_id: s1.id,
      task_name: s1.name,
      execute_time: '2026-04-28 08:01:22',
      status: 'partial',
      file_size_kb: 1240,
      push_target_count: 1,
      push_channels: '邮件、钉钉',
      receivers: 'risk-team@example.com；钉钉：运维群（未 @ 单人）',
      error_message: '邮件：SMTP 登录超时（演示）',
      detail: ''
    })
  }
  return logs
}

/** 种子/接口未带 detail 时，用字段拼出可读的执行详情 */
export function formatScheduleExecutionDetail(log) {
  if (!log) return ''
  if (String(log.detail || '').trim()) return log.detail
  const size =
    log.file_size_kb != null ? `约 ${(log.file_size_kb / 1024).toFixed(1)} MB（${log.file_size_kb} KB）` : '—'
  return [
    `任务：${log.task_name || '—'}`,
    `执行时间：${log.execute_time || '—'}`,
    `状态：${log.status || '—'}`,
    `文件大小：${size}`,
    `推送渠道：${log.push_channels || '—'}`,
    `接收人：${log.receivers || '—'}`,
    log.error_message ? `错误说明：${log.error_message}` : ''
  ]
    .filter(Boolean)
    .join('\n')
}
