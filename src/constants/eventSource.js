/** 与后端 event.source、notification_message 扩展字段统一 */
export const EVENT_SOURCE = {
  RULE: 'rule',
  THIRD_PARTY: 'third_party',
  MANUAL: 'manual'
}

export const EVENT_SOURCE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'rule', label: '规则预警' },
  { value: 'third_party', label: '第三方推送' },
  { value: 'manual', label: '人工创建' }
]

/** 列表/徽章展示用文案 */
export function eventSourceLabel(source) {
  const m = {
    rule: '规则预警',
    third_party: '第三方推送',
    manual: '人工创建'
  }
  return m[source] || source || '—'
}

/** 消息抽屉等：短标签 + 是否展示 ⚡ */
export function eventSourceShortLabel(source) {
  return source === 'rule' ? '⚡规则触发' : eventSourceLabel(source)
}

/** 事件推送配置 · 适用来源（与后端 applicable_source 对齐） */
export const APPLICABLE_SOURCE = {
  ALL: 'all',
  RULE_ONLY: 'rule_only',
  THIRD_PARTY_ONLY: 'third_party_only',
  MANUAL_ONLY: 'manual_only'
}

export const APPLICABLE_SOURCE_OPTIONS = [
  { value: APPLICABLE_SOURCE.ALL, label: '全部来源' },
  { value: APPLICABLE_SOURCE.RULE_ONLY, label: '仅规则触发' },
  { value: APPLICABLE_SOURCE.THIRD_PARTY_ONLY, label: '仅第三方推送' },
  { value: APPLICABLE_SOURCE.MANUAL_ONLY, label: '仅人工录入' }
]

export const APPLICABLE_SOURCE_FILTER_OPTIONS = [
  { value: '', label: '全部' },
  ...APPLICABLE_SOURCE_OPTIONS
]

export function applicableSourceLabel(key) {
  const m = {
    all: '全部来源',
    rule_only: '仅规则触发',
    third_party_only: '仅第三方推送',
    manual_only: '仅人工录入'
  }
  return m[key] || key || '—'
}
