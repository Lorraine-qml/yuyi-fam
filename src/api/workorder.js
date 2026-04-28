import request from '@/utils/request'
import { getCurrentProjectId } from '@/composables/useCurrentProject'
import * as nm from '@/mocks/notificationMessageMock'

const USE_MOCK = import.meta.env.VITE_MOCK_NOTIFICATIONS !== '0'

function tid() {
  return getCurrentProjectId()
}

/**
 * 无工单时由事件创建工单
 * @param {string} eventId
 * @returns {Promise<{ code: number, data: { workorderId: string } }>}
 */
export function createWorkorderFromEvent(eventId) {
  if (USE_MOCK) {
    const data = nm.createWorkorderFromEvent(tid(), eventId)
    return Promise.resolve({ code: 200, data })
  }
  return request({ url: `/workorder/create-from-event/${eventId}`, method: 'post' })
}
