<template>
  <el-drawer
    :model-value="visible"
    title="管理系统模板"
    direction="rtl"
    size="700px"
    destroy-on-close
    class="risk-system-tpl-admin"
    append-to-body
    @update:model-value="onVisible"
  >
    <p class="text-sm text-gray-500 mb-4 m-0">
      演示：数据持久化在浏览器 localStorage；生产环境接入
      <code class="text-xs">GET/POST/PUT/DELETE /templates/system</code>。线上由权限服务鉴权（如仅 system_admin 可写）。
    </p>

    <div class="flex flex-wrap items-end gap-2 mb-4">
      <el-form :inline="true" class="flex flex-wrap items-end gap-2 !mb-0" @submit.prevent>
        <el-form-item label="模板名称" class="!mb-0">
          <el-input v-model="nameQ" clearable size="small" placeholder="关键字" class="w-40" />
        </el-form-item>
        <el-form-item label="业务板块" class="!mb-0">
          <el-select v-model="catQ" clearable placeholder="全部" class="w-36" size="small">
            <el-option label="全部" value="" />
            <el-option v-for="c in CATEGORY_FILTER" :key="c" :label="sectorDisplay(c)" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" size="small" @click="resetPage">筛选</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="primary" size="small" class="ml-auto max-sm:ml-0" @click="openCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增系统模板
      </el-button>
    </div>

    <el-table :data="pagedRows" border size="small" class="w-full" max-height="calc(100vh - 280px)">
      <el-table-column prop="name" label="模板名称" min-width="120" show-overflow-tooltip />
      <el-table-column label="业务板块" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          {{ sectorDisplay(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="standardMetricTypeName" label="标准指标类型" min-width="120" show-overflow-tooltip />
      <el-table-column label="表达式" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <code class="text-xs whitespace-pre-wrap">{{ row.expression }}</code>
        </template>
      </el-table-column>
      <el-table-column label="等级" width="72" align="center">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ levelMeta(row.level).labelShort }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="eventCategory" label="事件分类" min-width="108" show-overflow-tooltip />
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="confirmDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end mt-3">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="filteredRows.length"
        :page-sizes="[10, 20, 50]"
        layout="prev, pager, next, sizes"
        small
        background
      />
    </div>

    <RiskSystemTemplateFormDialog
      v-model:visible="formVisible"
      :mode="formMode"
      :record="formRecord"
      @saved="onFormSaved"
    />
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RiskSystemTemplateFormDialog from '@/components/risk/RiskSystemTemplateFormDialog.vue'
import { getSystemTemplates, deleteSystemTemplateById, systemTemplateCategoryDisplay } from '@/data/riskSystemTemplates'
import { levelMeta } from '@/data/riskRulesMock'

const CATEGORY_FILTER = ['能耗', '安全', '食堂', '物业', '资产']

const props = defineProps({
  visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible', 'saved'])

const nameQ = ref('')
const catQ = ref('')
const page = ref(1)
const pageSize = ref(10)

const formVisible = ref(false)
const formMode = ref('create')
const formRecord = ref(null)

function sectorDisplay(c) {
  return systemTemplateCategoryDisplay(c)
}

const sourceRows = computed(() => getSystemTemplates())

const filteredRows = computed(() => {
  let list = [...sourceRows.value]
  const n = nameQ.value.trim().toLowerCase()
  if (n) {
    list = list.filter((r) => String(r.name || '').toLowerCase().includes(n))
  }
  if (catQ.value) {
    list = list.filter((r) => r.category === catQ.value)
  }
  return list
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function resetPage() {
  page.value = 1
}

function resetFilters() {
  nameQ.value = ''
  catQ.value = ''
  page.value = 1
}

watch(nameQ, () => {
  page.value = 1
})
watch(catQ, () => {
  page.value = 1
})
watch(pageSize, () => {
  page.value = 1
})

watch(filteredRows, (list) => {
  const maxPage = Math.max(1, Math.ceil(list.length / pageSize.value) || 1)
  if (page.value > maxPage) page.value = maxPage
})

function onVisible(v) {
  emit('update:visible', v)
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      resetFilters()
    }
  }
)

function openCreate() {
  formMode.value = 'create'
  formRecord.value = null
  formVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  formRecord.value = { ...row }
  formVisible.value = true
}

function onFormSaved() {
  emit('saved')
}

async function confirmDelete(row) {
  const name = row.name || '该模板'
  try {
    await ElMessageBox.confirm(
      `确认删除模板「${name}」吗？删除后所有项目将无法再使用此模板。已有项目模板不受影响。此操作不可逆。`,
      '确认删除系统模板',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  deleteSystemTemplateById(row.id)
  ElMessage.success('已删除系统模板')
  emit('saved')
}
</script>
