<template>
  <el-drawer
    :model-value="modelValue"
    :size="drawerSize"
    direction="rtl"
    destroy-on-close
    class="message-center-drawer"
    :append-to-body="true"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <template #header>
      <div class="mc-header flex flex-wrap items-center justify-between gap-2 w-full pr-1">
        <h2 class="mc-header__title m-0 text-base font-semibold text-gray-900">
          预警消息
          <span v-if="unreadCount > 0" class="font-normal text-gray-600">
            （{{ unreadLabel }}条未读）
          </span>
        </h2>
        <el-button type="primary" link class="!px-1" :disabled="!unreadCount" @click="onMarkAllRead">
          全部标为已读
        </el-button>
      </div>
    </template>

    <div class="mc-body flex flex-col h-full min-h-0">
      <!-- 紧凑筛选行 -->
      <div class="mc-toolbar shrink-0 px-1 pb-3 border-b border-gray-200">
        <div class="flex flex-wrap items-center gap-2">
          <el-radio-group
            v-model="filter"
            size="small"
            class="mc-filter-seg"
            @change="onFilterChange"
          >
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="unread">未读</el-radio-button>
            <el-radio-button label="processing">处理中</el-radio-button>
            <el-radio-button label="closed">已闭环</el-radio-button>
          </el-radio-group>
          <el-select
            v-model="level"
            size="small"
            clearable
            placeholder="等级"
            class="mc-level-select"
            @change="onFilterChange"
          >
            <el-option label="全部等级" value="" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
          <el-select
            v-model="sourceFilter"
            size="small"
            clearable
            placeholder="事件来源"
            class="!w-[118px]"
            @change="onFilterChange"
          >
            <el-option label="全部来源" value="" />
            <el-option label="仅规则预警" value="rule" />
            <el-option label="第三方推送" value="third_party" />
            <el-option label="人工创建" value="manual" />
          </el-select>
          <el-input
            v-model="keyword"
            size="small"
            clearable
            class="mc-search flex-1 min-w-[160px]"
            placeholder="搜索标题、内容或位置"
            :prefix-icon="Search"
            @input="onKeywordInput"
          />
        </div>
      </div>

      <div
        ref="scrollRef"
        v-infinite-scroll="onInfiniteLoad"
        class="mc-scroll flex-1 min-h-0 overflow-y-auto px-1 py-2"
        :infinite-scroll-disabled="infiniteDisabled"
        :infinite-scroll-distance="80"
        :infinite-scroll-immediate="false"
      >
        <ul v-if="records.length" class="m-0 p-0 list-none">
          <li
            v-for="m in records"
            :key="m.id"
            class="mc-card rounded-lg border border-gray-200 mb-3 last:mb-0 cursor-pointer transition-shadow bg-white"
            :class="m.isRead ? 'mc-card--read' : 'mc-card--unread'"
            @click="onCardClick(m)"
          >
            <div class="mc-card__inner">
              <!-- 第 1 行：等级（圆点+文字）| 标题 + 时间同排右对齐 -->
              <div class="flex items-start gap-2 min-w-0 w-full">
                <div :class="['mc-level', levelLineClass(m.level)]">
                  <span class="mc-level__dot" aria-hidden="true" />
                  <span class="mc-level__text">{{ levelLabel(m.level) }}风险</span>
                </div>
                <div class="flex-1 min-w-0 flex items-start justify-between gap-3">
                  <h3
                    class="mc-title m-0 min-w-0 flex-1 break-words font-bold leading-snug text-[#1F2937]"
                  >
                    {{ m.title }}
                  </h3>
                  <time class="mc-time shrink-0 whitespace-nowrap text-xs text-[#9CA3AF] leading-[1.25]">
                    {{ formatMessageTime(m.createTime) }}
                  </time>
                </div>
              </div>

              <p v-if="m.content" class="mc-desc m-0 mt-2 text-[13px] leading-[1.5] text-[#6B7280] line-clamp-2">
                {{ m.content }}
              </p>

              <p
                v-if="m.location"
                class="mc-location m-0 mt-1.5 text-xs leading-snug text-[#6B7280]"
              >
                <span class="text-gray-400">位置：</span>{{ m.location }}
              </p>

              <div v-if="m.source" class="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  v-if="m.source === 'rule'"
                  class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800"
                  >⚡ 规则触发</span
                >
                <span
                  v-else
                  class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"
                  >{{ sourceLabel(m.source) }}</span
                >
                <span v-if="m.source === 'rule' && m.ruleName" class="text-xs text-gray-500"
                  >依据：{{ m.ruleName
                  }}<span v-if="m.metricName" class="text-gray-400"> / {{ m.metricName }}</span></span
                >
              </div>

              <div
                class="mc-footer mt-2 pt-2 flex items-center justify-between border-t border-gray-100"
              >
                <span
                  v-if="m.status"
                  :class="['mc-status', statusPillClass(m.status)]"
                  >{{ statusLabel(m.status) }}</span
                >
                <span v-else class="w-0 flex-1" />
                <div class="mc-actions flex items-center shrink-0" style="gap: 16px">
                  <el-button link type="primary" class="!p-0 !h-auto" @click.stop="onViewDetail(m)">
                    查看详情
                  </el-button>
                  <el-button
                    link
                    type="primary"
                    class="!p-0 !h-auto"
                    :loading="pendingWoId === m.id"
                    @click.stop="onProcessWorkorder(m)"
                  >
                    处理工单
                  </el-button>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else-if="!loading" class="text-center text-gray-400 text-sm py-12 m-0">暂无消息</p>
        <p v-if="loading && !records.length" class="text-center text-gray-400 text-sm py-8 m-0">加载中…</p>
        <p v-if="loading && records.length" class="text-center text-gray-400 text-xs py-2 m-0">加载中…</p>
        <p v-else-if="!hasMore && records.length" class="text-center text-gray-300 text-xs py-2 m-0">
          没有更多了
        </p>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { eventSourceLabel } from '@/constants/eventSource'
