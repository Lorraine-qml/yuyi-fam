# 禹翼机管局平台 产品需求文档 V1.0

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| **产品名称** | 禹翼机管局平台（侧栏文案：禹翼机管局平台） |
| **版本号** | PRD **V1.0**（对齐当前前端实现：**package.json 0.1.0**；侧栏脚注显示 **2.0.0** 为演示口径，实现以后台/发布说明书为准） |
| **编制人/团队** | 产品/研发（本文档由 **代码逆向 + 产品设计目标** 整理，供开发与测试直接使用） |
| **更新日期** | 2026-05-07 |
| **目标用户** | 机管局/园区运维人员、安全管理值班、风险运营、系统管理员 |
| **核心价值** | 以**项目维度**统一管理安全事件、风险指标与规则、风险报告与定时推送，支撑从**指标→规则→事件→工单→通知**闭环；提供看板洞察与可追溯配置。 |

### 输入依据（已由 Cursor 盘点）

| 类别 | 路径/说明 |
|------|-----------|
| **前端仓库** | `yuyi-fam/` |
| **风险报告（提要）** | `docs/PRD-风险报告中心-V1.0.md` |
| **风险报告（详尽图示）** | `docs/PRD-风险报告中心-详尽附图版-V1.md` · `docs/PRD-风险报告中心-详尽附图版-V1.html` |
| **主要技术栈** | Vue 3 + Vite + Pinia + **Element Plus** + **TailwindCSS**；全局注册 **@smallwei/avue**（当前业务页以 Element Plus + 自研布局为主）；Axios (`src/utils/request.js`) |
| **路由入口** | `src/router/index.js` |
| **布局与菜单** | `src/layouts/AppLayout.vue`、`src/components/layout/LeftMenu.vue`、`AppHeader.vue` |
| **后端（本仓库）** | **未发现** Spring Boot/Java 源码目录；网络层已预留 `VITE_API_BASE`（默认 `/api`），部分能力为 **localStorage/mock** |

---

## 2. 产品概述

### 2.1 背景与目标

- **背景**：机关事业单位/园区场景的安防与风险运营需要统一的配置台、运营台与工作台。
- **目标**：实现可配置的风险监测与事件处置流程；报表可按模板生成并按渠道推送；数据按「当前选中项目」隔离（演示中为前端切换 + 本地持久化）。
- **实现现状**：核心业务界面已可实现端到端演示；后端持久化与安全认证需按本文档与中文章节验收标准补齐。

### 2.2 整体业务流程（文字）

1. **配置阶段**：维护 **风险指标** → 配置 **风险规则**（可试运行）→（可选）**事件分类**（超管）。  
2. **事件接入**：规则或第三方接入产生 **实时事件**。  
3. **推送**：按 **事件推送配置**（按分类、等级、来源）映射 **通知渠道**（与 **通知方式配置** 互补：一为事件策略一为渠道账户）。  
4. **处置**：事件可转 **工单**，在 **工作台** 多视图处理。  
5. **分析与报告**：**风险看板**看态势；**风险报告**模板 + 一键生成 + **定时任务** + 推送与执行历史（当前前端演示含完整交互与校验逻辑）。  

### 2.3 用户角色与权限矩阵（对齐当前代码）

| 能力 | 普通用户（演示口径） | 项目管理员（建议） | 系统超级管理员 `isSystemSuperAdmin` |
|------|---------------------|---------------------|--------------------------------------|
| 菜单「事件分类」 | 菜单隐藏（`LeftMenu` 过滤） | 隐藏 | **可见**；路由 `/risk/event-categories` |
| 事件分类页面 | 路由可访问时需二次拦截：页面级 `v-if=!isSystemSuperAdmin` **仅允许超管** | 拒绝 | **允许** |
| 工作台「导出当前列表」 | `disabled`（`isAdmin` 为 false） | 建议允许 | 允许 |
| 风险规则模板/系统模板管理 | `canManageTemplates` / `isSystemAdmin` 等组合（见组件内） | — | — |
| 其它已实现页面 | 当前 **未接登录**：默认均可操作 | — | — |

**重要说明**：`src/composables/useSystemAdmin.js` 中 **`isSystemSuperAdmin` 默认 `true`**（演示）；生产环境应替换为 SSO/角色接口。路由 meta `requiresSystemAdmin` **未在 `router.beforeEach` 强制校验**，与页面 `v-if` 并存——PRD **要求**：上线补上路由守卫或服务端校验。

---

## 3. 功能模块详情（按菜单层级）

