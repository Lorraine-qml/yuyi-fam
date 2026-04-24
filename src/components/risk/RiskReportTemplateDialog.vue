<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑报告模板' : '新增报告模板'"
    width="640px"
    destroy-on-close
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="form.name" placeholder="如 标准周报模板" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item label="模板类型" prop="periodType">
        <el-select v-model="form.periodType" class="w-full" :disabled="isEdit">
          <el-option
            v-for="p in PERIOD_OPTIONS"
            :key="p.value"
            :label="p.label"
            :value="p.value"
          />
        </el-select>
      </el-form-item>

      <div class="text-sm font-semibold text-gray-800 mb-2">模板结构</div>
      <div
        class="rounded-lg border p-4 space-y-2 mb-4"
        style="border-color: var(--yw-border); background: var(--yw-bg-page)"
      >
        <el-checkbox v-model="form.sections.header">报告头部（标题、时间、生成人）</el-checkbox>
        <el-checkbox v-model="form.sections.overviewCards">风险总览（卡片式核心指标）</el-checkbox>
        <el-checkbox v-model="form.sections.levelPie">风险等级分布（饼图）</el-checkbox>
        <el-checkbox v-model="form.sections.trendLine">风险趋势变化（折线图）</el-checkbox>
        <el-checkbox v-model="form.sections.regionTable">风险区域排行（表格）</el-checkbox>
        <el-checkbox v-model="form.sections.ruleStats">预警规则触发统计（表格）</el-checkbox>
        <el-checkbox v-model="form.sections.efficiencyBar">处置效率分析（柱状图）</el-checkbox>
        <el-checkbox v-model="form.sections.openRisksTable">未处置风险明细（表格）</el-checkbox>
        <el-checkbox v-model="form.sections.footer">报告尾部（生成说明）</el-checkbox>
      </div>

      <div class="text-sm font-semibold text-gray-800 mb-2">图表样式</div>
      <el-form-item label="图表主题">
        <el-select v-model="form.chartTheme" class="w-full">
          <el-option
            v-for="t in CHART_THEME_OPTIONS"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="图表尺寸">
        <el-select v-model="form.chartSize" class="w-full">
          <el-option
            v-for="s in CHART_SIZE_OPTIONS"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="显示数据标签">
        <el-switch v-model="form.showDataLabel" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CHART_SIZE_OPTIONS,
  CHART_THEME_OPTIONS,
  DEFAULT_SECTIONS,
  PERIOD_OPTIONS
} from '@/data/riskReportMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  record: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)
const form = reactive({
  name: '',
  periodType: 'week',
  chartTheme: 'yuyi',
  chartSize: 'md',
  showDataLabel: true,
  sections: DEFAULT_SECTIONS()
})

const isEdit = computed(() => props.mode === 'edit')

const rules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  periodType: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

function resetForm() {
  form.name = ''
  form.periodType = 'week'
  form.chartTheme = 'yuyi'
  form.chartSize = 'md'
  form.showDataLabel = true
  form.sections = DEFAULT_SECTIONS()
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    if (props.record) {
      form.name = props.record.name
      form.periodType = props.record.periodType
      form.chartTheme = props.record.chartTheme || 'yuyi'
      form.chartSize = props.record.chartSize || 'md'
      form.showDataLabel = props.record.showDataLabel !== false
      form.sections = { ...DEFAULT_SECTIONS(), ...props.record.sections }
    } else resetForm()
  }
)

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  emit('saved', {
    name: form.name.trim(),
    periodType: form.periodType,
    chartTheme: form.chartTheme,
    chartSize: form.chartSize,
    showDataLabel: form.showDataLabel,
    sections: { ...form.sections }
  })
  emit('update:visible', false)
  ElMessage.success('模板已保存')
}
</script>
