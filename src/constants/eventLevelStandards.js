/**
 * 统一事件等级：与实时事件 pushLevel、推送配置存储值一致，
 * 与风险规则 RULE_LEVEL_OPTIONS（数值 1–4）一一映射。
 */

/** UI 勾选顺序（低→高→紧急） */
export const EVENT_LEVEL_KEY_ORDER = ['low', 'medium', 'high', 'urgent']

/** PRD：默认放开低/中/高；紧急按需勾选（不含 urgent） */
export const DEFAULT_ALLOWED_LEVEL_KEYS = ['low', 'medium', 'high']

/** key → RULE_LEVEL_OPTIONS.value */
export const EVENT_LEVEL_META = Object.freeze({
  low: {
    key: 'low',
    label: '低',
    ruleLevelValue: 4,
    /** 推送 / 实时事件存储 */
    pushLevel: 'low'
  },
  medium: {
    key: 'medium',
    label: '中',
    ruleLevelValue: 3,
    pushLevel: 'medium'
  },
  high: {
    key: 'high',
    label: '高',
    ruleLevelValue: 2,
    pushLevel: 'high'
  },
  urgent: {
    key: 'urgent',
    label: '紧急',
    ruleLevelValue: 1,
    pushLevel: 'urgent'
  }
})

const VALID_KEYS = new Set(EVENT_LEVEL_KEY_ORDER)

export function isValidLevelKey(k) {
  return VALID_KEYS.has(k)
}

export function ruleLevelValueFromKey(key) {
  return EVENT_LEVEL_META[key]?.ruleLevelValue
}

export function levelKeyFromRuleLevelValue(value) {
  for (const k of EVENT_LEVEL_KEY_ORDER) {
    if (EVENT_LEVEL_META[k].ruleLevelValue === value) return k
  }
  return 'medium'
}

export function levelKeyFromPushLevel(push) {
  const p = String(push || '').trim()
  const hit = EVENT_LEVEL_KEY_ORDER.find((k) => EVENT_LEVEL_META[k].pushLevel === p)
  return hit || 'medium'
}

export function normalizeAllowedLevelKeys(input) {
  let arr = []
  if (Array.isArray(input)) arr = input
  else if (typeof input === 'string' && input.trim()) {
    try {
      const p = JSON.parse(input)
      if (Array.isArray(p)) arr = p
    } catch {
      /* ignore */
    }
  }
  const parts = arr.map((x) => String(x).trim()).filter((x) => VALID_KEYS.has(x))
  const uniq = [...new Set(parts)]
  if (!uniq.length) return [...DEFAULT_ALLOWED_LEVEL_KEYS]
  uniq.sort((a, b) => EVENT_LEVEL_KEY_ORDER.indexOf(a) - EVENT_LEVEL_KEY_ORDER.indexOf(b))
  return uniq
}
