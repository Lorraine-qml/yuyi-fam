<template>
  <div class="sec-notify-method-page space-y-4">
    <h1 class="text-xl font-bold text-gray-800">通知方式配置</h1>

    <div
      class="rounded-xl border bg-white p-4 shadow-sm"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-3" @submit.prevent>
        <el-form-item label="配置名称" class="!mb-0">
          <el-input v-model="filters.name" placeholder="关键字" clearable class="!w-44" />
        </el-form-item>
        <el-form-item label="通知类型" class="!mb-0">
          <el-select v-model="filters.type" placeholder="全部" clearable class="!w-36">
            <el-option label="全部" value="" />
            <el-option label="钉钉" value="ding" />
            <el-option label="短信" value="sms" />
            <el-option label="邮件" value="mail" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" class="!mb-0">
          <el-select v-model="filters.testStatus" placeholder="全部" clearable class="!w-32">
            <el-option label="全部" value="" />
            <el-option label="未测试" value="untested" />
            <el-option label="良好" value="ok" />
            <el-option label="失败" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div
      class="rounded-xl border bg-white p-0 shadow-sm overflow-hidden"
      style="border-color: var(--yw-border)"
    >
      <div class="flex items-center justify-between gap-2 px-4 py-3 border-b" style="border-color: var(--yw-border)">
        <el-dropdown trigger="click" @command="() => ElMessage.info('选择新增类型（演示）')">
          <el-button type="primary">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增通知方式
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>钉钉</el-dropdown-item>
              <el-dropdown-item>短信</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button :icon="Refresh" text @click="onSearch" />
      </div>

      <el-table :data="pagedRows" border stripe @selection-change="() => {}">
        <el-table-column type="selection" width="48" />
        <el-table-column type="index" label="#" width="50" align="center" />
        <el-table-column prop="name" label="配置名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="typeLabel" label="通知类型" min-width="120" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.testStatus === 'untested'" type="info" size="small">未测试</el-tag>
            <el-tag v-else-if="row.testStatus === 'fail'" type="danger" size="small">失败</el-tag>
            <el-tag v-else type="success" size="small">良好</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastTest" label="最后测试时间" width="180" />
        <el-table-column prop="updater" label="更新人" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default>
            <el-button type="primary" link size="small" @click="ElMessage.info('详情（演示）')">详情</el-button>
            <el-button type="primary" link size="small" @click="ElMessage.info('编辑（演示）')">编辑</el-button>
            <el-button type="success" link size="small" @click="ElMessage.success('测试（演示）')">测试</el-button>
            <el-button type="danger" link size="small" @click="ElMessage.info('删除（演示）')">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end p-4 border-t" style="border-color: var(--yw-border)">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ArrowDown, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const filters = ref({ name: '', type: '', testStatus: '' })
const page = ref(1)
const pageSize = ref(10)

const mock = ref([
  {
    id: 1,
    name: '主楼消防钉钉组',
    type: 'ding',
    typeLabel: '钉钉通知',
    testStatus: 'ok',
    lastTest: '2026-04-20 10:00:00',
    updater: '管理员'
  },
  {
    id: 2,
    name: '短信值班号',
    type: 'sms',
    typeLabel: '短信',
    testStatus: 'untested',
    lastTest: '—',
    updater: '张三'
  },
  {
    id: 3,
    name: '园区运维邮件',
    type: 'mail',
    typeLabel: '邮件',
    testStatus: 'fail',
    lastTest: '2026-04-18 09:00:00',
    updater: '李四'
  },
  {
    id: 4,
    name: '访客通道钉钉',
    type: 'ding',
    typeLabel: '钉钉通知',
    testStatus: 'ok',
    lastTest: '2026-04-19 11:00:00',
    updater: '王五'
  }
])

const filtered = computed(() => {
  return mock.value.filter((r) => {
    if (filters.value.name && !r.name.includes(filters.value.name)) return false
    if (filters.value.type) {
      const t = { ding: '钉钉', sms: '短信', mail: '邮件' }[filters.value.type]
      if (r.typeLabel !== t) return false
    }
    if (filters.value.testStatus && r.testStatus !== filters.value.testStatus) return false
    return true
  })
})

const total = computed(() => filtered.value.length)
const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function onSearch() {
  page.value = 1
  ElMessage.success('已搜索（演示）')
}
function onReset() {
  filters.value = { name: '', type: '', testStatus: '' }
  page.value = 1
}
</script>
