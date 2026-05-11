/**
 * 事件分类 ↔ 规则等级（1–4）换算；第三方 original_level：仅识别平台等级字面量，否则按「中」入库（演示）。
 */
import {
  DEFAULT_ALLOWED_LEVEL_KEYS,
  normalizeAllowedLevelKeys as normAllowed,
  EVENT_LEVEL_META,
  isValidLevelKey
} from '@/constants/eventLevelStandards'
import { getEventCategoryById, normalizeEventCategoryId } from '@/data/eventCategories'
import { RULE_LEVEL_OPTIONS } from '@/data/riskRulesMock'

/** 兜底：无法识别时使用「中」 */
export const FALLBACK_PUSH_LEVEL_FOR_EXTERNAL = 'medium'

/** 与平台一致的内部等级中文（仅此四种，不认「严重/一般」等别名） */
const PLATFORM_LEVEL_ZH = {
  低: 'low',
  中: 'medium',
  高: 'high',
  紧急: 'urgent'
}

export function getAllowedLevelKeysForCategory(categoryId) {
  const id = normalizeEventCategoryId(categoryId)
  const row = getEventCategoryById(id)
  if (!row?.allowedLevels?.length) return [...DEFAULT_ALLOWED_LEVEL_KEYS]
  return normAllowed(row.allowedLevels)
}

export function getAllowedRuleLevelValuesForCategory(categoryId) {
  return getAllowedLevelKeysForCategory(categoryId)
    .map((k) => EVENT_LEVEL_META[k].ruleLevelValue)
    .filter((v) => v != null)
}

export function getRuleLevelOptionsForCategory(categoryId) {
  const allowed = new Set(getAllowedRuleLevelValuesForCategory(categoryId))
  const opts = RULE_LEVEL_OPTIONS.filter((o) => allowed.has(o.value))
  return opts.length ? opts : RULE_LEVEL_OPTIONS
}

export function isRuleLevelValueAllowedForCategory(categoryId, ruleLevelValue) {
  return getAllowedRuleLevelValuesForCategory(categoryId).includes(ruleLevelValue)
}

export function coerceRuleLevelValueForCategory(categoryId, preferredValue) {
  if (preferredValue != null && isRuleLevelValueAllowedForCategory(categoryId, preferredValue)) {
    return preferredValue
  }
  const vals = getAllowedRuleLevelValuesForCategory(categoryId)
  return vals[0] ?? 3
}

/**
 * 接收接口 original_level（可选）：仅接受平台四档英文字符串或与之一致的中文；
 * 空或无法识别则 medium。
 * @returns {{ pushLevel: string, internalKey: string, matched: boolean, reason?: string }}
 */
export function resolveThirdPartyOriginalToPushLevel(categoryIdOrName, raw) {
  const id = normalizeEventCategoryId(categoryIdOrName)
  const text = raw == null ? '' : String(raw).trim()

  if (!text) {
    console.warn('[event-level] third-party empty original_level → medium', { categoryId: id })
    return {
      pushLevel: FALLBACK_PUSH_LEVEL_FOR_EXTERNAL,
      internalKey: 'medium',
      matched: false,
      reason: 'empty'
    }
  }

  const lower = text.toLowerCase()
  if (['low', 'medium', 'high', 'urgent'].includes(lower) && isValidLevelKey(lower)) {
    return {
      pushLevel: EVENT_LEVEL_META[lower].pushLevel,
      internalKey: lower,
      matched: true
    }
  }

  const fromZh = PLATFORM_LEVEL_ZH[text]
  if (fromZh) {
    return {
      pushLevel: EVENT_LEVEL_META[fromZh].pushLevel,
      internalKey: fromZh,
      matched: true
    }
  }

  console.warn('[event-level] third-party unknown original_level → medium', {
    categoryId: id,
    original: text
  })
  return {
    pushLevel: FALLBACK_PUSH_LEVEL_FOR_EXTERNAL,
    internalKey: 'medium',
    matched: false,
    reason: 'unmapped'
  }
}
