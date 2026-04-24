/** 风险指标模拟数据与工具函数 */

export const SECTOR_OPTIONS = [
  { label: '能耗管理', value: 'ENERGY' },
  { label: '安全管理', value: 'SECURITY' },
  { label: '物业管理', value: 'PROPERTY' },
  { label: '资产管理', value: 'ASSET' },
  { label: '食堂管理', value: 'CANTEEN' },
  { label: '运营管理', value: 'OPERATION' }
]

/** @deprecated 新表单使用 METRIC_CATEGORY_OPTIONS；保留供旧数据/规则模板兼容 */
export const METRIC_TYPE_OPTIONS = [
  { label: '用电/能耗', value: 'POWER' },
  { label: '消防', value: 'FIRE' },
  { label: '巡检/检查', value: 'CHECK' },
  { label: '工单', value: 'WO' },
  { label: '自定义', value: 'CUSTOM' }
]

/** 指标分类（编码第二段，与业务板块组合生成指标编码） */
export const METRIC_CATEGORY_OPTIONS = [
  { label: '实时值', value: 'REALTIME' },
  { label: '比率值', value: 'RATIO' },
  { label: '累计值', value: 'CUMULATIVE' },
  { label: '状态值', value: 'STATE' }
]

/** 旧编码中段 → 指标分类（用于编辑回显） */
export const LEGACY_METRIC_TYPE_TO_CATEGORY = {
  POWER: 'REALTIME',
  FIRE: 'STATE',
  CHECK: 'STATE',
  WO: 'CUMULATIVE',
  CUSTOM: 'REALTIME',
  REALTIME: 'REALTIME',
  RATIO: 'RATIO',
  CUMULATIVE: 'CUMULATIVE',
  STATE: 'STATE'
}

export const DATA_SOURCE_TYPE_OPTIONS = [
  { label: 'API', value: 'API' },
  { label: '数据库 MySQL', value: 'DB_MYSQL' },
  { label: '数据库 达梦', value: 'DB_DM' },
  { label: 'MQ Kafka', value: 'MQ_KAFKA' }
]

export const COLLECT_FREQ_OPTIONS = [
  { label: '每30秒', value: '30s' },
  { label: '每60秒', value: '60s' },
  { label: '每1分钟', value: '1m' },
  { label: '每5分钟', value: '5m' },
  { label: '每1小时', value: '1h' },
  { label: '每天', value: '1d' },
  { label: 'Cron 自定义', value: 'cron' }
]

export const AUTH_TYPE_OPTIONS = [
  { label: '无', value: 'NONE' },
  { label: 'Bearer Token', value: 'BEARER' },
  { label: 'Basic', value: 'BASIC' }
]

let _seq = 100

function nextId() {
  _seq += 1
  return `rm-${_seq}`
}

/** JDBC 驱动默认值（与表单「自动识别」一致） */
export const JDBC_DRIVER_MYSQL = 'com.mysql.cj.jdbc.Driver'
export const JDBC_DRIVER_DM = 'dm.jdbc.driver.DmDriver'

export function createEmptyMetricForm() {
  return {
    name: '',
    code: '',
    sector: 'ENERGY',
    /** 指标分类，参与编码：板块-分类-流水号 */
    metricCategory: 'REALTIME',
    /** 兼容旧逻辑，与 metricCategory 同步 */
    metricType: 'REALTIME',
    unit: '',
    description: '',
    status: 'enabled',
    dataSourceType: 'API',
    apiUrl: '',
    apiMethod: 'GET',
    authType: 'NONE',
    apiToken: '',
    apiBasicUser: '',
    apiBasicPassword: '',
    apiPath: '',
    responsePath: '',
    apiTimeoutSec: 30,
    apiRetryCount: 3,
    jdbcUrl: '',
    /** auto：按库类型使用 JDBC_DRIVER_*；custom：使用 dbDriver 文本 */
    dbDriverPreset: 'auto',
    dbDriver: JDBC_DRIVER_MYSQL,
    dbUser: '',
    dbPassword: '',
    sqlText: '',
    mqTopic: '',
    mqBootstrap: '',
    mqConsumerGroup: 'yw-risk-group',
    mqParseScript: '',
    collectFreq: '60s',
    cronExpr: ''
  }
}

export function cloneMetric(m) {
  return JSON.parse(JSON.stringify(m))
}

/** 按板块+指标分类生成下一个编码（metricType 与 metricCategory 同义） */
export function generateMetricCode(sector, metricTypeOrCategory, existingCodes) {
  const seg = metricTypeOrCategory || 'REALTIME'
  const prefix = `${sector}-${seg}-`
  const nums = existingCodes
    .filter((c) => c.startsWith(prefix))
    .map((c) => {
      const part = c.split('-').pop()
      const n = parseInt(part, 10)
      return Number.isFinite(n) ? n : 0
    })
  const next = String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')
  return `${sector}-${seg}-${next}`
}

