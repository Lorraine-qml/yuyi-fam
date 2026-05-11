/**
 * 通知方式配置（演示）：供「通知方式配置」页与「风险报告·定时任务」推送设置复用。
 * 邮件类型含 SMTP 参数；钉钉/企微使用 Webhook（敏感信息演示存本地）。
 */
import { reactive } from 'vue'

const LS_KEY = 'yuyi-notification-methods-v2'

export const NOTIFY_TYPE_META = {
  ding: { label: '钉钉' },
  mail: { label: '邮件' },
  wework: { label: '企业微信' },
  sms: { label: '短信' }
}

/** 可用于定时任务多选的渠道（不含短信，可按需放开） */
const SCHEDULE_ALLOWED_TYPES = new Set(['ding', 'mail', 'wework'])

function emptySmtp() {
  return {
    smtpHost: '',
    smtpPort: 465,
    smtpSsl: true,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: ''
  }
}

function normalizeRow(raw) {
  const type = raw.type || 'ding'
  const smtp = {
    ...emptySmtp(),
    smtpHost: String(raw.smtpHost ?? ''),
    smtpPort: Number(raw.smtpPort) || 465,
    smtpSsl: raw.smtpSsl !== false,
    smtpUser: String(raw.smtpUser ?? ''),
    smtpPassword: String(raw.smtpPassword ?? ''),
    smtpFrom: String(raw.smtpFrom ?? '')
  }
  return {
    id: raw.id,
    name: String(raw.name || ''),
    type,
    typeLabel: NOTIFY_TYPE_META[type]?.label || type,
    enabled: raw.enabled !== false,
    testStatus: raw.testStatus || 'untested',
    lastTest: raw.lastTest || '—',
    updater: raw.updater || '管理员',
    webhookUrl: String(raw.webhookUrl ?? ''),
    ...smtp
  }
}

function seedRows() {
  return [
    normalizeRow({
      id: 'nm-ding-ops',
      name: '钉钉机器人（运维群）',
      type: 'ding',
      enabled: true,
      testStatus: 'ok',
      lastTest: '2026-04-20 10:00:00',
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=***'
    }),
    normalizeRow({
      id: 'nm-mail-report',
      name: '邮件（SMTP·报告专用）',
      type: 'mail',
      enabled: true,
      testStatus: 'ok',
      lastTest: '2026-04-18 09:00:00',
      smtpHost: 'smtp.example.com',
      smtpPort: 465,
      smtpSsl: true,
      smtpUser: 'report-sender@example.com',
      smtpPassword: '',
      smtpFrom: 'risk-report@example.com'
    }),
    normalizeRow({
      id: 'nm-wework-it',
      name: '企业微信（IT部门）',
      type: 'wework',
      enabled: true,
      testStatus: 'ok',
      lastTest: '2026-04-19 11:00:00',
      webhookUrl: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=***'
    }),
    normalizeRow({
      id: 'nm-sms-duty',
      name: '短信值班号',
      type: 'sms',
      enabled: true,
      testStatus: 'untested',
      lastTest: '—',
      webhookUrl: ''
    }),
    normalizeRow({
      id: 'nm-ding-visitor',
      name: '访客通道钉钉',
      type: 'ding',
      enabled: true,
      testStatus: 'ok',
      lastTest: '2026-04-19 11:00:00',
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=demo2'
    })
  ]
}

function readLs() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

function writeLs(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

const store = reactive({ list: [] })

/** 组件内直接使用以便响应式更新（与 hydrate 同属一模块实例） */
export const notificationMethodStore = store

export function hydrateNotificationMethods() {
  const stored = readLs()
  if (stored?.length) {
    store.list = stored.map((r) => normalizeRow(r))
    return
  }
  store.list = seedRows()
  writeLs(store.list)
}

hydrateNotificationMethods()

export function listNotificationMethodRows() {
  return store.list.slice()
}

export function getNotificationMethod(id) {
  if (id == null) return null
  return store.list.find((r) => r.id === id) || null
}

/**
 * 定时任务表单：已启用且非「失败」的渠道（演示）
 */
export function listMethodsForSchedulePush() {
  return store.list.filter(
    (r) =>
      SCHEDULE_ALLOWED_TYPES.has(r.type) && r.enabled !== false && r.testStatus !== 'fail'
  )
}

export function replaceNotificationMethodList(rows) {
  store.list = rows.map((r) => normalizeRow(r))
  writeLs(store.list)
}

export function upsertNotificationMethod(row) {
  const next = normalizeRow(row)
  const ix = store.list.findIndex((x) => x.id === next.id)
  const list = [...store.list]
  if (ix >= 0) list[ix] = next
  else list.push(next)
  store.list = list
  writeLs(list)
  return next
}

export function deleteNotificationMethod(id) {
  const list = store.list.filter((x) => x.id !== id)
  if (list.length === store.list.length) return false
  store.list = list
  writeLs(list)
  return true
}
