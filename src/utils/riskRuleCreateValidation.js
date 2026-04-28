/**
 * 新建/复制规则前的校验：同名校验、同一指标下仅允许一条「启用」规则
 */

/**
 * @param {Array<{ name: string, metricCode: string, status: string, deleted?: boolean }>} rules
 * @param {{ name: string, metricCode: string }} payload
 * @param {{ excludeRuleId?: string }} [opt]
 * @returns {{ ok: true } | { ok: false, code: 'dupName', suggestedName: string } | { ok: false, code: 'metricConflict', row: object }}
 */
export function validateNewRule(rules, payload, opt = {}) {
  const name = (payload.name || '').trim()
  const metric = (payload.metricCode || '').trim()
  const active = (rules || []).filter((r) => !r.deleted)
  const exclude = opt.excludeRuleId

  const nameDup = active.find(
    (r) => r.id !== exclude && (r.name || '').trim() === name
  )
  if (nameDup) {
    return {
      ok: false,
      code: 'dupName',
      suggestedName: suggestUniqueRuleName(name, active, exclude)
    }
  }

  const metricConflict = active.find(
    (r) => r.id !== exclude && r.metricCode === metric && r.status === 'enabled'
  )
  if (metricConflict) {
    return { ok: false, code: 'metricConflict', row: metricConflict }
  }

  return { ok: true }
}

function suggestUniqueRuleName(base, active, excludeId) {
  const names = new Set(
    active.filter((r) => r.id !== excludeId).map((r) => (r.name || '').trim())
  )
  if (!names.has(base)) return base
  let n = 2
  let c = `${base}_${n}`
  while (names.has(c)) {
    n += 1
    c = `${base}_${n}`
  }
  return c
}
