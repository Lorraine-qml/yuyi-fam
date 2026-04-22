import { defineStore } from 'pinia'
import { getRiskList, createRule, getRiskDashboard } from '@/api/risk'

export const useRiskStore = defineStore('risk', {
  state: () => ({
    rules: [],
    dashboard: {}
  }),
  actions: {
    async fetchRules(params) {
      const res = await getRiskList(params)
      this.rules = res.data || []
      return res
    },
    async fetchDashboard(params) {
      const res = await getRiskDashboard(params)
      this.dashboard = res.data || {}
      return res
    },
    async addRule(data) {
      return createRule(data)
    }
  }
})
