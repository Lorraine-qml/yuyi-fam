import request from '@/utils/request'
import { getCurrentProjectId } from '@/composables/useCurrentProject'
import * as nm from '@/mocks/notificationMessageMock'

const USE_MOCK = import.meta.env.VITE_MOCK_NOTIFICATIONS !== '0'

function tid() {
  return getCurrentProjectId()
}

/**
 * @returns {Promise<{ code: number, data: { count: number } }>}
 */
export function getNotificationUnreadCount() {
  if (USE_MOCK) {
    return Promise.resolve({ code: 200, data: { count: nm.getUnreadCount(tid()) } })
  }
  return request({ url: '/notifications/unread-count', method: 'get' })
}

/**
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @param {string} [params.level] high|medium|low
 * @param {string} [params.keyword]
 * @param {string} [params.filter] all|unread|processing|closed
 */
export function getNotificationMessages(params) {
  if (USE_MOCK) {
    const p = { ...params }
    const { filter, ...rest } = p
    const scope = filter && filter !== 'all' ? filter : undefined
    const { total, records } = nm.getMessagePage(tid(), { ...rest, scope, source: p.source || undefined })
    return Promise.resolve({ code: 200, data: { total, records } })
  }
  return request({ url: '/notifications/messages', method: 'get', params })
}

export function markNotificationRead(id) {
  if (USE_MOCK) {
    nm.markAsRead(tid(), id)
    return Promise.resolve({ code: 200, data: null })
  }
  return request({ url: `/notifications/messages/${id}/read`, method: 'put' })
}

export function markAllNotificationsRead() {
  if (USE_MOCK) {
    nm.markAllRead(tid())
    return Promise.resolve({ code: 200, data: null })
  }
  return request({ url: '/notifications/read-all', method: 'put' })
}
