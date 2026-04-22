import request from '@/utils/request'

export const getRiskDashboard = (params) => request({ url: '/risk/dashboard', method: 'get', params })

export const getRiskList = (params) => request({ url: '/risk/rules', method: 'get', params })

export const createRule = (data) => request({ url: '/risk/rule', method: 'post', data })
