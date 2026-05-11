<template>
  <div class="event-category-field">
    <el-select
      :model-value="modelValue"
      filterable
      class="event-category-field__select"
      placeholder="请选择事件分类"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <el-option-group v-for="g in groups" :key="g.sector" :label="g.sectorLabel">
        <el-option v-for="o in g.options" :key="o.value" :label="o.label" :value="o.value" />
      </el-option-group>
    </el-select>
    <div v-if="manageLink" class="mt-1 flex items-center gap-2">
      <a :href="manageHref" target="_blank" rel="noopener noreferrer" class="text-xs text-indigo-600 hover:underline">
        去管理分类
      </a>
      <span v-if="disabledSelectedHint" class="text-xs text-amber-600">{{ disabledSelectedHint }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getEventCategoryById, getGroupedEnabledEventCategorySelect } from '@/data/eventCategories'

const props = defineProps({
  modelValue: { type: String, default: '' },
  manageLink: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const groups = computed(() => getGroupedEnabledEventCategorySelect())

const manageHref = computed(() => router.resolve({ name: 'RiskEventCategories' }).href)

const disabledSelectedHint = computed(() => {
  const id = props.modelValue
  if (!id) return ''
  const row = getEventCategoryById(id)
  return row && row.enabled === false ? '（当前分类已停用，建议更换）' : ''
})
</script>

<style scoped>
/* 与表单项内其它 el-input / el-select 一致占满内容区；避免在 el-form-item flex 布局下被压成极窄 */
.event-category-field {
  width: 100%;
  min-width: 0;
  display: block;
}

.event-category-field__select {
  width: 100%;
}

.event-category-field :deep(.el-select) {
  width: 100%;
}

.event-category-field :deep(.el-select .el-select__wrapper) {
  width: 100%;
  max-width: 100%;
}
</style>
