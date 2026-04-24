<template>
  <el-dialog
    :model-value="visible"
    :title="rule?.name ? `规则测试 - ${rule.name}` : '规则测试'"
    width="560px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <div v-if="rule" class="space-y-4">
      <div class="text-sm font-medium text-gray-700">测试方式</div>
      <el-radio-group v-model="testMode" size="small">
        <el-radio-button label="mock">模拟输入</el-radio-button>
        <el-radio-button label="backtest">历史数据回测</el-radio-button>
      </el-radio-group>

      <template v-if="testMode === 'mock'">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600 w-24">当前值</span>
          <el-input v-if="rule.valueType === 'string'" v-model="mockCurrent" class="w-48" />
          <el-input-number v-else v-model="mockCurrentNum" class="!w-48" />
          <span v-if="rule.primaryUnit" class="text-sm text-gray-500">{{ rule.primaryUnit }}</span>
        </div>
        <div v-if="rule.valueType !== 'string'" class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-600 w-24">昨日同期</span>
          <el-input-number v-model="mockLast" class="!w-48" />
        </div>
      </template>
      <template v-else>
        <el-alert type="info" :closable="false" show-icon>
          演示：将使用随机历史片段回测，结果仅供参考。
        </el-alert>
      </template>

      <el-button type="primary" size="small" @click="runTest">运行测试</el-button>

      <div
        v-if="result"
        class="rounded-lg border p-4 space-y-2 text-sm"
        style="border-color: var(--yw-border)"
      >
        <div class="flex items-center gap-2 font-medium">
          <span v-if="result.triggered">✅ 规则触发</span>
          <span v-else>○ 规则未触发</span>
        </div>
        <template v-if="result.triggered">
          <div>
            <span class="text-gray-500">触发等级：</span>
            <span class="font-medium" :style="{ color: result.levelColor }">{{ result.levelText }}</span>
          </div>
          <div><span class="text-gray-500">触发详情：</span>{{ result.detail }}</div>
          <div><span class="text-gray-500">事件分类：</span>{{ rule.eventCategory }}</div>
          <div v-if="rule.workOrderEnabled">
            <span class="text-gray-500">将生成工单：</span>{{ rule.workOrderType }}
          </div>
        </template>
        <div v-else class="text-gray-600">{{ result.detail }}</div>
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
      <el-button type="primary" @click="runTest">重新测试</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { RULE_LEVEL_OPTIONS } from '@/data/riskRulesMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  rule: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const testMode = ref('mock')
const mockCurrent = ref('不合格')
const mockCurrentNum = ref(45)
const mockLast = ref(30)
const result = ref(null)

const LEVEL_COLOR = { 1: '#EF4444', 2: '#F59E0B', 3: '#EAB308', 4: '#3B82F6' }

function evaluate(rule) {
  if (!rule) return null
  if (rule.expression?.startsWith('consecutive')) {
    return {
      triggered: false,
      detail: '连续触发类规则需在规则引擎中计算（演示未触发）'
    }
  }

  let v
  let last
  if (testMode.value === 'backtest') {
    mockCurrentNum.value = 35 + Math.floor(Math.random() * 20)
    mockLast.value = 25 + Math.floor(Math.random() * 15)
  }

  if (rule.valueType === 'string') {
    v = mockCurrent.value
    last = null
  } else {
    v = Number(mockCurrentNum.value)
    last = Number(mockLast.value)
  }

  const t = rule.valueType === 'string' ? String(rule.primaryValue) : Number(rule.primaryValue)
  const op = rule.primaryOp
  let ok = false
  if (rule.valueType === 'string') {
    if (op === '==') ok = v === t
    else if (op === '!=') ok = v !== t
    else ok = false
  } else {
    switch (op) {
      case '>':
        ok = v > t
        break
      case '<':
        ok = v < t
        break
      case '>=':
        ok = v >= t
        break
      case '<=':
        ok = v <= t
        break
      case '==':
        ok = v === t
        break
      case '!=':
        ok = v !== t
        break
      default:
        ok = false
    }
  }

  const levelOpt = RULE_LEVEL_OPTIONS.find((l) => l.value === rule.level) || RULE_LEVEL_OPTIONS[1]
  const levelNames = { 1: '严重', 2: '重要', 3: '一般', 4: '提示' }
  const levelText = `${levelOpt.labelShort}（${levelNames[rule.level] || ''}）`

  if (!ok) {
    return {
      triggered: false,
      detail:
        rule.valueType === 'string'
          ? `当前值「${v}」不满足条件 ${op} 「${t}」`
          : `当前值 ${v} 不满足 ${op} 阈值 ${t}${rule.primaryUnit ? rule.primaryUnit : ''}`
    }
  }

  const pct =
    last != null && last !== 0 && rule.valueType !== 'string'
      ? Math.round(((v - last) / last) * 100)
      : null
  const detail =
    pct != null
      ? `当前值 ${v}${rule.primaryUnit || ''} ${op} 阈值 ${t}，较昨日同期 ${last} 变化 ${pct >= 0 ? '+' : ''}${pct}%`
      : `当前值 ${v}${rule.primaryUnit || ''} ${op} 阈值 ${t}，条件成立`

  return {
    triggered: true,
    levelText,
    levelColor: LEVEL_COLOR[rule.level] || '#F59E0B',
    detail
  }
}

function runTest() {
  result.value = evaluate(props.rule)
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.rule) {
      testMode.value = 'mock'
      result.value = null
      if (props.rule.valueType === 'string') {
        mockCurrent.value = String(props.rule.primaryValue)
      } else if (props.rule.name?.includes('突增')) {
        mockCurrentNum.value = 45
        mockLast.value = 30
      } else {
        mockCurrentNum.value = Number(props.rule.primaryValue) + 5
        mockLast.value = Number(props.rule.primaryValue) - 2
      }
    }
  }
)
</script>
