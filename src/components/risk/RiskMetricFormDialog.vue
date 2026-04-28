<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="720px"
    destroy-on-close
    class="risk-metric-form-dialog"
    align-center
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-scrollbar max-height="72vh">
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="108px"
        label-position="right"
        class="metric-form pr-3"
        :disabled="isView"
      >
        <!-- 基本信息 -->
        <div class="metric-form-card">
          <div class="metric-form-card__head">
            <span class="metric-form-card__title"><span aria-hidden="true">📋</span> 基本信息</span>
            <span class="text-xs text-gray-400">必填项已标记 *</span>
          </div>
          <div class="metric-form-card__body">
            <el-form-item label="指标名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入指标名称" maxlength="64" show-word-limit />
            </el-form-item>
            <el-form-item label="指标编码" prop="code">
              <div class="flex flex-wrap items-stretch gap-2 w-full min-w-0">
                <el-input
                  v-model="form.code"
                  placeholder="唯一标识，创建后不可修改"
                  :disabled="isEdit"
                  class="flex-1 min-w-[200px]"
                />
                <el-button v-if="!isEdit && !isView" type="primary" plain class="shrink-0" @click="autoCode">
                  自动生成
                </el-button>
              </div>
              <p class="text-xs text-gray-500 mt-1.5 leading-relaxed">
                编码格式：板块-指标分类-流水号；创建后不可修改。
              </p>
            </el-form-item>
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="业务板块" prop="sector">
                  <el-select v-model="form.sector" placeholder="请选择" class="w-full" :disabled="isEdit">
                    <el-option
                      v-for="s in SECTOR_OPTIONS"
                      :key="s.value"
                      :label="s.label"
                      :value="s.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item v-if="!isEdit && !isView" label="指标分类" prop="metricCategory">
                  <el-select v-model="form.metricCategory" placeholder="请选择" class="w-full">
                    <el-option
                      v-for="t in METRIC_CATEGORY_OPTIONS"
                      :key="t.value"
                      :label="t.label"
                      :value="t.value"
                    >
                      <div v-if="t.desc" class="py-0.5">
                        <div>{{ t.label }}</div>
                        <div class="text-xs text-gray-400 leading-tight max-w-sm">{{ t.desc }}</div>
                      </div>
                      <span v-else>{{ t.label }}</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item v-else label="指标分类">
                  <el-input :model-value="categoryLabel" disabled class="w-full" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="单位">
              <div class="flex flex-wrap items-center gap-2 w-full">
                <el-input v-model="form.unit" placeholder="如 kWh、%、次、条" maxlength="16" class="max-w-xs" />
                <el-tooltip
                  content="支持自定义单位，如 kWh、%、次、条等"
                  placement="top"
                >
                  <span class="text-gray-400 text-sm cursor-help shrink-0">💡</span>
                </el-tooltip>
              </div>
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="指标说明" />
            </el-form-item>
          </div>
        </div>

        <!-- 数据源配置 -->
        <div class="metric-form-card">
          <div class="metric-form-card__head">
            <span class="metric-form-card__title"><span aria-hidden="true">🔌</span> 数据源配置</span>
          </div>
          <div class="metric-form-card__body">
            <el-form-item label="数据源类型">
              <el-radio-group v-model="form.dataSourceType" class="flex flex-wrap gap-x-4 gap-y-2">
                <el-radio label="API">API</el-radio>
                <el-radio label="DB_MYSQL">数据库 MySQL</el-radio>
                <el-radio label="DB_DM">数据库 达梦</el-radio>
                <el-radio label="MQ_KAFKA">MQ Kafka</el-radio>
              </el-radio-group>
            </el-form-item>

            <div
              v-if="form.dataSourceType === 'API'"
              class="rounded-lg border p-3 mb-2 ds-source-panel"
              style="border-color: var(--yw-border); background: var(--yw-bg-page)"
            >
              <div class="text-xs font-medium text-gray-600 mb-2">API 配置</div>
              <el-form-item label="连接地址" prop="apiUrl">
                <div class="flex flex-wrap items-center gap-2 w-full">
                  <el-input v-model="form.apiUrl" placeholder="https://api.example.com/v1" class="flex-1 min-w-[220px]" />
                  <span v-if="urlFormatHint !== null" :class="urlFormatHint.ok ? 'text-emerald-600 text-sm' : 'text-amber-600 text-sm'">
                    {{ urlFormatHint.ok ? '✅ 格式正确' : '⚠️ 请填写有效 URL' }}
                  </span>
                </div>
              </el-form-item>
              <el-form-item label="认证方式">
                <el-radio-group v-model="form.authType" class="flex flex-wrap gap-x-4 gap-y-2">
                  <el-radio label="NONE">无认证</el-radio>
                  <el-radio label="BEARER">Bearer Token</el-radio>
                  <el-radio label="BASIC">Basic Auth</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="form.authType === 'BEARER'" label="Token" prop="apiToken">
                <div class="flex flex-wrap gap-2 w-full items-center">
                  <el-input
                    v-model="form.apiToken"
                    type="password"
                    show-password
                    placeholder="请输入 Token"
                    class="flex-1 min-w-[180px]"
                  />
                  <el-button
                    v-if="form.apiToken"
                    size="small"
                    :loading="tokenVerifying"
                    @click="verifyToken"
                  >
                    验证
                  </el-button>
                  <span v-if="tokenVerifyHint" class="text-sm text-emerald-600">{{ tokenVerifyHint }}</span>
                </div>
              </el-form-item>
              <template v-if="form.authType === 'BASIC'">
                <el-form-item label="用户名" prop="apiBasicUser">
                  <el-input v-model="form.apiBasicUser" placeholder="Basic 用户名" />
                </el-form-item>
                <el-form-item label="密码" prop="apiBasicPassword">
                  <el-input v-model="form.apiBasicPassword" type="password" show-password placeholder="Basic 密码" />
                </el-form-item>
              </template>
              <el-form-item label="API路径">
                <el-input v-model="form.apiPath" placeholder="/realtime（选填）" />
              </el-form-item>
              <el-form-item label="响应字段" prop="responsePath">
                <el-input v-model="form.responsePath" placeholder="$.data.powerValue" />
              </el-form-item>
              <el-row :gutter="16" class="metric-form__api-timeout-row">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="超时时间" prop="apiTimeoutSec">
                    <div class="flex items-center gap-2 w-full">
                      <el-input-number v-model="form.apiTimeoutSec" :min="1" :max="300" class="!w-full" controls-position="right" />
                      <span class="text-sm text-gray-500 shrink-0">秒</span>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :xs="24" :sm="12">
                  <el-form-item label="重试次数" prop="apiRetryCount">
                    <el-input-number v-model="form.apiRetryCount" :min="0" :max="10" class="!w-full" controls-position="right" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="采集频率" class="metric-form__item--tail">
                <div class="flex flex-wrap gap-2 w-full items-center">
                  <el-select v-model="form.collectFreq" class="w-44">
                    <el-option
                      v-for="f in COLLECT_FREQ_OPTIONS"
                      :key="f.value"
                      :label="f.label"
                      :value="f.value"
                    />
                  </el-select>
                  <span class="text-xs text-gray-500">选填，默认每60秒</span>
                  <el-input
                    v-if="form.collectFreq === 'cron'"
                    v-model="form.cronExpr"
                    placeholder="Cron 表达式"
                    class="flex-1 min-w-[180px]"
                  />
                </div>
              </el-form-item>
            </div>

            <div
              v-else-if="form.dataSourceType === 'DB_MYSQL' || form.dataSourceType === 'DB_DM'"
              class="rounded-lg border p-3 mb-2 space-y-3"
              style="border-color: var(--yw-border); background: var(--yw-bg-page)"
            >
              <div class="text-xs font-medium text-gray-600">数据库配置</div>

              <div class="ds-subcard">
                <div class="ds-subcard__head">
                  <span><span aria-hidden="true">📌</span> 连接配置</span>
                  <el-tag size="small" type="danger" effect="plain">必填 *</el-tag>
                </div>
                <div class="ds-subcard__body">
                  <el-form-item label="JDBC URL" prop="jdbcUrl">
                    <el-input v-model="form.jdbcUrl" :placeholder="jdbcPlaceholder" />
                  </el-form-item>
                  <p class="ds-subcard__hint">
                    <span aria-hidden="true">💡</span>
                    格式：{{ jdbcFormatHint }}
                  </p>
                  <el-form-item label="驱动类">
                    <el-select v-model="form.dbDriverPreset" class="w-full">
                      <el-option
                        v-for="o in dbDriverPresetOptions"
                        :key="o.value"
                        :label="o.label"
                        :value="o.value"
                      />
                    </el-select>
                    <p v-if="form.dbDriverPreset === 'auto'" class="text-xs text-gray-500 m-0 mt-2">
                      选填；保存时将按库类型写入默认驱动类。
                    </p>
                  </el-form-item>
                  <el-form-item
                    v-if="form.dbDriverPreset === 'custom'"
                    label=" "
                    prop="dbDriver"
                  >
                    <el-input v-model="form.dbDriver" placeholder="自定义 JDBC 驱动类全名" />
                  </el-form-item>
                </div>
              </div>

              <div class="ds-subcard">
                <div class="ds-subcard__head">
                  <span><span aria-hidden="true">🔐</span> 认证信息</span>
                  <el-tag size="small" type="danger" effect="plain">必填 *</el-tag>
                </div>
                <div class="ds-subcard__body">
                  <el-form-item label="用户名" prop="dbUser">
                    <el-input v-model="form.dbUser" placeholder="数据库用户名" />
                  </el-form-item>
                  <el-form-item label="密码" prop="dbPassword">
                    <div class="flex flex-wrap items-center gap-2 w-full">
                      <el-input
                        v-model="form.dbPassword"
                        type="password"
                        show-password
                        placeholder="数据库密码"
                        class="flex-1 min-w-[160px]"
                      />
                      <el-button :loading="dbTesting" @click="runDbTest">测试连接</el-button>
                      <span v-if="dbTestHint" class="text-sm text-emerald-600">{{ dbTestHint }}</span>
                    </div>
                  </el-form-item>
                </div>
              </div>

              <div class="ds-subcard">
                <div class="ds-subcard__head">
                  <span><span aria-hidden="true">📊</span> 数据查询</span>
                  <el-tag size="small" type="danger" effect="plain">必填 *</el-tag>
                </div>
                <div class="ds-subcard__body">
                  <el-form-item label="SQL查询" prop="sqlText">
                    <el-input v-model="form.sqlText" type="textarea" :rows="3" placeholder="SELECT ..." />
                  </el-form-item>
                  <p class="ds-subcard__hint">
                    <span aria-hidden="true">💡</span>
                    查询结果必须包含且仅一条记录
                  </p>
                </div>
              </div>

              <el-form-item label="采集频率" class="metric-form__item--tail">
                <div class="flex flex-wrap gap-2 w-full items-center">
                  <el-select v-model="form.collectFreq" class="w-44">
                    <el-option
                      v-for="f in COLLECT_FREQ_OPTIONS"
                      :key="f.value"
                      :label="f.label"
                      :value="f.value"
                    />
                  </el-select>
                  <span class="text-xs text-gray-500">选填，默认每60秒</span>
                  <el-input
                    v-if="form.collectFreq === 'cron'"
                    v-model="form.cronExpr"
                    placeholder="Cron 表达式"
                    class="flex-1 min-w-[180px]"
                  />
                </div>
              </el-form-item>
            </div>

            <div
              v-else-if="form.dataSourceType === 'MQ_KAFKA'"
              class="rounded-lg border p-3 mb-2 space-y-1"
              style="border-color: var(--yw-border); background: var(--yw-bg-page)"
            >
              <div class="text-xs font-medium text-gray-600 mb-2">MQ 配置</div>
              <el-form-item label="Bootstrap">
                <el-input v-model="form.mqBootstrap" placeholder="kafka:9092" />
              </el-form-item>
              <el-form-item label="Topic">
                <el-input v-model="form.mqTopic" placeholder="energy-meter-topic" />
              </el-form-item>
              <el-form-item label="消费组">
                <el-input v-model="form.mqConsumerGroup" placeholder="yw-risk-group" />
              </el-form-item>
              <el-form-item label="解析脚本">
                <el-input v-model="form.mqParseScript" type="textarea" :rows="3" placeholder="解析或映射脚本" />
              </el-form-item>
              <el-form-item label="采集频率" class="metric-form__item--tail">
                <div class="flex flex-wrap gap-2 w-full items-center">
                  <el-select v-model="form.collectFreq" class="w-44">
                    <el-option
                      v-for="f in COLLECT_FREQ_OPTIONS"
                      :key="f.value"
                      :label="f.label"
                      :value="f.value"
                    />
                  </el-select>
                  <el-input
                    v-if="form.collectFreq === 'cron'"
                    v-model="form.cronExpr"
                    placeholder="Cron 表达式"
                    class="flex-1 min-w-[180px]"
                  />
                </div>
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 快速测试 -->
        <div v-if="!isView" class="metric-form-card">
          <div class="metric-form-card__head">
            <span class="metric-form-card__title"><span aria-hidden="true">⚡</span> 快速测试</span>
          </div>
          <div class="metric-form-card__body">
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <el-button type="primary" plain :loading="testing" @click="runQuickTest">测试连接</el-button>
              <span v-if="quickTestMessage" class="text-sm text-gray-700">{{ quickTestMessage }}</span>
            </div>
            <div
              v-if="quickTestSample"
              class="rounded-lg border px-3 py-2 text-xs font-mono text-gray-700 break-all"
              style="border-color: var(--yw-border); background: #fafafa"
            >
              <span class="text-gray-500">数据预览：</span>{{ quickTestSample }}
            </div>
          </div>
        </div>

        <div
          v-if="!isView"
          class="rounded-lg border px-3 py-2 text-xs text-gray-600 mb-2"
          style="border-color: var(--yw-border); background: var(--yw-primary-bg)"
        >
          <span aria-hidden="true">💡</span>
          提示：创建指标后，需要配置规则才会触发预警。
        </div>
      </el-form>
    </el-scrollbar>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  COLLECT_FREQ_OPTIONS,
  createEmptyMetricForm,
  JDBC_DRIVER_DM,
  JDBC_DRIVER_MYSQL,
  LEGACY_METRIC_TYPE_TO_CATEGORY,
  METRIC_CATEGORY_OPTIONS,
  generateMetricCode,
  SECTOR_OPTIONS
} from '@/data/riskMetricsMock'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  record: { type: Object, default: null },
  existingCodes: { type: Array, default: () => [] },
  /** 从系统标准类型「快速创建」时预填名称、单位、数据源等 */
  metricPrefill: { type: Object, default: null }
})