### 全局壳（所有业务页共用）

#### 功能介绍  
提供侧边导航、顶栏、异常捕获告警、全局 **事件详情抽屉**、通知中心挂载点。

#### 界面描述  
- **左侧**：`LeftMenu`，宽 240px，可折叠为 64px；底部版本号 **2.0.0**（演示）。  
- **顶部**：`AppHeader`，随菜单折叠偏移；含系统时间、`el-select` **当前项目**、消息铃铛（未读徽章）、帮助、用户下拉。  
- **主区**：`router-view`，`padding: 24px`；捕获子组件异常时顶部 `el-alert`。  
- **全局组件**：`EventDetailDrawer`（不在每个页面单独声明）。

#### 交互逻辑  
- **项目切换**：`setCurrentProjectId` → localStorage key `yuyi-current-project-id` → 触发 `window` 事件 `yuyi-project-changed` → 订阅方刷新（如 `reloadReportState()`）。  
- **错误处理**：axios 拦截器：`code!==200` 时 `ElMessage.error`；网络错误同上。Vue `onErrorCaptured` 在主布局展示简短错误文案。

#### 验收标准  
- [ ] 切换项目后依赖项目的模块数据刷新且无串项。  
- [ ] Token 存在时请求头附带 `Authorization: Bearer <token>`（`request.js`）。  

---

### 3.1 占位模块（建设中）

路由指向 `ModulePlaceholder.vue`：**资产管理、物业管理、运营管理、能源管理、系统设置（用户/角色/日志）、个人中心、工单详情深链**。

#### 共性验收标准  
- [ ] 进入页面展示标题与子标题（`meta.subtitle`），无控制台致命错误。

---

### 3.2 首页

**路径**：`/dashboard`，`HomeDashboard.vue`

#### 功能介绍  
欢迎区 + 卡片导航 + 两块演示图表。

#### 界面描述  
- 渐变顶栏：`userLabel`、`roleLabel`（演示写死 「管理员」「园区运营经理」）、大号时钟。  
- 模块卡片：跳转各一级模块路径。  
- 图表：**近 7 日工单趋势**、**本月能耗概览**（`ChartContainer` + ECharts option）。

#### 验收标准  
- [ ] 卡片可到达对应路由；图表正常渲染。

---

### 3.3 安全管理 › 事件管理

#### 3.3.1 实时事件（`/security/events/realtime`）

| 小节 | 内容 |
|------|------|
| **功能介绍** | 展示当前项目下实时/近期事件清单与 KPI |
| **布局** | 标题；4 卡片 KPI；筛选卡片；表格卡片（右上 **导出/刷新**） |
| **筛选字段** | 事件分类（下拉）；事件等级（高/中/低）；来源（动态 options）；状态（全部/待处理/处理中/已闭环）；时间（不限/最近7天/30天）；**搜索/重置** |
| **表格** | 序号、分类、来源（标签+图标区分 rule 等）、事件描述、等级、状态、关联规则、首次时间、更新时间、位置、操作（**详情** 打开抽屉，`/event/detail/:id` 亦支持深链占位） |

**权限**：未见细粒度 RBAC。

**交互**  
- 点击详情：写入全局 Drawer 状态或通过路由打开（以 `RealtimeEventsPage` + `EventDetailDrawer` 实现为准）。

**验收**  
- [ ] 筛选联动分页或前端过滤逻辑正确（以代码 `pagedRows` 为准）。  
- [ ] 导出若为演示：`ElMessage.info` 可接受或替换为真实导出 API。

---

#### 3.3.2 事件推送配置（`/security/events/push-config`）

| 小节 | 内容 |
|------|------|
| **功能介绍** | 按「分类 × 等级 × 适用来源」配置推送策略，与通知渠道多选绑定 |
| **筛选** | 事件分类；事件等级；适用来源；**搜索/清空** |
| **工具栏** | **新增** |
| **表格列** | 序号、分类、等级(Tag)、适用来源、通知方式、生效时间、状态(Switch)、更新人、操作（查看/编辑/删除） |
| **弹窗**（查看/新增/编辑） | 表单分区：基本信息、触发条件摘要、通知方式 Checkbox（钉钉/短信/邮件/企业微信）、生效模式（永久/指定时间段+daterange）等——以 `EventPushConfigPage.vue` `editForm` 为准 |

**业务规则**：删除前 `ElMessageBox.confirm`。

