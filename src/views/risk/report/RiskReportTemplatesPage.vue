<template>
  <div>
    <div class="flex justify-end mb-4">
      <el-button type="primary" @click="openTemplateCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增模板
      </el-button>
    </div>
    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <el-table :data="visibleTemplates" size="small">
        <el-table-column prop="name" label="模板名称" min-width="160" />
        <el-table-column label="类型" width="88">
          <template #default="{ row }">{{ periodLabel(row.periodType) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTemplateEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeTemplate(row)">删除</el-button>
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
  visibleTemplates,
  periodLabel,
  openTemplateCreate,
  openTemplateEdit,
  removeTemplate
} = useRiskReportShared()
</script>
