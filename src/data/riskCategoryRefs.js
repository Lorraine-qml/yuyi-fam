/**
 * 统计事件分类被「风险规则」「系统模板」「项目模板」「推送配置」引用次数（演示口径）。
 */
import { normalizeEventCategoryId } from './eventCategories'
import { getSharedRiskRules } from './riskRulesMock'
import { getSystemTemplates } from './riskSystemTemplates'
import { listAllProjectTemplatesAcrossProjects } from './riskProjectTemplates'
import { listEventPushConfigs } from './eventPushConfigMock'

function normCat(id) {
  return normalizeEventCategoryId(id)
}

/** 规则条数：与风险规则页的共享运行时列表一致 */
export function countRiskRulesUsingCategory(categoryId) {
  const id = normCat(categoryId)
  return getSharedRiskRules().filter((r) => !r.deleted && normCat(r.eventCategory) === id).length
}

export function countSystemTemplatesUsingCategory(categoryId) {
  const id = normCat(categoryId)
  return getSystemTemplates().filter((t) => normCat(t.eventCategory) === id).length
}

export function countProjectTemplatesUsingCategory(categoryId) {
  const id = normCat(categoryId)
  return listAllProjectTemplatesAcrossProjects().filter((t) => normCat(t.eventCategory) === id).length
}

export function countPushConfigsUsingCategory(categoryId) {
  const id = normCat(categoryId)
  return listEventPushConfigs().filter((r) => normCat(r.category) === id).length
}

/**
 * @returns {{ ruleCount: number, pushCount: number }}
 * ruleCount = 风险规则 + 系统规则模板 + 项目规则模板
 */
export function countReferencesForEventCategoryDelete(categoryId) {
  const ruleCount =
    countRiskRulesUsingCategory(categoryId) +
    countSystemTemplatesUsingCategory(categoryId) +
    countProjectTemplatesUsingCategory(categoryId)
  const pushCount = countPushConfigsUsingCategory(categoryId)
  return { ruleCount, pushCount }
}
