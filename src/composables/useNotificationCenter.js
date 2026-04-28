import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getNotificationUnreadCount,
  getNotificationMessages,
  markNotificationRead,
  markAllNotificationsRead
} from '@/api/notification'
import { createWorkorderFromEvent as postCreateWorkorderFromEvent } from '@/api/workorder'

export const PAGE_SIZE = 20
const POLL_MS = 30_000

export const unreadCount = ref(0)
let lastPolledCount = 0
let pollTimer = null
let hubStarted = false

function onProjectChanged() {
  lastPolledCount = 0
  refreshUnreadCount(true)
}

/**
 * 在应用壳（AppLayout）中调用一次：首次拉取未读、项目切换刷新、轮询、轻提示
 */
export function startNotificationHub() {
  if (!hubStarted) {
    hubStarted = true
    window.addEventListener('yuyi-project-changed', onProjectChanged)
  }
  if (pollTimer) clearInterval(pollTimer)
  refreshUnreadCount(true)
  pollTimer = window.setInterval(() => {
    refreshUnreadCount(false)
  }, POLL_MS)
}

export async function refreshUnreadCount(silent) {
  try {
    const res = await getNotificationUnreadCount()
    const n = res?.data?.count ?? 0
    if (!silent && lastPolledCount > 0 && n > lastPolledCount) {
      const d = n - lastPolledCount
      ElMessage.info(d === 1 ? '您有1条新的预警消息' : `您有${d}条新的预警消息`)
    }
    lastPolledCount = n
    unreadCount.value = n
  } catch {
    /* 拦截器已提示 */
  }
}

export async function loadNotificationsPage(params) {
  const res = await getNotificationMessages({
    page: params.page ?? 1,
    size: params.size ?? PAGE_SIZE,
    level: params.level,
    keyword: params.keyword,
    filter: params.filter ?? 'all',
    source: params.source
  })
  return res.data
}

export async function markMessageRead(id) {
  await markNotificationRead(id)
  await refreshUnreadCount(true)
}

export async function markAllMessagesRead() {
  await markAllNotificationsRead()
  await refreshUnreadCount(true)
}

export function createWorkorderFromEvent(eventId) {
  return postCreateWorkorderFromEvent(eventId)
}

export function useNotificationCenter() {
  return {
    unreadCount,
    refreshUnreadCount,
    loadNotificationsPage,
    markMessageRead,
    markAllMessagesRead,
    createWorkorderFromEvent
  }
}
