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
        name: 'Security',
        component: ModulePlaceholder,
        meta: { title: '安全管理', subtitle: '消防、安防、监控（建设中）' }
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
