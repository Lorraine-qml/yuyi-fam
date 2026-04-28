/**
 * 兼容层：新数据见 workOrderMock.js
 */
export {
  WO_STATUS,
  RISK_LEVEL_META,
  getEventContextForOrder
} from '@/data/workOrderMock'

import { getWorkOrderSeed } from '@/data/workOrderMock'

export function getRepairWorkOrderSeed() {
  return getWorkOrderSeed()
    .filter((r) => r.category === 'risk')
    .map((r) => ({ ...r, eventSummary: r.summary, woType: '风险处置' }))
}