const emit = defineEmits(['update:visible', 'saved'])

const formRef = ref(null)
const form = reactive(createEmptyMetricForm())
const testing = ref(false)
const dbTesting = ref(false)
const dbTestHint = ref('')
const tokenVerifying = ref(false)
const tokenVerifyHint = ref('')
const quickTestMessage = ref('')
const quickTestSample = ref('')
const initialSnapshot = ref('')

const isEdit = computed(() => props.mode === 'edit')
const isView = computed(() => props.mode === 'view')
const dialogTitle = computed(() => {
  if (isView.value) return '查看指标'
  return isEdit.value ? '编辑指标' : '新增指标'
})

const categoryLabel = computed(() => {
  const c = form.metricCategory || 'REALTIME'
  return METRIC_CATEGORY_OPTIONS.find((x) => x.value === c)?.label || c
})

const formRules = computed(() => {
  const r = {
    name: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
    code: [{ required: true, message: '请生成或填写指标编码', trigger: 'blur' }],
    sector: [{ required: true, message: '请选择业务板块', trigger: 'change' }]
  }
  if (!isEdit.value) {
    r.metricCategory = [{ required: true, message: '请选择指标分类', trigger: 'change' }]
  }
  if (form.dataSourceType === 'API') {
    r.apiUrl = [
      { required: true, message: '请输入连接地址', trigger: 'blur' },
      {
        validator: (_rule, val, cb) => {
          const s = (val || '').trim()
          if (!s) {
            cb()
            return
          }
          try {
            const u = new URL(s.includes('://') ? s : `https://${s}`)
            if (u.protocol === 'http:' || u.protocol === 'https:') cb()
            else cb(new Error('请填写以 http(s) 开头的有效 URL'))
          } catch {
            cb(new Error('请填写有效 URL'))
          }
        },
        trigger: 'blur'
      }
    ]
    r.responsePath = [{ required: true, message: '请输入响应字段（JSONPath）', trigger: 'blur' }]
    r.apiTimeoutSec = [
      {
        validator: (_rule, val, cb) => {
          const n = Number(val)
          if (!Number.isFinite(n) || n < 1) cb(new Error('超时时间须 ≥ 1 秒'))
          else cb()
        },
        trigger: 'change'
      }
    ]
    r.apiRetryCount = [
      {
        validator: (_rule, val, cb) => {
          const n = Number(val)
          if (!Number.isFinite(n) || n < 0) cb(new Error('重试次数须 ≥ 0'))
          else cb()
        },
        trigger: 'change'
      }
    ]
    if (form.authType === 'BEARER') {
      r.apiToken = [{ required: true, message: 'Bearer 模式下请填写 Token', trigger: 'blur' }]
    }
    if (form.authType === 'BASIC') {
      r.apiBasicUser = [{ required: true, message: '请填写 Basic 用户名', trigger: 'blur' }]
      r.apiBasicPassword = [{ required: true, message: '请填写 Basic 密码', trigger: 'blur' }]
    }
  }
  if (form.dataSourceType === 'DB_MYSQL' || form.dataSourceType === 'DB_DM') {
    r.jdbcUrl = [{ required: true, message: '请输入 JDBC URL', trigger: 'blur' }]
    r.dbUser = [{ required: true, message: '请输入数据库用户名', trigger: 'blur' }]
    r.dbPassword = [{ required: true, message: '请输入数据库密码', trigger: 'blur' }]
    r.sqlText = [{ required: true, message: '请输入 SQL 查询', trigger: 'blur' }]
    r.dbDriver = [
      {
        validator: (_rule, val, cb) => {
          if (form.dbDriverPreset !== 'custom') {
            cb()
            return
          }
          if ((val || '').trim()) cb()
          else cb(new Error('请填写驱动类全名'))
        },
        trigger: 'blur'
      }
    ]
  }
  return r
})