import { useEventDetailStore } from '@/stores/eventDetail'
import {
  loadNotificationsPage,
  markAllMessagesRead,
  markMessageRead,
  createWorkorderFromEvent,
  PAGE_SIZE,
  unreadCount
} from '@/composables/useNotificationCenter'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const eventDetailStore = useEventDetailStore()
const filter = ref('all')
const level = ref('')
const sourceFilter = ref('')
const keyword = ref('')
const records = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const scrollRef = ref(null)
const pendingWoId = ref(null)
const drawerSize = ref('450px')
let keywordTimer = null

const hasMore = computed(() => records.value.length < total.value)
const infiniteDisabled = computed(() => loading.value || !hasMore.value)

const unreadLabel = computed(() => {
  const n = unreadCount.value
  if (n > 99) return '99+'
  return String(n)
})

if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(max-width: 768px)')
  const apply = () => {
    drawerSize.value = mq.matches ? '100%' : '450px'
  }
  apply()
  mq.addEventListener('change', apply)
  window.addEventListener('yuyi-project-changed', onProjectRefresh)
  onBeforeUnmount(() => {
    mq.removeEventListener('change', apply)
    if (keywordTimer) clearTimeout(keywordTimer)
    window.removeEventListener('yuyi-project-changed', onProjectRefresh)
  })
}

function levelLineClass(lv) {
  if (lv === 'high') return 'mc-level--high'
  if (lv === 'medium') return 'mc-level--medium'
  if (lv === 'low') return 'mc-level--low'
  return 'mc-level--low'
}

function levelLabel(lv) {
  const m = { high: '高', medium: '中', low: '低' }
  return m[lv] || lv
}

function statusLabel(s) {
  const m = { pending: '待处理', processing: '处理中', closed: '已闭环' }
  return m[s] || s
}

function statusPillClass(s) {
  if (s === 'pending') return 'mc-status--pending'
  if (s === 'processing') return 'mc-status--processing'
  if (s === 'closed') return 'mc-status--closed'
  return 'mc-status--pending'
}

