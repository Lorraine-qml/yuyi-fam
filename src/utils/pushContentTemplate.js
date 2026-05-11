/**
 * 推送内容模板：占位符形如 {event_name}，对应库表 content_template（演示前端用 contentTemplate）。
 */

export const PUSH_TEMPLATE_VAR_OPTIONS = Object.freeze([
  { key: 'event_type', label: '事件类型', placeholder: '{event_type}' },
  { key: 'event_name', label: '事件名称', placeholder: '{event_name}' },
  { key: 'event_content', label: '事件内容', placeholder: '{event_content}' },
  { key: 'location', label: '位置', placeholder: '{location}' },
  { key: 'start_time', label: '发生时间', placeholder: '{start_time}' },
  { key: 'level', label: '等级', placeholder: '{level}' },
  { key: 'threshold', label: '阈值', placeholder: '{threshold}' },
  { key: 'actual_value', label: '实际值', placeholder: '{actual_value}' }
])

const ALLOWED = new Set(PUSH_TEMPLATE_VAR_OPTIONS.map((o) => o.key))

/** 与新占位符一致的默认模板（可作初始化默认值） */
export const DEFAULT_PUSH_CONTENT_TEMPLATE =
  '{event_type}于{start_time}在{location}发生{event_name}，详情：{event_content}。请及时处理。'

const TOKEN_RE_GLOBAL = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g

/**
 * @param {string} template
 * @returns {string[]} 去重后的占位符 key（不含大括号）
 */
export function extractTemplateVarKeys(template) {
  const s = String(template || '')
  const out = []
  const seen = new Set()
  let m
  const re = new RegExp(TOKEN_RE_GLOBAL.source, 'g')
  while ((m = re.exec(s)) !== null) {
    const k = m[1]
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  return out
}

export function findInvalidTemplateVarKeys(template) {
  return extractTemplateVarKeys(template).filter((k) => !ALLOWED.has(k))
}

export function validatePushContentTemplate(template) {
  const invalid = findInvalidTemplateVarKeys(template)
  return { ok: invalid.length === 0, invalid }
}

/**
 * @param {string} template
 * @param {Record<string, string | number>} values
 */
export function renderPushContentTemplate(template, values) {
  const v = values && typeof values === 'object' ? values : {}
  return String(template || '').replace(TOKEN_RE_GLOBAL, (_, key) => {
    const val = v[key]
    return val != null && String(val).trim() !== '' ? String(val) : ''
  })
}

/** 将历史「全角括号」模板转为占位符（用于读旧数据） */
export function migrateLegacyPushTemplate(template) {
  const s = String(template ?? '').trim()
  if (!s) return DEFAULT_PUSH_CONTENT_TEMPLATE
  if (/\{[a-zA-Z_][a-zA-Z0-9_]*\}/.test(s)) return s
  return s
    .replace(/（事件类型）/g, '{event_type}')
    .replace(/（开始时间）/g, '{start_time}')
    .replace(/（所属位置）/g, '{location}')
    .replace(/（事件名称）/g, '{event_name}')
}

/**
 * 将模板拆成片段，用于高亮非法占位符
 * @param {string} template
 * @param {Set<string>} invalidKeys
 * @returns {{ text: string, bad: boolean }[]}
 */
export function segmentTemplateForHighlight(template, invalidKeys) {
  const s = String(template ?? '')
  const set = invalidKeys instanceof Set ? invalidKeys : new Set(invalidKeys || [])
  const parts = []
  let last = 0
  let m
  const re = new RegExp(TOKEN_RE_GLOBAL.source, 'g')
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index), bad: false })
    const key = m[1]
    parts.push({ text: m[0], bad: set.has(key) })
    last = m.index + m[0].length
  }
  if (last < s.length) parts.push({ text: s.slice(last), bad: false })
  if (!parts.length) parts.push({ text: s, bad: false })
  return parts
}
