<template>
  <div class="flex flex-wrap items-center gap-3 mb-5">
    <slot name="filters"></slot>
    <avue-input v-model="searchKeyword" placeholder="请输入关键词" size="small" class="w-48" />
    <avue-select v-model="searchType" :dic="typeOptions" placeholder="全部板块" size="small" clearable />
    <avue-date v-model="dateRange" type="daterange" placeholder="选择日期范围" size="small" />
    <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
    <el-button size="small" @click="handleReset">重置</el-button>
    <el-button size="small" class="ml-auto" @click="handleExport">
      <el-icon><Download /></el-icon>
      导出
    </el-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Download } from '@element-plus/icons-vue'

const emit = defineEmits(['search', 'reset', 'export'])

const searchKeyword = ref('')
const searchType = ref('')
const dateRange = ref([])

const typeOptions = ref([
  { label: '能耗', value: 'energy' },
  { label: '安全', value: 'security' }
])

const handleSearch = () => {
  emit('search', {
    keyword: searchKeyword.value,
    type: searchType.value,
    dateRange: dateRange.value
  })
}

const handleReset = () => {
  searchKeyword.value = ''
  searchType.value = ''
  dateRange.value = []
  emit('reset')
}

const handleExport = () => emit('export')
</script>