function formatMessageTime(s) {
  if (!s) return ''
  const d = new Date(String(s).replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return s
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const t = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return isToday ? `今天 ${t}` : `${d.getMonth() + 1}月${d.getDate()}日 ${t}`
}

function onInfiniteLoad() {
  loadPage(false)
}

async function loadPage(reset) {
  if (loading.value) return
  if (reset) {
    page.value = 0
    records.value = []
  }
  const next = reset ? 1 : page.value + 1
  loading.value = true
  try {
    const { total: t, records: rows } = await loadNotificationsPage({
      page: next,
      size: PAGE_SIZE,
      filter: filter.value,
      level: level.value ? level.value : undefined,
      keyword: keyword.value || undefined,
      source: sourceFilter.value || undefined
    })
    total.value = t
    if (reset) {
      records.value = rows
    } else {
      const ids = new Set(records.value.map((r) => r.id))
      for (const r of rows) {
        if (!ids.has(r.id)) records.value.push(r)
      }
    }
    page.value = next
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  loadPage(true)
}

function onKeywordInput() {
  if (keywordTimer) clearTimeout(keywordTimer)
  keywordTimer = setTimeout(() => {
    loadPage(true)
  }, 320)
}

function sourceLabel(s) {
  return eventSourceLabel(s)
}

function onCardClick(m) {
  goEventDetail(m)
}

function onViewDetail(m) {
  goEventDetail(m)
}

async function goEventDetail(m) {
  if (!m.isRead) {
    try {
      await markMessageRead(m.id)
    } catch {
      return
    }
    const i = records.value.findIndex((r) => r.id === m.id)
    if (i >= 0) records.value[i] = { ...m, isRead: true }
  }
  emit('update:modelValue', false)
  eventDetailStore.openById(m.eventId)
}

async function onProcessWorkorder(m) {
  if (!m.isRead) {
    try {
      await markMessageRead(m.id)
    } catch {
      return
    }
  }
  const i = records.value.findIndex((r) => r.id === m.id)
  if (i >= 0) records.value[i] = { ...m, isRead: true }
  if (m.workorderId) {
    emit('update:modelValue', false)
    router.push(`/workorder/detail/${encodeURIComponent(m.workorderId)}`)
    return
  }
  pendingWoId.value = m.id
  try {
    const res = await createWorkorderFromEvent(m.eventId)
    const wid = res?.data?.workorderId
    if (wid) {
      emit('update:modelValue', false)
      router.push(`/workorder/detail/${encodeURIComponent(wid)}`)
    } else {
      ElMessage.error('未获取到工单 ID')
    }
  } catch {
    /* 拦截器 */
  } finally {
    pendingWoId.value = null
  }
}

async function onMarkAllRead() {
  if (!unreadCount.value) return
  try {
    await markAllMessagesRead()
    await loadPage(true)
    ElMessage.success('已全部标为已读')
  } catch {
    /* */
  }
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) loadPage(true)
  }
)

function onProjectRefresh() {
  if (props.modelValue) loadPage(true)
}
</script>

<style scoped>
.mc-title {
  font-size: 15px;
}

/* 未读：左侧靛蓝竖条 + 极浅灰底 */
.mc-card--unread {
  background: #f9fafb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  border-left: 3px solid #4f46e5;
}

.mc-card--read {
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.mc-card__inner {
  padding: 12px 16px;
}

/* 等级：圆点 + 文字 */
.mc-level {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 2px;
}

.mc-level__dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.mc-level--high .mc-level__dot {
  background-color: #ef4444;
}
.mc-level--high .mc-level__text {
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
}
.mc-level--medium .mc-level__dot {
  background-color: #f59e0b;
}
.mc-level--medium .mc-level__text {
  color: #c2410c;
  font-size: 12px;
  font-weight: 600;
}
.mc-level--low .mc-level__dot {
  background-color: #22c55e;
}
.mc-level--low .mc-level__text {
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
}

/* 状态标签 */
.mc-status {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 500;
}
.mc-status--pending {
  background-color: #ffedd5;
  color: #9a3412;
}
.mc-status--processing {
  background-color: #dbeafe;
  color: #1d4ed8;
}
.mc-status--closed {
  background-color: #d1fae5;
  color: #047857;
}

:deep(.mc-filter-seg .el-radio-button__inner) {
  padding: 4px 10px;
  font-size: 12px;
}
:deep(.mc-level-select) {
  width: 100px;
}
</style>

<style>
/* 抽屉体：与 header 的间距 */
.message-center-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #e5e7eb;
}
.message-center-drawer .el-drawer__body {
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
