<template>
  <div class="risk-report-layout">
    <div class="flex flex-col gap-3 mb-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">{{ pageTitle }}</h1>
          <p class="text-sm text-gray-500 mt-1">
            当前项目：<span class="font-medium text-indigo-700">{{ currentProject?.name || '—' }}</span>
            · 报告模板、定时任务与历史均按项目隔离
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-button @click="exportProjectConfig">
            <el-icon class="mr-1"><FolderOpened /></el-icon>
            导出报告配置
          </el-button>
        </div>
      </div>
      <div
        class="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-gray-100/80"
        role="tablist"
        aria-label="风险报告子模块"
      >
        <router-link
          v-for="tab in subTabs"
          :key="tab.name"
          :to="{ name: tab.name }"
          custom
          v-slot="{ navigate, isActive }"
        >
          <el-button
            :type="isActive ? 'primary' : 'default'"
            size="small"
            class="!border-0"
            @click="navigate"
          >
            {{ tab.label }}
          </el-button>
        </router-link>
      </div>
    </div>

    <router-view />

    <RiskReportTemplateDialog
      v-model:visible="tplDialogVisible"
      :mode="tplDialogMode"
      :record="editingTemplate"
      @saved="onTemplateSaved"
    />

    <RiskReportScheduleDialog
      v-model:visible="schDialogVisible"
      :mode="schDialogMode"
      :record="editingSchedule"
      :template-options="visibleTemplates"
      @saved="onScheduleSaved"
    />

    <el-dialog v-model="pushDialog" title="报告推送" width="420px">
      <p class="text-sm text-gray-600 mb-3">选择推送渠道（演示将模拟发送）：</p>
      <el-checkbox v-model="pushChannels.email">邮件</el-checkbox>
      <el-checkbox v-model="pushChannels.ding">钉钉工作通知</el-checkbox>
      <el-checkbox v-model="pushChannels.wecom">企业微信</el-checkbox>
      <el-input v-model="pushTargets" class="mt-3" placeholder="接收邮箱或账号" />
      <template #footer>
        <el-button @click="pushDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmPush">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { FolderOpened } from '@element-plus/icons-vue'
import { useCurrentProject } from '@/composables/useCurrentProject'
import RiskReportScheduleDialog from '@/components/risk/RiskReportScheduleDialog.vue'
import RiskReportTemplateDialog from '@/components/risk/RiskReportTemplateDialog.vue'
import { useRiskReportShared, reloadReportState } from './riskReportShared'

const route = useRoute()
const { currentProject } = useCurrentProject()

const {
  tplDialogVisible,
  tplDialogMode,
  editingTemplate,
  schDialogVisible,
  schDialogMode,
  editingSchedule,
  visibleTemplates,
  pushDialog,
  pushChannels,
  pushTargets,
  exportProjectConfig,
  confirmPush,
  onTemplateSaved,
  onScheduleSaved
} = useRiskReportShared()

const subTabs = [
  { name: 'RiskReportCenter', label: '报告中心' },
  { name: 'RiskReportTemplates', label: '模板管理' },
  { name: 'RiskReportSchedules', label: '定时任务' }
]

const pageTitle = computed(() => {
  const leaf = route.matched.filter((r) => r.meta?.title).pop()
  return leaf?.meta?.title || '风险报告'
})

watch(
  () => currentProject.value?.id,
  () => reloadReportState()
)
</script>
