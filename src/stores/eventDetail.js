import { defineStore } from 'pinia'

export const useEventDetailStore = defineStore('eventDetail', {
  state: () => ({
    /** 是否显示事件详情抽屉 */
    visible: false,
    /** 事件 ID（如 evt-240424001） */
    eventId: null
  }),
  actions: {
    openById(id) {
      if (!id) return
      this.eventId = String(id)
      this.visible = true
    },
    close() {
      this.visible = false
      this.eventId = null
    }
  }
})
