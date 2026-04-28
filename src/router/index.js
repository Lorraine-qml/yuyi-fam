import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import RouterPass from '@/layouts/RouterPass.vue'
import HomeDashboard from '@/views/HomeDashboard.vue'
import ModulePlaceholder from '@/views/ModulePlaceholder.vue'
import RiskDashboard from '@/views/risk/RiskDashboard.vue'
import RiskMetricsPage from '@/views/risk/metrics/RiskMetricsPage.vue'
import RiskRulesPage from '@/views/risk/rules/RiskRulesPage.vue'
import RiskReportLayout from '@/views/risk/report/RiskReportLayout.vue'
import RiskReportCenter from '@/views/risk/report/RiskReportCenter.vue'
import RiskReportTemplatesPage from '@/views/risk/report/RiskReportTemplatesPage.vue'
import RiskReportSchedulesPage from '@/views/risk/report/RiskReportSchedulesPage.vue'
import RiskTrialLogsPage from '@/views/risk/trial-logs/RiskTrialLogsPage.vue'
import RealtimeEventsPage from '@/views/security/RealtimeEventsPage.vue'
import EventPushConfigPage from '@/views/security/EventPushConfigPage.vue'
import NotificationMethodConfigPage from '@/views/security/NotificationMethodConfigPage.vue'
import EventDetailDeepLink from '@/views/security/EventDetailDeepLink.vue'
import WorkOrderWorkbenchPage from '@/views/security/workbench/WorkOrderWorkbenchPage.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'HomeDashboard',
        component: HomeDashboard,
        meta: { title: '首页' }
      },
      {
        path: 'asset',
        name: 'Asset',
        component: ModulePlaceholder,
        meta: { title: '资产管理', subtitle: '资产台账、资产盘点（建设中）' }
      },
      {
        path: 'property',
        name: 'Property',
        component: ModulePlaceholder,
        meta: { title: '物业管理', subtitle: '工单、巡检、维保（建设中）' }
      },
      {
        path: 'operation',
        name: 'Operation',
        component: ModulePlaceholder,
        meta: { title: '运营管理', subtitle: '运营指标、报表（建设中）' }
      },
      {
        path: 'energy',
        name: 'Energy',
        component: ModulePlaceholder,
        meta: { title: '能源管理', subtitle: '水、电能耗监控（建设中）' }
      },
      {
        path: 'security',
        component: RouterPass,
        redirect: { name: 'SecurityRealtimeEvents' },
        children: [
          {
            path: 'events/realtime',
            name: 'SecurityRealtimeEvents',
            component: RealtimeEventsPage,
            meta: { title: '实时事件', subtitle: '事件列表、统计与处理' }
          },
          {
            path: 'events/push-config',
            name: 'SecurityEventPushConfig',
            component: EventPushConfigPage,
            meta: { title: '事件推送配置', subtitle: '分类、等级与通知方式' }
          },
          {
            path: 'events/notify-method',
            name: 'SecurityNotificationMethod',
            component: NotificationMethodConfigPage,
            meta: { title: '通知方式配置', subtitle: '渠道与连通性' }
          },
          {
            path: 'workbench/repair',
            name: 'SecurityWorkbenchRepair',
            component: WorkOrderWorkbenchPage,
            meta: {
              title: '报修工单',
              subtitle: '全量工单、筛选与调度',
              workOrderView: 'all'
            }
          },
          {
            path: 'workbench/todo',
            name: 'SecurityWorkbenchTodo',
            component: WorkOrderWorkbenchPage,
            meta: {
              title: '我的待办',
              subtitle: '待接单/处理中',
              workOrderView: 'todo'
            }
          },
          {
            path: 'workbench/initiated',
            name: 'SecurityWorkbenchInitiated',
            component: WorkOrderWorkbenchPage,
            meta: {
              title: '我发起的',
              subtitle: '本人发起与规则跟踪',
              workOrderView: 'initiated'
            }
          },
          {
            path: 'workbench/done',
            name: 'SecurityWorkbenchDone',
            component: WorkOrderWorkbenchPage,
            meta: {
              title: '我的已办',
              subtitle: '已处理未完全办结',
              workOrderView: 'done'
            }
          },
          {
            path: 'workbench/closed',
            name: 'SecurityWorkbenchClosed',
            component: WorkOrderWorkbenchPage,
            meta: {
              title: '办结事宜',
              subtitle: '已完成/已关闭归档',
              workOrderView: 'closed'
            }
          }
        ]
      },
      {
        path: 'system',
        component: RouterPass,
        redirect: '/system/user',
        children: [
          {
            path: 'user',
            name: 'SystemUser',
            component: ModulePlaceholder,
            meta: { title: '用户管理', subtitle: '账号与组织（建设中）' }
          },
          {
            path: 'role',
            name: 'SystemRole',
            component: ModulePlaceholder,
            meta: { title: '权限管理', subtitle: '角色与权限配置（建设中）' }
          },
          {
            path: 'log',
            name: 'SystemLog',
            component: ModulePlaceholder,
            meta: { title: '操作日志', subtitle: '审计与追溯（建设中）' }
          }
        ]
      },
      {
        path: 'profile',
        name: 'Profile',
        component: ModulePlaceholder,
        meta: { title: '个人中心', subtitle: '账号与偏好设置（建设中）' }
      },
      {
        path: 'event/detail/:id',
        name: 'EventDetail',
        component: EventDetailDeepLink,
        meta: { title: '实时事件详情', subtitle: '抽屉展示，不占用全页' }
      },
      {
        path: 'workorder/detail/:id',
        name: 'WorkorderDetail',
        component: ModulePlaceholder,
        meta: { title: '工单详情', subtitle: '工单处理与流转（建设中，由消息中心跳转）' }
      },
      {
        path: 'risk',
        component: RouterPass,
        redirect: { name: 'RiskDashboard' },
        children: [
          {
            path: 'dashboard',
            name: 'RiskDashboard',
            component: RiskDashboard,
            meta: { title: '风险看板' }
          },
          {
            path: 'metrics',
            name: 'RiskMetrics',
            component: RiskMetricsPage,
            meta: { title: '风险指标', subtitle: '指标定义、数据源与测试' }
          },
          {
            path: 'rules',
            name: 'RiskRules',
            component: RiskRulesPage,
            meta: { title: '风险规则', subtitle: '规则配置、试运行与版本' }
          },
          {
            path: 'report',
            component: RiskReportLayout,
            redirect: { name: 'RiskReportCenter' },
            meta: { title: '风险报告', subtitle: '模板、生成、定时任务与导出推送' },
            children: [
              {
                path: 'center',
                name: 'RiskReportCenter',
                component: RiskReportCenter,
                meta: { title: '报告中心' }
              },
              {
                path: 'templates',
                name: 'RiskReportTemplates',
                component: RiskReportTemplatesPage,
                meta: { title: '模板管理' }
              },
              {
                path: 'schedules',
                name: 'RiskReportSchedules',
                component: RiskReportSchedulesPage,
                meta: { title: '定时任务' }
              }
            ]
          },
          {
            path: 'trial-logs',
            name: 'RiskTrialLogs',
            component: RiskTrialLogsPage,
            meta: { title: '试运行日志', subtitle: '全局筛选、对比与批量导出' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
