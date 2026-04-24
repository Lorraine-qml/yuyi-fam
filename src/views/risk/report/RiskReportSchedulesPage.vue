<template>
  <div>
    <div class="flex justify-end mb-4">
      <el-button type="primary" @click="openScheduleCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增任务
      </el-button>
    </div>
    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <el-table :data="schedules" size="small">
        <el-table-column prop="name" label="任务名称" min-width="160" />
        <el-table-column prop="cycleLabel" label="周期" width="100" />
        <el-table-column prop="runTime" label="执行时间" width="88" />
        <el-table-column prop="lastRunAt" label="上次执行" min-width="140" />
        <el-table-column label="状态" width="88">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              class="mr-2 align-middle"
              inline-prompt
              active-text="启"
              inactive-text="停"
              @change="onScheduleToggle(row)"
            />
            <el-button link type="primary" @click="openScheduleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="runScheduleOnce(row)">执行</el-button>
            <el-button link type="danger" @click="removeSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import { useRiskReportShared } from './riskReportShared'

const {
  schedules,
  openScheduleCreate,
  openScheduleEdit,
  removeSchedule,
  runScheduleOnce,
  onScheduleToggle
} = useRiskReportShared()
</script>
