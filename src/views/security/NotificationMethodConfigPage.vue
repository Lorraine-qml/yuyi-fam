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
            <el-option label="邮件" value="mail" />
            <el-option label="企业微信" value="wework" />
            <el-option label="短信" value="sms" />
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
      <div
        class="flex items-center justify-between gap-2 px-4 py-3 border-b"
        style="border-color: var(--yw-border)"
      >
        <el-dropdown trigger="click" @command="onCreateCommand">
          <el-button type="primary">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增通知方式
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="ding">钉钉</el-dropdown-item>
              <el-dropdown-item command="mail">邮件（SMTP）</el-dropdown-item>
              <el-dropdown-item command="wework">企业微信</el-dropdown-item>
              <el-dropdown-item command="sms">短信</el-dropdown-item>
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
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.testStatus === 'untested'" type="info" size="small">未测试</el-tag>
            <el-tag v-else-if="row.testStatus === 'fail'" type="danger" size="small">失败</el-tag>
            <el-tag v-else type="success" size="small">良好</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastTest" label="最后测试时间" width="180" />
        <el-table-column prop="updater" label="更新人" width="100" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="onTest(row)">测试</el-button>
            <el-button type="danger" link size="small" @click="onDelete(row)">删除</el-button>
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

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="420px" destroy-on-close>
      <el-form ref="drawerFormRef" :model="drawerForm" :rules="drawerRules" label-width="108px">
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="drawerForm.name" maxlength="80" show-word-limit placeholder="名称" />
        </el-form-item>
        <el-form-item label="通知类型">
          <el-input :model-value="NOTIFY_TYPE_META[drawerForm.type]?.label || drawerForm.type" disabled />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="drawerForm.enabled" />
        </el-form-item>

        <template v-if="drawerForm.type === 'mail'">
          <el-form-item label="SMTP 服务器" prop="smtpHost">
            <el-input v-model="drawerForm.smtpHost" placeholder="如 smtp.example.com" />
          </el-form-item>
          <el-form-item label="端口" prop="smtpPort">
            <el-input-number v-model="drawerForm.smtpPort" :min="1" :max="65535" class="!w-full" />
          </el-form-item>
          <el-form-item label="SSL/TLS">
            <el-switch v-model="drawerForm.smtpSsl" active-text="开启" inactive-text="关闭" />
          </el-form-item>
          <el-form-item label="账号" prop="smtpUser">
            <el-input v-model="drawerForm.smtpUser" placeholder="SMTP 登录账号" />
          </el-form-item>
          <el-form-item label="密码" prop="smtpPassword">
            <el-input
              v-model="drawerForm.smtpPassword"
              type="password"
              show-password
              placeholder="留空则不修改（演示）"
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item label="发件人邮箱" prop="smtpFrom">
            <el-input v-model="drawerForm.smtpFrom" placeholder="From 地址" />
          </el-form-item>
        </template>

        <template v-else-if="drawerForm.type === 'ding' || drawerForm.type === 'wework'">
          <el-form-item label="Webhook URL" prop="webhookUrl">
            <el-input v-model="drawerForm.webhookUrl" type="textarea" :rows="3" placeholder="机器人 Webhook" />
          </el-form-item>
        </template>

        <template v-else-if="drawerForm.type === 'sms'">
          <p class="text-xs text-gray-500 -mt-2 mb-4">短信网关参数由后端接入，此处仅保存展示名称（演示）。</p>
        </template>
      </el-form>
      <div class="flex justify-end gap-2 mt-6">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDrawer">保存</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ArrowDown, Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  NOTIFY_TYPE_META,
  deleteNotificationMethod,
  notificationMethodStore,
  upsertNotificationMethod
} from '@/data/notificationMethodMock'

const filters = ref({ name: '', type: '', testStatus: '' })
const page = ref(1)
const pageSize = ref(10)

