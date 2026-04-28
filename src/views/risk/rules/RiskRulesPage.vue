<template>
  <div class="risk-rules-page">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
      <h1 class="text-2xl font-bold text-gray-800">风险规则配置</h1>
      <div v-if="mainTab === 'list'" class="flex flex-wrap gap-2">
        <el-button type="primary" @click="openCreate">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增规则
        </el-button>
        <el-button @click="triggerImport">
          <el-icon class="mr-1"><Upload /></el-icon>
          导入
        </el-button>
        <el-button @click="exportJson">
          <el-icon class="mr-1"><Download /></el-icon>
          导出
        </el-button>
        <input
          ref="fileInputRef"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="onImportFile"
        />
      </div>
    </div>

    <el-tabs v-model="mainTab" class="risk-rule-main-tabs" type="card">
      <el-tab-pane name="list" lazy>
        <template #label>
          <span class="inline-flex items-center gap-1.5">
            <span aria-hidden="true">📋</span>
            规则列表
          </span>
        </template>

        <el-alert
          v-if="createSuccessTip"
          type="success"
          :closable="true"
          class="mb-4"
          :title="createSuccessTip"
          @close="createSuccessTip = ''"
        />

        <div
          class="rounded-xl border bg-white p-4 shadow-sm mb-4"
          style="border-color: var(--yw-border)"
        >
          <el-form :inline="true" class="flex flex-wrap items-end gap-3">
            <el-form-item label="规则名称" class="!mb-0">
              <el-input v-model="filterName" placeholder="名称关键字" clearable class="w-44" />
            </el-form-item>
            <el-form-item label="关联指标" class="!mb-0">
              <el-select v-model="filterMetric" placeholder="全部" clearable class="w-52" filterable>
                <el-option label="全部" value="" />
                <el-option
                  v-for="m in metricOptions"
                  :key="m.value"
                  :label="m.label"
                  :value="m.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="等级" class="!mb-0">
              <el-select v-model="filterLevel" placeholder="全部" clearable class="w-32" @change="page = 1">
                <el-option label="全部" value="" />
                <el-option
                  v-for="l in RULE_LEVEL_OPTIONS"
                  :key="l.value"
                  :label="l.labelShort"
                  :value="l.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" class="!mb-0">
              <el-select v-model="filterStatus" placeholder="全部" clearable class="w-28" @change="page = 1">
                <el-option label="全部" value="" />
                <el-option label="启用" value="enabled" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </el-form-item>
            <el-form-item class="!mb-0">
              <el-button type="primary" @click="page = 1">搜索</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div
          class="rounded-xl border bg-white shadow-sm overflow-hidden"
          style="border-color: var(--yw-border)"
        >
          <el-table :data="pagedRows" row-key="id">
            <el-table-column prop="name" label="规则名称" min-width="130" show-overflow-tooltip />
            <el-table-column label="所属板块" min-width="108" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="text-sm text-gray-700">{{ row.sectorLabel || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="metricName" label="关联指标" min-width="120" show-overflow-tooltip />
            <el-table-column label="表达式" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="text-xs text-gray-700">{{ row.expressionDisplay || row.expression }}</code>
              </template>
            </el-table-column>
            <el-table-column label="等级" width="88" align="center">
              <template #default="{ row }">
                <el-tag :type="row.levelTag" size="small" effect="light">{{ row.levelLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="88" align="center">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status === 'enabled'"
                  inline-prompt
                  active-text="启"
                  inactive-text="停"
                  @change="(v) => onToggleStatus(row, v)"
                />
              </template>
            </el-table-column>
            <el-table-column label="试运行" width="88" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.runMode === 'trial'" type="warning" size="small" effect="plain">
                  试运行
                </el-tag>
                <span v-else class="text-gray-400">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="400" fixed="right" class-name="risk-rule-actions-col">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click="openTest(row)">测试</el-button>
                <el-button link type="primary" size="small" @click="openVersionHistory(row)">版本历史</el-button>
                <el-button link type="primary" size="small" @click="copyRule(row)">复制</el-button>
                <el-button link type="primary" size="small" @click="openSaveRuleAsTemplate(row)"
                  >另存为模板</el-button
                >
                <el-button
                  v-if="row.runMode === 'trial'"
                  link
                  type="primary"
                  size="small"
                  @click="openTrialLog(row)"
                  >日志</el-button
                >
                <el-button link type="danger" size="small" @click="deleteCurrentVersion(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div
            class="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-t text-sm text-gray-500"
            style="border-color: var(--yw-border)"
          >
            <span>共 {{ filteredRows.length }} 条</span>
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="filteredRows.length"
              :page-sizes="[10, 20, 50]"
              layout="prev, pager, next, sizes"
              background
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="templates" lazy>
        <template #label>
          <span class="inline-flex items-center gap-1.5">
            <span aria-hidden="true">📚</span>
            规则模板库
          </span>
        </template>

        <!-- 本项目模板（优先展示） -->
        <div
          ref="projectTplSectionRef"
          class="rounded-xl border bg-white p-4 shadow-sm mb-6 scroll-mt-4"
          style="border-color: var(--yw-border)"
        >
          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
            <div>
              <h3 class="text-base font-semibold text-gray-800 m-0 flex items-center gap-2">
                <span class="text-lg" aria-hidden="true">📁</span>
                本项目模板（{{ currentProjectLabel }}）
              </h3>
              <p class="text-xs text-gray-500 mt-1.5 mb-0 max-w-3xl">
                与当前项目绑定；保存后可在下方卡片中「使用 / 编辑」。规则列表中「另存为模板」也会写入此处。
              </p>
            </div>
            <div v-if="canManageTemplates" class="flex flex-wrap gap-2 shrink-0 justify-end">
              <el-button type="primary" size="small" @click="openCreateProjectTemplate">
                <el-icon class="mr-1"><Plus /></el-icon>
                新增模板
              </el-button>
              <el-button size="small" @click="openProjectTemplateExportDialog">
                <el-icon class="mr-1"><Download /></el-icon>
                导出
              </el-button>
              <el-button size="small" @click="projectTemplateManageVisible = true">
                模板管理
              </el-button>
            </div>
          </div>

          <el-form :inline="true" class="flex flex-wrap items-end gap-3 mb-4" @submit.prevent>
            <el-form-item label="业务板块" class="!mb-0">
              <el-select v-model="tplFilterCategory" class="w-36" clearable placeholder="全部">
                <el-option label="全部" value="" />
                <el-option
                  v-for="c in TEMPLATE_SECTOR_TABS"
                  :key="c"
                  :label="c"
                  :value="c"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="模板名称" class="!mb-0">
              <el-input
                v-model="tplFilterName"
                clearable
                placeholder="搜索模板名称"
                class="w-52"
                @keyup.enter="() => {}"
              />
            </el-form-item>
            <el-form-item class="!mb-0">
              <el-button type="primary" size="small">搜索</el-button>
              <el-button size="small" @click="resetTemplateFilters">重置</el-button>
            </el-form-item>
          </el-form>

          <div
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          >
            <div
              v-for="t in filteredProjectTemplates"
              :key="t.id"
              class="template-card flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-md"
              style="border-color: var(--yw-border); background: var(--yw-bg-card, #fff)"
            >
              <div class="text-2xl leading-none mb-2" aria-hidden="true">{{ templateCardIcon(t) }}</div>
              <div class="font-semibold text-gray-900 text-sm mb-1">{{ t.name }}</div>
              <div class="text-xs text-gray-500 mb-2"
                >业务板块：{{ t.category || sectorLabelForMetricCode(t.metricCode) || '—' }}</div
              >
              <code class="text-xs text-indigo-600 break-all block mb-3 grow">{{ t.expression }}</code>
              <p class="text-[11px] text-gray-500 mb-1 truncate" :title="t.metricName">
                指标：{{ t.metricName }} ({{ t.metricCode }})
              </p>
              <div class="mb-3">
                <el-tag :type="levelMeta(t.level).tag" size="small" effect="light">
                  {{ levelMeta(t.level).labelShort }}预警
                </el-tag>
              </div>
              <el-button type="primary" plain class="w-full mb-2" @click="openProjectTemplateUse(t)">
                使用
              </el-button>
              <div v-if="canManageTemplates" class="grid grid-cols-2 gap-2 w-full">
                <el-button size="small" @click="openEditProjectTemplate(t)">编辑</el-button>
                <el-button type="danger" plain size="small" @click="deleteProjectTemplate(t)">删除</el-button>
                <el-button class="col-span-2" size="small" @click="exportOneProjectTemplate(t)">导出</el-button>
              </div>
            </div>
          </div>
          <p v-if="!filteredProjectTemplates.length" class="text-center text-gray-400 text-sm py-10 m-0">
            暂无本项目模板：可在规则列表将规则「另存为模板」，或从下方系统模板映射指标后保存。
          </p>
        </div>

        <!-- 系统模板（次之） -->
        <div class="rounded-xl border bg-white p-4 shadow-sm" style="border-color: var(--yw-border)">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 class="text-base font-semibold text-gray-800 m-0 flex items-center gap-2">
                <span class="text-lg" aria-hidden="true">🛡</span>
                系统模板（平台预置，tenant_id=0）
              </h3>
              <p class="text-xs text-gray-500 mt-1 mb-0">
                使用标准指标类型；「使用 / 另存为模板」时需映射到本项目实际指标。
              </p>
            </div>
            <div
              v-if="isSystemAdmin"
              class="flex flex-wrap gap-2 shrink-0 justify-end items-center"
            >
              <el-button type="primary" size="small" @click="openQuickCreateSystemTemplate">
                <el-icon class="mr-1"><Plus /></el-icon>
                新增系统模板
              </el-button>
              <el-button size="small" @click="systemTplAdminDrawerVisible = true">
                管理系统模板
              </el-button>
            </div>
          </div>
          <div
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          >
            <div
              v-for="t in filteredSystemTemplates"
              :key="t.id"
              class="template-card flex flex-col rounded-xl border p-4 transition-shadow hover:shadow-md"
              style="border-color: var(--yw-border); background: var(--yw-bg-card, #fff)"
            >
              <div class="text-2xl leading-none mb-2" aria-hidden="true">{{ templateCardIcon(t) }}</div>
              <div class="font-semibold text-gray-900 text-sm mb-1">{{ t.name }}</div>
              <div class="text-xs text-gray-500 mb-2">业务板块：{{ t.category || '—' }}</div>
              <code class="text-xs text-indigo-600 break-all block mb-1 grow">{{ t.expression }}</code>
              <p class="text-[11px] text-gray-400 mb-2">标准类型：{{ t.standardMetricTypeName }}</p>
              <div class="mb-3">
                <el-tag :type="levelMeta(t.level).tag" size="small" effect="light">
                  {{ levelMeta(t.level).labelShort }}预警
                </el-tag>
              </div>
              <div class="flex flex-col gap-2 w-full mt-auto">
                <el-button type="primary" plain class="w-full" @click="openSystemTemplateUse(t)">使用</el-button>
                <el-button size="small" class="w-full" @click="openSystemTemplateSaveAs(t)">另存为模板</el-button>
              </div>
            </div>
          </div>
          <p v-if="!filteredSystemTemplates.length" class="text-center text-gray-400 text-sm py-6 m-0">
            无匹配系统模板
          </p>
        </div>
      </el-tab-pane>
    </el-tabs>

    <RiskRuleFormDialog
      ref="formDialogRef"
      v-model:visible="formVisible"
      :mode="formMode"
      :record="editingRecord"
      :metric-options="metricOptions"
      @saved="onFormSaved"
      @test="onFormTest"
    />

    <RiskRuleTemplateApplyDialog
      ref="templateApplyRef"
      v-model:visible="templateApplyVisible"
      :template="selectedTemplate"
      :metric-options="metricOptions"
      @created="onTemplateRuleCreated"
    />

    <RiskSystemTemplateMapDialog
      v-model:visible="systemMapVisible"
      :mode="systemMapMode"
      :template="systemMapTemplate"
      :metric-options="metricOptions"
      @use="onSystemMapUse"
      @saveAs="onSystemMapSaveAs"
    />

    <RiskTemplateFormDialog
      v-model:visible="templateFormVisible"
      :mode="templateFormMode"
      :record="templateFormRecord"
      :metric-options="metricOptions"
      :lock-metric="templateFormLockMetric"
      @saved="onTemplateFormSaved"
    />

    <el-dialog
      v-model="saveRuleAsTemplateVisible"
      title="另存为模板"
      width="440px"
      align-center
      destroy-on-close
      append-to-body
      @closed="saveRuleAsTemplateRow = null"
    >
      <el-form label-width="88px" class="pr-1">
        <el-form-item label="模板名称" required>
          <el-input v-model="saveRuleAsTemplateName" maxlength="64" show-word-limit placeholder="模板名称" />
        </el-form-item>
        <el-form-item label="保存位置">
          <span class="text-sm text-gray-700">本项目模板（{{ currentProjectLabel }}）</span>
        </el-form-item>
        <el-form-item label="说明">
          <p class="text-sm text-gray-500 m-0 leading-relaxed">
            保存后可在「规则模板库 → 本项目模板」中编辑、使用。不会改变原规则。
          </p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveRuleAsTemplateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSaveRuleAsTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="projectTplExportDialogVisible"
      title="导出本项目模板"
      width="480px"
      align-center
      destroy-on-close
      append-to-body
    >
      <p class="text-sm text-gray-500 m-0 mb-3">勾选要导出的模板（JSON），默认可全选。</p>
      <el-checkbox-group v-model="projectTplExportCheckedIds" class="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
        <el-checkbox v-for="t in projectTemplates" :key="t.id" :label="t.id">
          <span class="text-sm">{{ t.name }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <div class="flex justify-end gap-2 w-full flex-wrap items-center">
          <el-button link type="primary" class="!mr-auto" @click="toggleExportCheckAll">{{
            projectTplExportAll ? '清空' : '全选'
          }}</el-button>
          <el-button @click="projectTplExportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmProjectTemplateBatchExport">导出</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="projectTemplateManageVisible"
      title="本项目模板 — 批量管理"
      width="760px"
      align-center
      destroy-on-close
      append-to-body
    >
      <p class="text-sm text-gray-500 mb-3 m-0">
        在项目卡片上也可单独编辑或删除；此处支持按行快速删除。
      </p>
      <el-table :data="projectTemplates" border size="small" max-height="400">
        <el-table-column prop="name" label="模板名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="category" label="板块" width="88" />
        <el-table-column prop="metricName" label="指标" min-width="120" show-overflow-tooltip />
        <el-table-column label="表达式" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="text-xs">{{ row.expression }}</code>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditFromManage(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteFromManage(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <RiskSystemTemplateFormDialog
      v-if="isSystemAdmin"
      v-model:visible="quickSysTplVisible"
      mode="create"
      :record="null"
      @saved="onQuickSystemTemplateSaved"
    />

    <RiskSystemTemplateAdminDrawer v-model:visible="systemTplAdminDrawerVisible" />

    <el-dialog
      v-model="ruleBlockerVisible"
      :title="ruleBlocker?.type === 'dupName' ? '规则名称冲突' : '指标规则冲突'"
      width="480px"
      align-center
      destroy-on-close
      class="rule-blocker-dialog"
      @close="clearRuleBlocker"
    >
      <template v-if="ruleBlocker">
        <el-alert
          v-if="ruleBlocker.type === 'dupName'"
          type="warning"
          :closable="false"
          show-icon
          title="规则名称已存在"
        />
        <el-alert
          v-else
          type="error"
          :closable="false"
          show-icon
          title="与已有启用规则冲突"
        />
        <p class="text-sm text-gray-700 mt-3 mb-4 leading-relaxed">
          {{ ruleBlocker.message }}
        </p>
        <div class="flex flex-wrap justify-end gap-2">
          <el-button
            v-if="ruleBlocker.type === 'dupName' && ruleBlocker.suggestedName"
            type="primary"
            @click="applyRuleBlockerSuggestedName"
            >使用建议名称</el-button
          >
          <el-button v-if="ruleBlocker.type === 'metricConflict'" @click="editConflictRule"
            >编辑现有规则</el-button
          >
          <el-button @click="ruleBlockerVisible = false">修改名称/条件后重试</el-button>
        </div>
      </template>
    </el-dialog>

    <RiskRuleTestDialog v-model:visible="testVisible" :rule="testingRule" />

    <RiskRuleTrialLogDialog v-model:visible="trialLogVisible" :rule="trialLogRule" />

    <el-dialog
      v-model="versionHistoryVisible"
      :title="`版本历史 — ${versionHistoryContext.name || '规则'}`"
      width="640px"
      destroy-on-close
      align-center
    >
      <p v-if="!versionHistoryContext.rows.length" class="text-sm text-gray-500">
        暂无历史版本。编辑并保存后，上一版本会归档在此。
      </p>
      <el-table
        v-else
        :data="versionHistoryContext.rows"
        border
        size="small"
        :max-height="400"
        class="w-full"
      >
        <el-table-column prop="versionLabel" label="版本" width="88" />
        <el-table-column label="归档时间" min-width="168">
          <template #default="{ row }">
            <span class="text-xs text-gray-700">{{ formatVersionTime(row.savedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="当时名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="expressionDisplay" label="当时表达式" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import RiskRuleFormDialog from '@/components/risk/RiskRuleFormDialog.vue'
import RiskTemplateFormDialog from '@/components/risk/RiskTemplateFormDialog.vue'
import RiskSystemTemplateMapDialog from '@/components/risk/RiskSystemTemplateMapDialog.vue'
import RiskSystemTemplateFormDialog from '@/components/risk/RiskSystemTemplateFormDialog.vue'
import RiskRuleTemplateApplyDialog from '@/components/risk/RiskRuleTemplateApplyDialog.vue'
import RiskRuleTestDialog from '@/components/risk/RiskRuleTestDialog.vue'
import RiskRuleTrialLogDialog from '@/components/risk/RiskRuleTrialLogDialog.vue'
import RiskSystemTemplateAdminDrawer from '@/components/risk/RiskSystemTemplateAdminDrawer.vue'
import { getMetricSelectOptions } from '@/data/riskMetricsMock'
import { loadProjectTemplates, saveProjectTemplates } from '@/data/riskProjectTemplates'
import { getSystemTemplates } from '@/data/riskSystemTemplates'
import { useCurrentProject } from '@/composables/useCurrentProject'
import {
  levelMeta,
  RULE_LEVEL_OPTIONS,
  sectorCodeForMetricCode,
  sectorLabelForMetricCode,
  seedRiskRules
} from '@/data/riskRulesMock'
import { validateNewRule } from '@/utils/riskRuleCreateValidation'
import {
  pickRuleFieldsForTemplate,
  templateNameExists
} from '@/utils/ruleToProjectTemplate'

const TEMPLATE_SECTOR_TABS = ['能耗', '安全', '食堂', '物业', '资产']

/** 演示环境：有模板管理权限。接入权限后可改为角色判断。 */
const canManageTemplates = true

const list = ref(seedRiskRules())
const metricOptions = ref(getMetricSelectOptions())

const mainTab = ref('list')
const createSuccessTip = ref('')

const filterName = ref('')
const filterMetric = ref('')
const filterLevel = ref('')
const filterStatus = ref('')
const page = ref(1)
const pageSize = ref(20)
const fileInputRef = ref(null)
const templateApplyRef = ref(null)
const formDialogRef = ref(null)

const tplFilterCategory = ref('')
const tplFilterName = ref('')

const formVisible = ref(false)
const formMode = ref('create')
const editingRecord = ref(null)

const testVisible = ref(false)
const testingRule = ref(null)

const trialLogVisible = ref(false)
const trialLogRule = ref(null)

const versionHistoryVisible = ref(false)
const versionHistoryContext = ref({ name: '', rows: [] })

const templateApplyVisible = ref(false)
const selectedTemplate = ref(null)

const { currentProjectId, currentProject } = useCurrentProject()
const currentProjectLabel = computed(() => currentProject.value?.name || '—')
const projectTplSectionRef = ref(null)

const route = useRoute()
const router = useRouter()

const systemMapVisible = ref(false)
const systemMapMode = ref('use')
const systemMapTemplate = ref(null)
const templateFormVisible = ref(false)
const templateFormMode = ref('create')
const templateFormRecord = ref(null)
const templateFormLockMetric = ref(false)

const projectTemplates = ref([])

function reloadProjectTemplates() {
  projectTemplates.value = loadProjectTemplates(currentProjectId.value)
}

watch(
  currentProjectId,
  () => {
    reloadProjectTemplates()
  },
  { immediate: true }
)

const saveRuleAsTemplateVisible = ref(false)
const saveRuleAsTemplateName = ref('')
const saveRuleAsTemplateRow = ref(null)

const projectTplExportDialogVisible = ref(false)
const projectTplExportCheckedIds = ref([])

const projectTemplateManageVisible = ref(false)
const systemTplAdminDrawerVisible = ref(false)
const quickSysTplVisible = ref(false)
/** 演示期：当前账号默认可管理系统模板；上线后改为从用户/Token 角色是否含 system_admin 判断 */
const isSystemAdmin = ref(true)

watch(projectTplExportDialogVisible, (v) => {
  if (v) {
    projectTplExportCheckedIds.value = projectTemplates.value.map((t) => t.id)
  }
})

const projectTplExportAll = computed(
  () =>
    projectTemplates.value.length > 0 &&
    projectTplExportCheckedIds.value.length === projectTemplates.value.length
)

const ruleBlockerVisible = ref(false)
const ruleBlocker = ref(null)
/** 复制规则时若名称冲突，应用建议名后从该行生成副本 */

const filteredSystemTemplates = computed(() => [...getSystemTemplates()])

const filteredProjectTemplates = computed(() => {
  let rows = [...(projectTemplates.value || [])]
  if (tplFilterCategory.value) {
    rows = rows.filter((t) => t.category === tplFilterCategory.value)
  }
  const q = (tplFilterName.value || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.metricName || '').toLowerCase().includes(q)
    )
  }
  return rows
})

function templateCardIcon(t) {
  const n = t.name
  if (/电|用水|突增|能耗/.test(n)) return '⚡'
  if (/消防|火|报警/.test(n)) return '🔥'
  if (/离线|率/.test(n) && /消防|监控|设备/.test(n)) return '📉'
  if (/晨检|样|餐|三清/.test(n)) return '🍽️'
  if (/工单|报修|积压|超时|重复/.test(n)) return '📋'
  if (/水/.test(n)) return '💧'
  return '📌'
}

function resetTemplateFilters() {
  tplFilterCategory.value = ''
  tplFilterName.value = ''
}

function openQuickCreateSystemTemplate() {
  quickSysTplVisible.value = true
}

function onQuickSystemTemplateSaved() {
  ElMessage.success('系统模板已保存，下方卡片与管理系统模板列表已同步更新')
}

function openSystemTemplateUse(t) {
  systemMapMode.value = 'use'
  systemMapTemplate.value = t
  systemMapVisible.value = true
}

function openSystemTemplateSaveAs(t) {
  systemMapMode.value = 'saveAs'
  systemMapTemplate.value = t
  systemMapVisible.value = true
}

function onSystemMapUse({ payload, eventPreview }) {
  onTemplateRuleCreated({ payload, eventPreview })
}

function onSystemMapSaveAs(data) {
  const id = `pt-${Date.now()}`
  const pid = currentProjectId.value
  const row = {
    id,
    tenant_id: pid,
    lockMetric: true,
    ...data
  }
  projectTemplates.value = [...projectTemplates.value, row]
  saveProjectTemplates(pid, projectTemplates.value)
  systemMapVisible.value = false
  nextTick(() => {
    projectTplSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  ElMessage.success('已保存到本项目模板')
}

function openProjectTemplateUse(t) {
  selectedTemplate.value = t
  templateApplyVisible.value = true
}

function openCreateProjectTemplate() {
  templateFormMode.value = 'create'
  templateFormRecord.value = null
  templateFormLockMetric.value = false
  templateFormVisible.value = true
}

function openEditProjectTemplate(t) {
  templateFormMode.value = 'edit'
  templateFormRecord.value = t
  templateFormLockMetric.value = true
  templateFormVisible.value = true
}

function onTemplateFormSaved(tpl) {
  const pid = currentProjectId.value
  const withTenant = { ...tpl, tenant_id: pid, lockMetric: true }
  if (templateFormMode.value === 'edit' && templateFormRecord.value?.id) {
    const id = templateFormRecord.value.id
    const idx = projectTemplates.value.findIndex((x) => x.id === id)
    if (idx >= 0) {
      const next = [...projectTemplates.value]
      next[idx] = { ...projectTemplates.value[idx], ...withTenant, id }
      projectTemplates.value = next
    } else {
      projectTemplates.value = [
        ...projectTemplates.value,
        { id: `pt-${Date.now()}`, ...withTenant }
      ]
    }
  } else {
    projectTemplates.value = [
      ...projectTemplates.value,
      { id: `pt-${Date.now()}`, ...withTenant }
    ]
  }
  saveProjectTemplates(pid, projectTemplates.value)
  templateFormLockMetric.value = false
}

async function deleteProjectTemplate(t) {
  const id = t.id
  if (!id) return
  try {
    await ElMessageBox.confirm(`确认删除本项目模板「${t.name}」？`, '删除模板', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  projectTemplates.value = projectTemplates.value.filter((x) => x.id !== id)
  saveProjectTemplates(currentProjectId.value, projectTemplates.value)
  ElMessage.success('已删除')
}

function exportOneProjectTemplate(t) {
  const payload = {
    tenant_id: currentProjectId.value,
    template: t
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `project-template-${(t.name || 'template').replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出')
}

function openProjectTemplateExportDialog() {
  if (!projectTemplates.value.length) {
    ElMessage.info('暂无本项目模板可导出')
    return
  }
  projectTplExportDialogVisible.value = true
}

function toggleExportCheckAll() {
  if (projectTplExportAll.value) {
    projectTplExportCheckedIds.value = []
  } else {
    projectTplExportCheckedIds.value = projectTemplates.value.map((t) => t.id)
  }
}

function confirmProjectTemplateBatchExport() {
  const set = new Set(projectTplExportCheckedIds.value)
  const chosen = projectTemplates.value.filter((t) => set.has(t.id))
  if (!chosen.length) {
    ElMessage.warning('请至少勾选一个模板')
    return
  }
  const payload = {
    tenant_id: currentProjectId.value,
    exportedAt: new Date().toISOString(),
    templates: chosen
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `project-templates-${currentProjectId.value}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  projectTplExportDialogVisible.value = false
  ElMessage.success('已导出')
}

function openSaveRuleAsTemplate(row) {
  saveRuleAsTemplateRow.value = row
  saveRuleAsTemplateName.value = `${row.name || '规则'}_模板`
  saveRuleAsTemplateVisible.value = true
}

function submitSaveRuleAsTemplate() {
  const row = saveRuleAsTemplateRow.value
  if (!row) return
  const name = String(saveRuleAsTemplateName.value || '').trim()
  if (!name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  if (templateNameExists(projectTemplates.value, name)) {
    ElMessage.error('模板名称与当前项目已有模板重名，请修改')
    return
  }
  const fields = pickRuleFieldsForTemplate(row)
  const tpl = {
    id: `pt-${Date.now()}`,
    tenant_id: currentProjectId.value,
    lockMetric: true,
    name,
    ...fields
  }
  projectTemplates.value = [...projectTemplates.value, tpl]
  saveProjectTemplates(currentProjectId.value, projectTemplates.value)
  saveRuleAsTemplateVisible.value = false
  mainTab.value = 'templates'
  nextTick(() => {
    projectTplSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  ElNotification({
    title: '已保存',
    message: '已保存为模板',
    type: 'success',
    position: 'bottom-right'
  })
}

function openEditFromManage(row) {
  projectTemplateManageVisible.value = false
  openEditProjectTemplate(row)
}

async function deleteFromManage(row) {
  await deleteProjectTemplate(row)
}

function showRuleBlocker(v, extra = {}) {
  const { source = 'form', copySourceRow = null } = extra
  if (v.code === 'dupName') {
    const suggested = v.suggestedName
    const msg = `与已有规则重名。建议使用唯一名称，例如「${suggested}」。您也可返回修改后重新提交。`
    ruleBlocker.value = {
      type: 'dupName',
      source,
      message: msg,
      suggestedName: suggested,
      copySourceRow: copySourceRow || null
    }
  } else {
    const row = v.row
    const msg = `指标「${row.metricName || row.metricCode}」已有启用的规则「${row.name}」。同一指标下不能同时存在多条启用规则。可停用或编辑现有规则、改为试运行、或选择其他指标。`
    ruleBlocker.value = {
      type: 'metricConflict',
      source,
      message: msg,
      conflictRow: row
    }
  }
  ruleBlockerVisible.value = true
}

function clearRuleBlocker() {
  ruleBlocker.value = null
}

function applyRuleBlockerSuggestedName() {
  const rb = ruleBlocker.value
  if (!rb?.suggestedName) {
    ruleBlockerVisible.value = false
    clearRuleBlocker()
    return
  }
  const name = rb.suggestedName
  if (rb.source === 'form') {
    formDialogRef.value?.setRuleName(name)
  } else if (rb.source === 'template') {
    templateApplyRef.value?.applySuggestedName(name)
  } else if (rb.source === 'copy' && rb.copySourceRow) {
    const v2 = validateNewRule(list.value, {
      name,
      metricCode: rb.copySourceRow.metricCode
    })
    if (!v2.ok) {
      showRuleBlocker(v2, { source: 'copy', copySourceRow: rb.copySourceRow })
      return
    }
    finalizeRuleCopy(rb.copySourceRow, name)
  }
  ruleBlockerVisible.value = false
  clearRuleBlocker()
}

function editConflictRule() {
  const row = ruleBlocker.value?.conflictRow
  const src = ruleBlocker.value?.source
  ruleBlockerVisible.value = false
  clearRuleBlocker()
  if (!row) return
  if (src === 'template') {
    templateApplyVisible.value = false
    systemMapVisible.value = false
  }
  mainTab.value = 'list'
  openEdit(row)
}

function onTemplateRuleCreated({ payload, eventPreview }) {
  const v = validateNewRule(list.value, { name: payload.name, metricCode: payload.metricCode })
  if (!v.ok) {
    showRuleBlocker(v, { source: 'template' })
    return
  }
  const lm = levelMeta(payload.level)
  list.value.unshift({
    id: `rr-${Date.now()}`,
    ...payload,
    levelLabel: lm.labelShort,
    levelTag: lm.tag,
    status: 'enabled',
    lifecycleStatus: payload.runMode === 'trial' ? 'trial' : 'production',
    version: 1,
    versionLabel: 'v1',
    versionHistory: [],
    deleted: false,
    eventPreview: eventPreview || ''
  })
  mainTab.value = 'list'
  page.value = 1
  const modeText = payload.runMode === 'trial' ? '试运行' : '正式运行'
  createSuccessTip.value = `规则「${payload.name}」创建成功，当前为${modeText}状态`
  selectedTemplate.value = null
  templateApplyVisible.value = false
  systemMapVisible.value = false
  ElMessage.success('规则已创建')
}

function formatVersionTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function openVersionHistory(row) {
  const raw = Array.isArray(row.versionHistory) ? row.versionHistory : []
  const rows = [...raw].sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
  versionHistoryContext.value = { name: row.name || '规则', rows }
  versionHistoryVisible.value = true
}

const filteredRows = computed(() => {
  let rows = list.value.filter((r) => !r.deleted)
  if (filterMetric.value) rows = rows.filter((r) => r.metricCode === filterMetric.value)
  if (filterLevel.value !== '' && filterLevel.value != null)
    rows = rows.filter((r) => r.level === filterLevel.value)
  if (filterStatus.value) rows = rows.filter((r) => r.status === filterStatus.value)
  if (filterName.value.trim()) {
    const q = filterName.value.trim().toLowerCase()
    rows = rows.filter((r) => r.name.toLowerCase().includes(q))
  }
  return rows
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

function resetFilters() {
  filterName.value = ''
  filterMetric.value = ''
  filterLevel.value = ''
  filterStatus.value = ''
  page.value = 1
}

function openCreate() {
  mainTab.value = 'list'
  formMode.value = 'create'
  editingRecord.value = null
  formVisible.value = true
}

function openEdit(row) {
  formMode.value = 'edit'
  editingRecord.value = row
  formVisible.value = true
}

function openTest(row) {
  testingRule.value = { ...row }
  testVisible.value = true
}

function onFormTest(payload) {
  testingRule.value = { ...payload }
  testVisible.value = true
}

function openTrialLog(row) {
  trialLogRule.value = row
  trialLogVisible.value = true
}

function finalizeRuleCopy(row, newName) {
  const copy = JSON.parse(JSON.stringify(row))
  delete copy.versionHistory
  copy.sector = sectorCodeForMetricCode(copy.metricCode)
  copy.sectorLabel = sectorLabelForMetricCode(copy.metricCode)
  list.value.unshift({
    ...copy,
    id: `rr-${Date.now()}`,
    name: newName,
    version: 1,
    versionLabel: 'v1',
    versionHistory: [],
    status: 'enabled',
    deleted: false
  })
  mainTab.value = 'list'
  page.value = 1
  ElMessage.success('已复制，可在列表中编辑')
}

async function copyRule(row) {
  let newName
  try {
    const { value } = await ElMessageBox.prompt('请为复制后的规则输入新名称', '复制规则', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '新规则名称',
      inputValue: '',
      inputValidator: (v) => !!(v && String(v).trim()),
      inputErrorMessage: '名称不能为空'
    })
    newName = String(value).trim()
  } catch {
    return
  }
  if (!newName) return
  const v = validateNewRule(list.value, { name: newName, metricCode: row.metricCode })
  if (!v.ok) {
    showRuleBlocker(v, { source: 'copy', copySourceRow: row })
    return
  }
  finalizeRuleCopy(row, newName)
}

async function deleteCurrentVersion(row) {
  const ver = row.versionLabel || `v${row.version || 1}`
  const msg = `确认删除规则「${row.name}」的当前生效版本（${ver}）？删除后不再参与预警计算。（软删除，可通过导出备份恢复）`
  try {
    await ElMessageBox.confirm(msg, '删除规则', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  row.deleted = true
  if (editingRecord.value?.id === row.id) {
    formVisible.value = false
    editingRecord.value = null
  }
  ElMessage.success('已删除当前版本')
}

function onFormSaved(payload) {
  const ex = formMode.value === 'edit' && editingRecord.value ? editingRecord.value.id : undefined
  const v = validateNewRule(
    list.value,
    { name: payload.name, metricCode: payload.metricCode },
    { excludeRuleId: ex }
  )
  if (!v.ok) {
    showRuleBlocker(v, { source: 'form' })
    return
  }
  formVisible.value = false
  ElMessage.success(formMode.value === 'edit' ? '已保存，版本号已更新' : '已新增规则')
  if (formMode.value === 'create') {
    const lm = levelMeta(payload.level)
    list.value.unshift({
      id: `rr-${Date.now()}`,
      ...payload,
      levelLabel: lm.labelShort,
      levelTag: lm.tag,
      status: 'enabled',
      lifecycleStatus: payload.runMode === 'trial' ? 'trial' : 'production',
      version: 1,
      versionLabel: 'v1',
      versionHistory: [],
      deleted: false
    })
    page.value = 1
  } else if (editingRecord.value) {
    const idx = list.value.findIndex((r) => r.id === editingRecord.value.id)
    if (idx !== -1) {
      const prev = list.value[idx]
      const nextVer = (prev.version || 1) + 1
      const hist = Array.isArray(prev.versionHistory) ? [...prev.versionHistory] : []
      hist.push({
        version: prev.version || 1,
        versionLabel: prev.versionLabel || 'v1',
        savedAt: new Date().toISOString(),
        name: prev.name,
        expressionDisplay: prev.expressionDisplay || prev.expression
      })
      const lm = levelMeta(payload.level)
      list.value[idx] = {
        ...prev,
        ...payload,
        levelLabel: lm.labelShort,
        levelTag: lm.tag,
        id: prev.id,
        version: nextVer,
        versionLabel: `v${nextVer}`,
        versionHistory: hist,
        lifecycleStatus: payload.runMode === 'trial' ? 'trial' : 'production'
      }
    }
  }
}

function onToggleStatus(row, enabled) {
  row.status = enabled ? 'enabled' : 'disabled'
  ElMessage.success(enabled ? '已启用' : '已停用（不再参与计算）')
}

function triggerImport() {
  fileInputRef.value?.click()
}

function onImportFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result)
      const arr = Array.isArray(data) ? data : data.rules
      if (!Array.isArray(arr)) throw new Error('invalid')
      let n = 0
      arr.forEach((item) => {
        if (!item.name || !item.metricCode) return
        const lm = levelMeta(item.level || 3)
        list.value.unshift({
          id: `rr-${Date.now()}-${n}`,
          ...item,
          sector: item.sector || sectorCodeForMetricCode(item.metricCode),
          sectorLabel: item.sectorLabel || sectorLabelForMetricCode(item.metricCode),
          levelLabel: item.levelLabel || lm.labelShort,
          levelTag: item.levelTag || lm.tag,
          version: item.version || 1,
          versionLabel: item.versionLabel || 'v1',
          versionHistory: Array.isArray(item.versionHistory) ? item.versionHistory : [],
          status: item.status || 'enabled',
          deleted: false,
          expressionDisplay: item.expressionDisplay || item.expression
        })
        n += 1
      })
      mainTab.value = 'list'
      ElMessage.success(`已导入 ${n} 条规则`)
    } catch {
      ElMessage.error('JSON 格式错误')
    }
  }
  reader.readAsText(file, 'UTF-8')
}

function exportJson() {
  const rows = filteredRows.value.map((r) => {
    const { id, deleted, ...rest } = r
    return rest
  })
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `risk-rules-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function stripFocusRuleQuery() {
  if (!route.query.focusRule) return
  const q = { ...route.query }
  delete q.focusRule
  router.replace({ path: route.path, query: q }).catch(() => {})
}

function applyFocusRule(ruleId) {
  const row = list.value.find((r) => !r.deleted && r.id === ruleId)
  if (!row) {
    ElMessage.warning('未找到对应规则')
    stripFocusRuleQuery()
    return
  }
  resetFilters()
  nextTick(() => {
    const rows = filteredRows.value
    const idx = rows.findIndex((r) => r.id === ruleId)
    if (idx >= 0) {
      page.value = Math.floor(idx / pageSize.value) + 1
    }
    mainTab.value = 'list'
    nextTick(() => {
      openEdit(row)
      stripFocusRuleQuery()
    })
  })
}

watch(
  () => route.query.focusRule,
  (id) => {
    if (!id) return
    applyFocusRule(String(id))
  },
  { immediate: true }
)
</script>

<style scoped>
.risk-rules-page :deep(.risk-rule-actions-col .cell) {
  white-space: nowrap;
}

.risk-rule-main-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.risk-rule-main-tabs :deep(.el-tabs__content) {
  padding-top: 16px;
}

.template-card {
  min-height: 200px;
}
</style>