const dbDriverPresetOptions = computed(() => {
  if (form.dataSourceType === 'DB_DM') {
    return [
      { label: '自动识别 (达梦)', value: 'auto' },
      { label: '自定义', value: 'custom' }
    ]
  }
  return [
    { label: '自动识别 (MySQL)', value: 'auto' },
    { label: '自定义', value: 'custom' }
  ]
})

const jdbcPlaceholder = computed(() =>
  form.dataSourceType === 'DB_DM' ? 'jdbc:dm://host:5236/DAMENG' : 'jdbc:mysql://host:3306/db'
)

const jdbcFormatHint = computed(() =>
  form.dataSourceType === 'DB_DM'
    ? 'jdbc:dm://主机:端口/数据库名'
    : 'jdbc:mysql://主机:端口/数据库名'
)

const urlFormatHint = computed(() => {
  if (form.dataSourceType !== 'API') return null
  const s = (form.apiUrl || '').trim()
  if (!s) return null
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`)
    return u.protocol === 'http:' || u.protocol === 'https:' ? { ok: true } : { ok: false }
  } catch {
    return { ok: false }
  }
})

function snapshotPayload() {
  return JSON.stringify(formToPayload())
}

function defaultDbDriverFor(dataSourceType) {
  return dataSourceType === 'DB_DM' ? JDBC_DRIVER_DM : JDBC_DRIVER_MYSQL
}

function inferDbDriverPreset(c, dataSourceType) {
  if (c.dbDriverPreset === 'custom' || c.dbDriverPreset === 'auto') return c.dbDriverPreset
  if (dataSourceType !== 'DB_MYSQL' && dataSourceType !== 'DB_DM') {
    return 'auto'
  }
  const d = (c.dbDriver || '').trim()
  const expect = defaultDbDriverFor(dataSourceType)
  if (!d || d === expect) return 'auto'
  return 'custom'
}

function resolvedDbDriver() {
  if (form.dbDriverPreset === 'custom') return (form.dbDriver || '').trim()
  return defaultDbDriverFor(form.dataSourceType)
}

function rowToForm(row) {
  const c = row.config || {}
  const mid = row.code?.split('-')[1] || 'REALTIME'
  const metricCategory = LEGACY_METRIC_TYPE_TO_CATEGORY[mid] || 'REALTIME'
  const dst = row.dataSourceType
  Object.assign(form, createEmptyMetricForm(), {
    name: row.name,
    code: row.code,
    sector: row.sector,
    metricCategory,
    metricType: metricCategory,
    unit: row.unit,
    description: row.description || '',
    status: row.status,
    dataSourceType: dst,
    apiUrl: c.apiUrl || '',
    apiMethod: c.apiMethod || 'GET',
    authType: c.authType || 'NONE',
    apiToken: c.apiToken || '',
    apiBasicUser: c.apiBasicUser || '',
    apiBasicPassword: c.apiBasicPassword || '',
    apiPath: c.apiPath || '',
    responsePath: c.responsePath || '',
    apiTimeoutSec: c.apiTimeoutSec ?? 30,
    apiRetryCount: c.apiRetryCount ?? 3,
    jdbcUrl: c.jdbcUrl || '',
    dbDriverPreset: inferDbDriverPreset(c, dst),
    dbDriver: c.dbDriver || defaultDbDriverFor(dst),
    dbUser: c.dbUser || '',
    dbPassword: c.dbPassword || '',
    sqlText: c.sqlText || '',
    mqTopic: c.mqTopic || '',
    mqBootstrap: c.mqBootstrap || '',
    mqConsumerGroup: c.mqConsumerGroup || 'yw-risk-group',
    mqParseScript: c.mqParseScript || '',
    collectFreq: c.collectFreq || '60s',
    cronExpr: c.cronExpr || ''
  })
}

function formToPayload() {
  const dataSourceName =
    form.dataSourceType === 'API'
      ? 'API_配置'
      : form.dataSourceType.startsWith('DB')
        ? 'DB_配置'
        : 'MQ_配置'
  return {
    name: form.name,
    code: form.code,
    sector: form.sector,
    sectorLabel: SECTOR_OPTIONS.find((s) => s.value === form.sector)?.label,
    unit: form.unit,
    description: form.description,
    status: form.status,
    dataSourceType: form.dataSourceType,
    dataSourceName,
    metricCategory: form.metricCategory,
    referencedByRules: props.record?.referencedByRules ?? 0,
    config: {
      apiUrl: form.apiUrl,
      apiMethod: form.apiMethod,
      authType: form.authType,
      apiToken: form.apiToken,
      apiBasicUser: form.apiBasicUser,
      apiBasicPassword: form.apiBasicPassword,
      apiPath: form.apiPath,
      responsePath: form.responsePath,
      apiTimeoutSec: form.apiTimeoutSec,
      apiRetryCount: form.apiRetryCount,
      jdbcUrl: form.jdbcUrl,
      dbDriverPreset: form.dbDriverPreset,
      dbDriver:
        form.dataSourceType === 'DB_MYSQL' || form.dataSourceType === 'DB_DM'
          ? resolvedDbDriver()
          : form.dbDriver,
      dbUser: form.dbUser,
      dbPassword: form.dbPassword,
      sqlText: form.sqlText,
      mqTopic: form.mqTopic,
      mqBootstrap: form.mqBootstrap,
      mqConsumerGroup: form.mqConsumerGroup,
      mqParseScript: form.mqParseScript,
      collectFreq: form.collectFreq,
      cronExpr: form.cronExpr
    }
  }
}

function autoCode() {
  form.metricType = form.metricCategory
  const codes =
    props.mode === 'edit' && props.record
      ? props.existingCodes.filter((c) => c !== props.record.code)
      : props.existingCodes
  form.code = generateMetricCode(form.sector, form.metricCategory, codes)
}

watch(
  () => form.metricCategory,
  (c) => {
    if (!isEdit.value) form.metricType = c
  }
)

watch(
  () => props.visible,
  async (v) => {
    tokenVerifyHint.value = ''
    quickTestMessage.value = ''
    quickTestSample.value = ''
    if (!v) return
    if (props.record) rowToForm(props.record)
    else {
      Object.assign(form, createEmptyMetricForm())
      const pf = props.metricPrefill
      if (pf) {
        if (pf.name) form.name = pf.name
        if (pf.unit) form.unit = pf.unit
        if (pf.dataSourceType) form.dataSourceType = pf.dataSourceType
        if (pf.sector) form.sector = pf.sector
        if (pf.description) form.description = pf.description
      }
      autoCode()
    }
    await nextTick()
    initialSnapshot.value = snapshotPayload()
  }
)

watch(
  () => form.dataSourceType,
  () => {
    tokenVerifyHint.value = ''
    quickTestMessage.value = ''
    quickTestSample.value = ''
    dbTestHint.value = ''
    if (form.dataSourceType === 'DB_MYSQL' || form.dataSourceType === 'DB_DM') {
      if (form.dbDriverPreset === 'auto') {
        form.dbDriver = defaultDbDriverFor(form.dataSourceType)
      }
    }
  }
)

watch(
  () => form.authType,
  () => {
    tokenVerifyHint.value = ''
  }
)

watch(
  () => form.dbDriverPreset,
  (p) => {
    if (p === 'auto' && (form.dataSourceType === 'DB_MYSQL' || form.dataSourceType === 'DB_DM')) {
      form.dbDriver = defaultDbDriverFor(form.dataSourceType)
    }
  }
)

function verifyToken() {
  tokenVerifying.value = true
  tokenVerifyHint.value = ''
  setTimeout(() => {
    tokenVerifying.value = false
    tokenVerifyHint.value = '✅ 验证成功'
    ElMessage.success('Token 校验通过（模拟）')
  }, 400)
}

function runQuickTest() {
  testing.value = true
  quickTestMessage.value = ''
  quickTestSample.value = ''
  setTimeout(() => {
    testing.value = false
    quickTestMessage.value = '✅ 连接成功，获取到数据样例'
    quickTestSample.value =
      '{ "powerValue": 1471, "timestamp": "2026-04-24 15:32:13" }'
    ElMessage.success('测试通过（模拟）')
  }, 650)
}

function runDbTest() {
  dbTesting.value = true
  dbTestHint.value = ''
  setTimeout(() => {
    dbTesting.value = false
    dbTestHint.value = '✅ 连接成功'
    ElMessage.success('数据库连接成功（模拟）')
  }, 550)
}

async function handleBeforeClose(done) {
  if (isView.value) {
    done()
    return
  }
  const dirty = snapshotPayload() !== initialSnapshot.value
  if (!dirty) {
    done()
    return
  }
  try {
    await ElMessageBox.confirm('您有未保存的内容，确定要离开吗？', '确认离开', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '留在此页',
      distinguishCancelAndClose: true
    })
    initialSnapshot.value = snapshotPayload()
    emit('update:visible', false)
    done()
  } catch {
    /* 阻止关闭 */
  }
}

async function handleCancel() {
  const dirty = snapshotPayload() !== initialSnapshot.value
  if (!dirty) {
    emit('update:visible', false)
    return
  }
  try {
    await ElMessageBox.confirm('您有未保存的内容，确定要离开吗？', '确认离开', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '留在此页',
      distinguishCancelAndClose: true
    })
    initialSnapshot.value = snapshotPayload()
    emit('update:visible', false)
  } catch {
    /* 留在此页 */
  }
}

async function submit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  const payload = formToPayload()
  initialSnapshot.value = JSON.stringify(payload)
  emit('saved', payload)
  emit('update:visible', false)
  ElMessage.success(isEdit.value ? '已保存修改' : '已新增指标')
}
</script>

<style scoped>
.metric-form-card {
  border: 1px solid var(--yw-border);
  border-radius: 12px;
  background: var(--yw-bg-card);
  margin-bottom: 16px;
  overflow: hidden;
}
.metric-form-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--yw-bg-page);
  border-bottom: 1px solid var(--yw-border);
}
.metric-form-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--yw-text-primary);
}
.metric-form-card__body {
  padding: 16px 16px 14px;
}
.ds-source-panel {
  /* 避免子项 extra 间距与校验提示挤在一起 */
  display: flex;
  flex-direction: column;
  gap: 0;
}
.ds-subcard {
  border: 1px solid var(--yw-border);
  border-radius: 10px;
  background: var(--yw-bg-card);
  overflow: hidden;
}
.ds-subcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--yw-text-primary);
  background: var(--yw-bg-page);
  border-bottom: 1px solid var(--yw-border);
}
.ds-subcard__body {
  padding: 12px 12px 4px;
}
.ds-subcard__hint {
  margin: 0 0 14px;
  padding-left: 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
}
.metric-form__api-timeout-row {
  margin-bottom: 0;
}
.metric-form :deep(.el-form-item) {
  margin-bottom: 22px;
  align-items: flex-start;
}
.metric-form :deep(.el-form-item.metric-form__item--tail) {
  margin-bottom: 12px;
}
.metric-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}
/* 校验错误必须占用文档流，避免盖住下一行标签 */
.metric-form :deep(.el-form-item__error) {
  position: static !important;
  inset: auto !important;
  width: 100%;
  box-sizing: border-box;
  padding-top: 6px;
  line-height: 1.45;
  word-break: break-word;
}
</style>