const filtered = computed(() => {
  return notificationMethodStore.list.filter((r) => {
    if (filters.value.name && !r.name.includes(filters.value.name)) return false
    if (filters.value.type && r.type !== filters.value.type) return false
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
}

function onReset() {
  filters.value = { name: '', type: '', testStatus: '' }
  page.value = 1
}

const drawerVisible = ref(false)
const drawerMode = ref('create')
const drawerFormRef = ref(null)
/** 编辑邮件时若密码框留空则沿用原值（演示） */
const editMailPasswordSnapshot = ref('')
const drawerForm = reactive({
  id: '',
  name: '',
  type: 'ding',
  enabled: true,
  testStatus: 'untested',
  lastTest: '—',
  updater: '管理员',
  webhookUrl: '',
  smtpHost: '',
  smtpPort: 465,
  smtpSsl: true,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: ''
})

const drawerTitle = computed(() => {
  const t = NOTIFY_TYPE_META[drawerForm.type]?.label || ''
  return drawerMode.value === 'create' ? `新增 · ${t}` : `编辑 · ${t}`
})

const drawerRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  webhookUrl: [
    {
      validator: (_r, v, cb) => {
        if (drawerForm.type !== 'ding' && drawerForm.type !== 'wework') return cb()
        if (!v || !String(v).trim()) return cb(new Error('请填写 Webhook'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  smtpHost: [
    {
      validator: (_r, v, cb) => {
        if (drawerForm.type !== 'mail') return cb()
        if (!v || !String(v).trim()) return cb(new Error('请填写 SMTP 服务器'))
        cb()
      },
      trigger: 'blur'
    }
  ],
  smtpFrom: [
    {
      validator: (_r, v, cb) => {
        if (drawerForm.type !== 'mail') return cb()
        if (!v || !String(v).trim()) return cb(new Error('请填写发件人邮箱'))
        cb()
      },
      trigger: 'blur'
    }
  ]
}

function blankForm(type) {
  return {
    id: `nm-${Date.now()}`,
    name: '',
    type,
    enabled: true,
    testStatus: 'untested',
    lastTest: '—',
    updater: '管理员',
    webhookUrl: '',
    smtpHost: '',
    smtpPort: 465,
    smtpSsl: true,
    smtpUser: '',
    smtpPassword: '',
    smtpFrom: ''
  }
}

function assignDrawer(src) {
  Object.assign(drawerForm, {
    ...blankForm(src.type),
    ...src,
    smtpPassword: ''
  })
  if (src.type === 'mail' && drawerMode.value === 'edit') {
    editMailPasswordSnapshot.value = String(src.smtpPassword ?? '')
  } else {
    editMailPasswordSnapshot.value = ''
    if (src.type === 'mail' && drawerMode.value === 'create') {
      drawerForm.smtpPassword = String(src.smtpPassword ?? '')
    }
  }
}

function onCreateCommand(type) {
  drawerMode.value = 'create'
  assignDrawer(blankForm(type))
  drawerVisible.value = true
}

function openEdit(row) {
  drawerMode.value = 'edit'
  assignDrawer(JSON.parse(JSON.stringify(row)))
  drawerVisible.value = true
}

async function saveDrawer() {
  try {
    await drawerFormRef.value?.validate()
  } catch {
    return
  }

  let smtpPassword = drawerForm.smtpPassword
  if (drawerForm.type === 'mail' && drawerMode.value === 'edit' && !String(smtpPassword ?? '').trim()) {
    smtpPassword = editMailPasswordSnapshot.value
  }

  upsertNotificationMethod({
    id: drawerForm.id,
    name: drawerForm.name.trim(),
    type: drawerForm.type,
    enabled: drawerForm.enabled,
    testStatus: drawerForm.testStatus,
    lastTest: drawerForm.lastTest,
    updater: drawerForm.updater,
    webhookUrl: drawerForm.webhookUrl,
    smtpHost: drawerForm.smtpHost,
    smtpPort: drawerForm.smtpPort,
    smtpSsl: drawerForm.smtpSsl,
    smtpUser: drawerForm.smtpUser,
    smtpPassword:
      drawerForm.type === 'mail' ? String(smtpPassword ?? '') : '',
    smtpFrom: drawerForm.smtpFrom
  })

  drawerVisible.value = false
  ElMessage.success('已保存')
}

function onTest(row) {
  upsertNotificationMethod({ ...row, testStatus: 'ok', lastTest: new Date().toLocaleString('zh-CN') })
  ElMessage.success('连接测试成功（演示）')
}

async function onDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.name}」？`, '删除', { type: 'warning' })
  } catch {
    return
  }
  deleteNotificationMethod(row.id)
  ElMessage.success('已删除')
}
</script>