function row(
  code,
  name,
  sector,
  dataSourceName,
  dataSourceType,
  unit,
  status,
  referencedByRules,
  extra = {}
) {
  return {
    id: nextId(),
    code,
    name,
    sector,
    sectorLabel: SECTOR_OPTIONS.find((s) => s.value === sector)?.label ?? sector,
    dataSourceName,
    dataSourceType,
    unit,
    status,
    referencedByRules,
    deleted: false,
    description: extra.description ?? '',
    config: {
      apiUrl: extra.apiUrl ?? '',
      apiMethod: extra.apiMethod ?? 'GET',
      authType: extra.authType ?? 'NONE',
      apiToken: extra.apiToken ?? '',
      apiBasicUser: extra.apiBasicUser ?? '',
      apiBasicPassword: extra.apiBasicPassword ?? '',
      apiPath: extra.apiPath ?? '',
      responsePath: extra.responsePath ?? '',
      apiTimeoutSec: extra.apiTimeoutSec ?? 30,
      apiRetryCount: extra.apiRetryCount ?? 3,
      jdbcUrl: extra.jdbcUrl ?? '',
      dbDriverPreset: extra.dbDriverPreset ?? 'auto',
      dbDriver: extra.dbDriver ?? JDBC_DRIVER_MYSQL,
      dbUser: extra.dbUser ?? '',
      dbPassword: extra.dbPassword ?? '',
      sqlText: extra.sqlText ?? '',
      mqTopic: extra.mqTopic ?? '',
      mqBootstrap: extra.mqBootstrap ?? '',
      mqConsumerGroup: extra.mqConsumerGroup ?? '',
      mqParseScript: extra.mqParseScript ?? '',
      collectFreq: extra.collectFreq ?? '60s',
      cronExpr: extra.cronExpr ?? ''
    },
    ...extra
  }
}

export function seedRiskMetrics() {
  return [
    row(
      'ENERGY-POWER-001',
      '用电实时值',
      'ENERGY',
      'API_电能',
      'API',
      'kWh',
      'enabled',
      2,
      {
        description: '监测各配电室实时用电量',
        apiUrl: 'https://api.energy.com/v1',
        apiPath: '/realtime',
        responsePath: '$.data.powerValue',
        collectFreq: '30s'
      }
    ),
    row(
      'ENERGY-POWER-002',
      '用电突增率',
      'ENERGY',
      'API_电能',
      'API',
      '%',
      'enabled',
      1,
      {
        apiUrl: 'https://api.energy.com/v1',
        responsePath: '$.data.spikeRate',
        collectFreq: '1m'
      }
    ),
    row(
      'SECURITY-FIRE-001',
      '消防设备离线率',
      'SECURITY',
      'DB_消防',
      'DB_MYSQL',
      '%',
      'enabled',
      0,
      {
        jdbcUrl: 'jdbc:mysql://db.internal:3306/fire',
        sqlText: 'SELECT offline_rate FROM device_stats WHERE id=1',
        collectFreq: '5m'
      }
    ),
    row(
      'CANTEEN-CHECK-001',
      '晨检不合格次数',
      'CANTEEN',
      'API_食堂',
      'API',
      '次',
      'enabled',
      0,
      {
        apiUrl: 'https://api.canteen.internal/check',
        responsePath: '$.data.failCount',
        collectFreq: '1h'
      }
    ),
    row(
      'PROPERTY-WO-001',
      '待处理工单数',
      'PROPERTY',
      'DB_物业',
      'DB_MYSQL',
      '条',
      'disabled',
      0,
      {
        jdbcUrl: 'jdbc:mysql://db.internal:3306/property',
        sqlText: 'SELECT COUNT(*) FROM wo WHERE status="open"',
        collectFreq: '5m'
      }
    )
  ]
}

/** 生成更多占位行用于分页演示 */
export function expandMockRows(base) {
  const types = ['POWER', 'FIRE', 'CHECK', 'WO', 'CUSTOM']
  const out = [...base]
  let n = 6
  while (out.length < 24) {
    const sector = SECTOR_OPTIONS[n % SECTOR_OPTIONS.length].value
    const mt = types[n % types.length]
    const code = generateMetricCode(
      sector,
      mt,
      out.map((r) => r.code)
    )
    out.push(
      row(
        code,
        `演示指标 ${n}`,
        sector,
        n % 2 ? 'API_演示' : 'DB_演示',
        n % 2 ? 'API' : 'DB_MYSQL',
        n % 3 === 0 ? '%' : '次',
        n % 7 === 0 ? 'disabled' : 'enabled',
        n % 5 === 0 ? 1 : 0,
        { collectFreq: '5m' }
      )
    )
    n += 1
  }
  return out
}

/** 规则配置等下拉：关联指标 */
export function getMetricSelectOptions() {
  return expandMockRows(seedRiskMetrics()).map((m) => ({
    label: `${m.name} (${m.code})`,
    value: m.code,
    name: m.name,
    unit: m.unit || ''
  }))
}