**字段定义（逻辑实体 `event_push_config`）**  
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 是 | 事件分类编码 |
| level | enum | 是 | high/medium/low/urgent 等 |
| applicableSource | string | 条件 | 与来源过滤一致 |
| notifyChannels | string[] | 是 | ding/sms/email/wework |
| effectiveMode | enum | 是 | permanent / range |
| dateRange | date[] | 条件 | effectiveMode=range |
| enabled | boolean | 是 | |

**验收**  
- [ ] Switch 变更即时生效或调 API 成功回调。  

---

#### 3.3.3 通知方式配置（`/security/events/notify-method`）

见 **§4.1**（此处列页面级要点）。

- **筛选**：配置名称关键字；类型（钉钉/邮件/企业微信/短信）；测试状态（未测试/良好/失败）。  
- **工具栏**：下拉 **新增通知方式**（钉钉/邮件/企微/短信）；刷新。  
- **表格**：勾选列、序号、名称、类型、**启用(Tag)**、连通状态、最后测试时间、更新人；操作：**编辑 / 测试 / 删除**。  
- **抽屉表单**：邮件含 **SMTP 主机、端口、SSL、账号、密码、发件人**；钉钉/企微 **Webhook**；短信占位说明。  

**持久化**：`localStorage` `yuyi-notification-methods-v2`（演示）。

---

### 3.4 安全管理 › 事件工作台

五个路由共用 `WorkOrderWorkbenchPage.vue`，`meta.workOrderView`：`all | todo | initiated | done | closed`。

#### 功能介绍  
工单列表的运营台：筛选、分页、批量、导出（管理员）、自定义列、「更多」菜单。

#### 共性筛选（部分随 view 变化）  
状态、紧急程度、关键字、工单号、发起人（部分视图）、时间范围——以页面 `filters` ref 为准。

#### 共性表格（动态列可见性）  
含工单号、标题、关联事件、类型、优先级、节点、更新时间等；操作列：**查看 / 处理 / 认领** 等（随状态机）。

#### 交互  
- Tab 切换使用 `route.path` 绑定，点击切换 `router.push` 对应 path。  

#### 权限  
- 「导出当前列表」：`isAdmin===false` 时禁用。

#### 验收  
- [ ] 五个视图数据隔离逻辑正确（mock：`workOrderMock` 或与 API 对齐）。  

---

### 3.5 风险管理 › 风险看板（`/risk/dashboard`）

#### 功能介绍  
风险态势 KPI + 多维筛选 + 下钻占位。

#### 界面  
- **时间**：近24h / 近7日 / 近30日 / 自定义日期范围（`daterange`，`YYYY-MM-DD`）。  
- **过滤**：板块、等级。**刷新** 按钮 loading。  
- **KPI 卡片**：未处置、今日新增、处置中…（可点击 `openDrill`）。  
- **图表区**：分布、趋势、TOPN 等（ECharts）。

#### 业务规则  
- KPI 数据源当前为前端 mock：`riskDashboardMock` 或同源数据（以实际 import 为准）。  
- 接入后端时需定义 SLA 超时口径与「超时未处置」统计一致。

---

### 3.6 风险管理 › 风险指标（`/risk/metrics`）

#### 列表  
- **工具**：新增指标；导出(JSON)。  
- **筛选**：业务板块；指标名称（名称或编码）；状态（启用/停用）。  
- **表列**：勾选、编码、名称、板块、数据源、单位、状态(Switch)、操作（查看/编辑/测试/试运行日志/删除）。  
- **分页**：sizes 10/20/50。

#### 弹窗详情/编辑  
由 `RiskMetricsPage` 引用的表单/对话框组件承载（内含数据源类型、计算公式、MQTT/HTTP、试运行等段落——以模板为准）。

**验收**  
- [ ] 删除前有确认；停用 Switch 无副作用（或调 API）。

---

### 3.7 风险管理 › 风险规则（`/risk/rules`）

#### 3.7.1 规则列表 Tab

**工具栏**：新增规则；导出(JSON)。

**筛选**：规则名称关键字；关联指标；等级；事件分类；状态；**搜索/重置**。

**表列**：规则名称；所属板块；关联指标；表达式（代码样式）；等级(Tag)；状态(Switch)；事件分类；试运行(Tag)；操作（编辑/测试/版本历史/复制/**另存为模板**/试运行日志链接/删除）。

**分页**：10/20/50。

**来自路由的深度链接**：`/risk/rules?eventCategory=xxx`（面包屑回链事件分类）。

**冲突处理弹窗**：`ruleBlockerVisible`——规则重名或与同指标启用规则冲突时提示并可「使用建议名称」「编辑现有规则」。

