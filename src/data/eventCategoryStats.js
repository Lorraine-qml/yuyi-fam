/**
 * 事件分类维度统计（演示）：与列表「关联规则数 / 关联事件数」口径一致。
 * 关联规则：风险规则表中启用 + 正式运行（试运行不计入）。
 * 关联事件：近 N 天内分类下事件条数（与实时事件列表筛选对齐）。
 */

import { normalizeEventCategoryId } from './eventCategories'
import { getSharedRiskRules } from './riskRulesMock'
import { REALTIME_EVENTS } from './realtimeEventsMock'

/** 与 RealtimeEventsPage 演示锚点一致 */
export const EVENT_STATS_ANCHOR_END = new Date('2026-04-28T23:59:59')

export function isRuleCountedForCategoryAssociation(rule) {
  return Boolean(
    rule &&
      !rule.deleted &&
      rule.status === 'enabled' &&
      rule.runMode === 'production'
  )
}

/** 列表「关联规则数」及删除校验的规则引用口径 */
export function listAssociatedProductionRules(categoryId) {
  const id = normalizeEventCategoryId(categoryId)
  return getSharedRiskRules().filter((r) => {
    if (!isRuleCountedForCategoryAssociation(r)) return false
    return normalizeEventCategoryId(r.eventCategory) === id
  })
}

export function countAssociatedProductionRules(categoryId) {
  return listAssociatedProductionRules(categoryId).length
}

export function filterEventsForCategoryLastNDays(categoryId, days = 30, anchorEnd = EVENT_STATS_ANCHOR_END) {
  const id = normalizeEventCategoryId(categoryId)
  const end = anchorEnd instanceof Date ? anchorEnd : new Date(anchorEnd)
  const start = new Date(end)
  start.setDate(start.getDate() - days)

  return REALTIME_EVENTS.filter((e) => {
    if (normalizeEventCategoryId(e.categoryId) !== id) return false
    const t = new Date(String(e.startTime || '').replace(' ', 'T'))
    if (Number.isNaN(t.getTime())) return false
    return t >= start && t <= end
  })
}

export function countEventsLastNDays(categoryId, days = 30) {
  return filterEventsForCategoryLastNDays(categoryId, days).length
}

/** 历史事件总量（删除确认提示用，不限 30 天） */
export function countAllEventsForCategory(categoryId) {
  const id = normalizeEventCategoryId(categoryId)
  return REALTIME_EVENTS.filter((e) => normalizeEventCategoryId(e.categoryId) === id).length
}
