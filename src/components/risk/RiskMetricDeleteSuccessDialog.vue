<template>
  <el-dialog
    :model-value="visible"
    title=""
    width="480px"
    align-center
    class="metric-delete-success-dialog"
    append-to-body
    destroy-on-close
    :show-close="true"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <template #header>
      <div class="flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span class="text-emerald-500 text-xl leading-none" aria-hidden="true">✅</span>
        <span>删除成功</span>
      </div>
    </template>

    <div class="space-y-4 text-sm text-gray-700">
      <p class="text-base text-gray-800">
        指标「<span class="font-medium text-gray-900">{{ metricName }}</span>」已删除
      </p>
      <p
        v-if="linkedRuleCount > 0"
        class="rounded-lg border px-3 py-2.5 leading-relaxed"
        style="border-color: var(--yw-border); background: var(--yw-bg-page)"
      >
        <span class="mr-1" aria-hidden="true">📌</span>
        关联的 <span class="font-semibold text-gray-900">{{ linkedRuleCount }}</span> 条规则已自动停用，可前往规则列表查看或重新配置
      </p>
      <p
        v-else
        class="text-gray-500"
      >
        当前指标未关联规则，无需额外处理。
      </p>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button v-if="linkedRuleCount > 0" type="primary" @click="goRules">查看规则</el-button>
        <el-button @click="close">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, default: false },
  metricName: { type: String, default: '' },
  linkedRuleCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'view-rules'])

function close() {
  emit('update:visible', false)
}

function goRules() {
  emit('view-rules')
  emit('update:visible', false)
}
</script>

<style>
.metric-delete-success-dialog.el-dialog {
  border-radius: 12px;
  padding: 0;
}
.metric-delete-success-dialog .el-dialog__header {
  padding: 20px 20px 8px;
  margin-right: 0;
}
.metric-delete-success-dialog .el-dialog__body {
  padding: 8px 20px 16px;
}
.metric-delete-success-dialog .el-dialog__footer {
  padding: 8px 20px 20px;
}
</style>