**次要弹窗**  
| 名称 | 作用 |
|------|------|
| 另存为模板 | 输入模板名称 64 字内 → 写入本项目模板 |
| 导出本项目模板 | Checkbox 批量选 ID → JSON 导出 |
| 本项目模板批量管理 | 表格内编辑/删除 |
| 版本历史 | 表格：版本标签、归档时间、当时名称、当时表达式 |

**子组件**：`RiskRuleFormDialog`、`RiskRuleTestDialog`、`RiskRuleTrialLogDialog`、`RiskTemplateFormDialog`、系统模板相关 Dialog/Drawer 等——字段级定义以各组件 props + `riskRulesMock`/`riskRuleValidators` 为准。

#### 核心业务规则（需测试覆盖）

- **试运行 `runMode==='trial'`**：列表展示试运行 Tag；不产生真实事件或与后端约定降级。  
- **同指标启用规则唯一性**：与 `ruleBlocker` 对话框一致——保存时拦截。  

#### 验收（节选）  
- [ ] 搜索/分页与筛选叠加正确。  
- [ ] Switch 启用/停用不破坏版本链。  
- [ ] 「版本历史」在多次编辑后出现多条记录。

---

#### 3.7.2 规则模板库 Tab

**分段**：本项目模板卡片栅格（筛选板块/模板名）；系统模板映射区（管理员可见控件）。  

**每张卡片**：展示表达式、关联指标、`el-tag` 等级、**使用/编辑**。  

**验收**  
- [ ] 「使用」带入规则编辑器并预填表达式与指标绑定。

---

### 3.8 风险管理 › 事件分类（`/risk/event-categories`）

**权限**：菜单 + 页面均需 **超级管理员**。非管理员：`el-button` 回首页。

**列表筛选**：所属板块；状态(on/off)；分类名称关键字。  

**表列**：序号、名称、板块、关联规则数(可跳转规则列表筛选)、关联事件数(跳转实时事件)、可用等级摘要、描述、状态、操作(编辑/删除)。  

**弹窗**：维护名称、编码、板块、启用、允许等级 Checkbox 组、`el-input-tag` 或同类标签维护等——见 `EventCategoryManagePage.vue`。

---

### 3.9 风险管理 › 风险报告

父布局 `RiskReportLayout.vue`：子路由 tab（报告中心/模板管理/定时任务）。

**独立深化 PRD**：提要见 `docs/PRD-风险报告中心-V1.0.md`；极尽详版（界面截图占位、`docs/.attachments/`、逆向规则与小节级验收 ≥5）见 `docs/PRD-风险报告中心-详尽附图版-V1.md`。

#### 3.9.1 报告中心（`/risk/report/center`）

**三列栅格**：  
1) **快速生成**：周期下拉（`PERIOD_OPTIONS`）、只读「时间范围」说明、模板 `el-select`、`生成报告`、`导出`。  
2) **我的报告**：列表点击切换预览上下文；跳转链接。  
3) **定时任务**：展示前 3 条，`管理任务` 跳转 schedules。

**预览区**：`v-loading`；根据模板 `sections` 开关多块：概览卡、饼图、趋势、表格、柱状等；导出 PDF/Excel/Word、`推送` 打开对话框（演示勾选渠道 + 接收人）。

**业务规则**：`generateReport()` 超时模拟；超长周期提示 `MAX_REPORT_RANGE_DAYS`。

**验收**  
- [ ] `quick.period` 变更后可选模板筛选与周期类型一致。

---

#### 3.9.2 模板管理（`/risk/report/templates`）

- **系统模板**：只读卡片 + 「复制为项目」。  
- **项目模板**：编辑/启用/删除；`RiskReportTemplateDialog` 配置图表主题、大小、勾选章节等。

---

#### 3.9.3 定时任务（`/risk/report/schedules`）

参考近期迭代，需求要点：

**筛选**：任务名称；状态启用/停用；周期；最近执行结果(无记录/成功/部分成功/失败)；查询/重置。  

**表格列**：名称；推送渠道摘要；周期；执行时间；上次执行；状态；最近执行结果(可点开详情)；操作（启用Switch、编辑/执行/历史/删除）。

**执行任务**  
- **确认框**「立即执行」→ **全屏 Loading** → 调用 `executeScheduleTask`：**校验模板绑定、所选通知方式、SMTP/Webhook/收件人** → 写 **`scheduleExecutionLogs`**、`lastRunAt`、可按结果 **插入「我的报告」** → toast 区分成功/警告/失败。  

