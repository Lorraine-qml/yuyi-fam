/**
 * 风险报告数据按项目持久化：模板（仅项目自建部分）、定时任务、我的报告、任务执行日志
 * 系统级模板从 getSystemReportTemplates 注入，不写入本存储
 */
import { seedReportHistory, seedScheduleTasks } from './riskReportMock'
import { seedScheduleExecutionLogs } from './scheduleExecutionMock'

const KEY = (projectId) => `yuyi-risk-report-proj-${projectId}`

function defaultState(systemTemplates) {
  const schedules = seedScheduleTasks(systemTemplates)
  return {
    projectTemplates: [],
    schedules,
    myReports: seedReportHistory(systemTemplates),
    scheduleExecutionLogs: seedScheduleExecutionLogs(schedules)
  }
}

export function loadReportState(projectId, systemTemplates) {
  if (!projectId) {
    return defaultState(systemTemplates)
  }
  try {
    const raw = localStorage.getItem(KEY(projectId))
    if (!raw) {
      return defaultState(systemTemplates)
    }
    const o = JSON.parse(raw)
    if (!o || typeof o !== 'object') return defaultState(systemTemplates)

    const schedules = Array.isArray(o.schedules) ? o.schedules : seedScheduleTasks(systemTemplates)

    return {
      projectTemplates: Array.isArray(o.projectTemplates) ? o.projectTemplates : [],
      schedules,
      myReports: Array.isArray(o.myReports) ? o.myReports : seedReportHistory(systemTemplates),
      scheduleExecutionLogs: Array.isArray(o.scheduleExecutionLogs)
        ? o.scheduleExecutionLogs
        : []
    }
  } catch {
    return defaultState(systemTemplates)
  }
}

export function saveReportState(projectId, state) {
  if (!projectId) return
  try {
    localStorage.setItem(
      KEY(projectId),
      JSON.stringify({
        projectTemplates: state.projectTemplates,
        schedules: state.schedules,
        myReports: state.myReports,
        scheduleExecutionLogs: state.scheduleExecutionLogs
      })
    )
  } catch {
    /* ignore */
  }
}
