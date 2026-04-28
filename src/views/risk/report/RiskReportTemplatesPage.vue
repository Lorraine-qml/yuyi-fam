<template>
  <div>
    <p class="text-sm text-gray-500 mb-4">
      系统预置模板（tenant_id=0）全项目可见；可复制为「本项目模板」后修改。项目模板仅当前项目可用。
    </p>
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
        <el-table-column label="来源" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isSystem || row.tenant_id === 0" type="info" size="small" effect="plain">
              系统
            </el-tag>
            <el-tag v-else type="success" size="small" effect="plain">项目</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="88">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.isSystem || row.tenant_id === 0"
              link
              type="primary"
              @click="copySystemTemplate(row)"
            >
              复制为项目
            </el-button>
            <el-button
              v-else
              link
              type="primary"
              @click="openTemplateEdit(row)"
              >编辑</el-button
            >
            <el-button
              v-if="!(row.isSystem || row.tenant_id === 0)"
              link
              type="danger"
              @click="removeTemplate(row)"
              >删除</el-button
            >
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
  copySystemTemplate,
  removeTemplate
} = useRiskReportShared()
</script>