**执行历史 Drawer**：表格列执行时间、结果、报告大小、渠道、接收人、详情弹窗。

**编辑/新建**：`RiskReportScheduleDialog.vue`：**推送设置** 多选 `listMethodsForSchedulePush()`，分渠道收件人，状态启停。

**持久化**：`riskReportProjectState.js`：`yuyi-risk-report-proj-{projectId}` JSON：`projectTemplates, schedules, myReports, scheduleExecutionLogs`。

---

### 3.10 试运行日志（`/risk/trial-logs`）

**顶部 KPI**：四卡片。

**筛选**：日期范围；业务板块；指标；是否触发；等级；触发结果；**查询/重置/批量导出**。

**表格与详情**：参见 `RiskTrialLogsPage.vue` mock 数据结构。

---

### 3.11 路由深链与其它

| 路由 | 说明 |
|------|------|
| `/event/detail/:id` | `EventDetailDeepLink`——打开 Drawer 占位 |
| `/risk-rules` → `/risk/rules` | 兼容重定向 |
| `/workorder/detail/:id` | 占位 |

---

## 4. 公共服务组件

### 4.1 通知方式配置（复用）

- **被**：风险报告定时任务「推送设置」复用：`listMethodsForSchedulePush`、`getNotificationMethod`。  
- **排除**：可选渠道不含短信用于定时推送（mock 常量 `SCHEDULE_ALLOWED_TYPES`）。  
- **渠道失败**：测试状态 `fail` 的渠道不出现在定时任务多选列表。

### 4.2 事件详情 Drawer

全局挂载；通过 store/composable（以 `components/event/EventDetailDrawer.vue` 及相关 store 为准）打开；可与消息中心、`RealtimeEventsPage` **详情**联动。

### 4.3 消息中心 Drawer

`MessageCenterDrawer`：拉取分页消息（`src/api/notification.js`）；支持 mock `VITE_MOCK_NOTIFICATIONS`；标记已读/全部已读。

### 4.4 文件上传与预览

当前报告模块导出为模拟 success；暂未统一上传组件——**后端落地时**：需定义 PDF/Excel 临时 URL、STS、大小限制。

### 4.5 导入导出模板规范

- **风险规则**：`exportJson()` 导出项目规则 JSON（含版本元数据以代码为准）。  
- **本项目规则模板**：JSON，checkbox 勾选子集导出。  

### 4.6 定时任务执行引擎说明（目标架构）

**当前前端**：模拟 `scheduleExecutionMock.js`，日志对象字段对齐目标表：`schedule_execution_log`（用户曾给 DDL 草案：`id, schedule_id, execute_time, status, file_size_kb, push_channels, receivers, error_message` + 前端扩展 `detail, push_target_count, task_name`）。  

**生产**：由调度器触发 Job → **报告服务**生成文件 → **通知网关** SMTP/Webhook → **写日志表**。

---

## 5. 数据字典

### 5.1 枚举（摘自代码约定）

| 枚举 | 取值 | 说明 |
|------|------|------|
| 事件等级 | high, medium, low, urgent… | Tag 色系映射见各页 |
| 规则等级 | RULE_LEVEL_OPTIONS | value + labelShort + Tag |
| 规则状态 | enabled / disabled | |
| 报告周期 PERIOD_OPTIONS | day, week, month, quarter, year | |
| 定时任务 cycle | daily, weekly_mon, monthly_1, cron | |
| 日志 status | success, fail, partial | |
| 通知方式类型 | ding, mail, wework, sms | `NOTIFY_TYPE_META` |

### 5.2 核心本地存储 Keys

| Key | 用途 |
|-----|------|
| `yuyi-current-project-id` | 当前项目 |
| `yuyi-risk-report-proj-{projectId}` | 报告模板/任务/报告/执行日志 |
| `yuyi-notification-methods-v2` | 通知方式配置 |

### 5.3 目标服务端表（与演示字段对齐）

- **`schedule_execution_log`**：见 §4.6。  
- **风险规则/指标/事件/工单/推送配置**：需后端定义；前端 mock 仅供参考（`src/data/*Mock.js`）。

---

## 6. 非功能性需求

### 6.1 性能  
- Axios **timeout 15000ms**；长列表分页；看板 Lazy tab。  

### 6.2 安全  
- 请求头 Bearer Token；权限由后端兜底；SMTP 密码不落日志明文。  

### 6.3 可维护性  
- 全局 `Vue.config.errorHandler`、路由 `router.onError` 打印。  

### 6.4 兼容性  
- 现代 Chromium/Edge/Firefox 最新两大版本；分辨率 ≥1280×720。  

---

## 7. 验收测试标准

### 7.1 功能用例清单（节选 BDD）

```gherkin
场景：项目上下文隔离
  假设 用户在控制台将项目从「黄浦机管局」切换为「浦东机管局」
  那么 定时任务列表与执行日志应与该项目存储键一致且无交叉数据

场景：定时任务手动执行失败-未配置SMTP
  假设 用户在通知方式移除邮件SMTP主机或任务未填收件人
  当 用户确认立即执行该任务
  那么 toast 报错或部分成功文案应准确
  并且 列表「最近执行结果」与历史中状态一致

场景：非超级管理员访问事件分类
  给定 isSystemSuperAdmin 设为 false
  当 用户打开 /risk/event-categories
  那么 页面应阻止维护并给出提示

场景：工作台导出受权限禁用
  给定 isAdmin 为 false
  那么 「导出当前列表」菜单项应 disabled
```

### 7.2 集成场景  
- 事件 →（mock）工单创建 API `POST /workorder/create-from-event/{eventId}` 与前端 `createWorkorderFromEvent` 一致。  

### 7.3 回归范围  
任一改动触及：`request.js`、`useCurrentProject`、`riskReportShared`、`riskReportProjectState`、`scheduleExecutionMock`、`notificationMethodMock`、`LeftMenu` 权限、`RiskRulesPage` 保存冲突逻辑，均需跑 §3 相关冒烟 + 定时任务全流程。

---

## 8. 附录

### 8.1 菜单树（源码 `LeftMenu.vue`）

- 首页；资产管理；物业管理；运营管理；能源管理  
- **安全管理** → **事件管理**（实时事件/事件推送配置/通知方式配置）  
- **工作台**（报修/待办/发起/已办/办结）  
- **风险管理**（看板/指标/规则/事件分类/报告›三子菜单/试运行日志）  
- **系统设置**（用户/权限/日志）  

### 8.2 API 快速参考（前端已声明）

| 方法 | URL | 说明 |
|------|-----|------|
| GET | `/risk/dashboard` | 风险看板（待接） |
| GET | `/risk/rules` | 规则列表 |
| POST | `/risk/rule` | 创建规则 |
| POST | `/workorder/create-from-event/{eventId}` | 由事件创建工单 |
| GET | `/notifications/unread-count` | 未读数 |
| GET | `/notifications/messages` | 消息分页 |
| PUT | `/notifications/messages/{id}/read` | 已读 |
| PUT | `/notifications/read-all` | 全部已读 |

其余数据当前多为 **前端 mock/localStorage**，以上接口 **code 必须为 200** 才视为成功。

### 8.3 变更记录  

| 版本 | 日期 | 说明 |
|------|------|------|
| V1.0 | 2026-05-07 | 首次根据 `yuyi-fam` 代码全量逆向；含风险报告定时执行与筛选、导出报告入口移除后记 |
| V1.0-patch | 2026-05-07 | 增补 `PRD-V1.0-详细规格-工作台与风险模块.md` 与 HTML 套件引用；工作台/风险深化以该文档为准 |
| V1.0-patch2 | 2026-05-07 | 新增风险报告独立 PRD：`PRD-风险报告中心-V1.0.md` |
| V1.0-patch3 | 2026-05-07 | 新增极尽详版 `PRD-风险报告中心-详尽附图版-V1.md`；HTML `PRD-product-requirements.html` §3.9/脚注同步 |
| **V2.0-merged-html** | 2026-05-07 | **总 PRD 单一详尽 HTML**：`docs/PRD-product-requirements.html` 已合并全 §3 模块（与风险报告详尽版同构：图示占位、字段、规则、≥5 验收）及 §4–§8，作为对外评审**推荐唯一入口** |
| **RR-PRD-V2** | 2026-05-08 | 风险报告中心 **极致详细 PRD v2.0** 已并入上述 HTML 的 **§3.9**（权限矩阵、逐界面交互、规则 1–22、GWT、API/DDL、推送整合）；详见该文件页内「3.9 · 风险报告 · 极致详细 PRD（V2.0）」 |

---

**文档结束。** 若需同步为 HTML 可先由 Markdown 渲染；更细粒度到「每个表单字段占位符/maxlength」请以对应 `.vue`/子组件源代码为单一事实来源（Single Source of Truth），在本 PRD 中按模块增量附录即可。
