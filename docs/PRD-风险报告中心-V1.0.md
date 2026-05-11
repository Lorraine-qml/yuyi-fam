# 禹翼机管局平台 · 风险报告中心 — 产品需求文档（PRD）V1.0

## 一、背景资料

| 项目 | 内容 |
|------|------|
| **产品名称** | 禹翼机管局平台 — **风险管理模块 · 风险报告子系统** |
| **现有能力** | 风险指标、风险规则、事件分类、风险看板、实时事件、通知方式配置等 |
| **本 PRD 聚焦** | **风险报告中心**：报告模板管理、快速生成与预览/导出、我的报告（历史）、定时任务与执行历史、与通知渠道的推送整合 |
| **目标用户** | **系统超级管理员**（系统模板与跨项目策略）、**项目管理员**（本项目模板/任务/删除历史报告）、**业务用户**（只读：生成预览、下载本人可见报告，具体以后端策略为准） |
| **实现参考（前端）** | `src/views/risk/report/*`、`src/components/risk/RiskReportTemplateDialog.vue`、`RiskReportScheduleDialog.vue`、`src/data/riskReportMock.js`、`riskReportProjectState.js`；当前数据多为 **localStorage + mock**，本 PRD 作为**上线目标口径** |
| **详尽版（图示占位）** | `docs/PRD-风险报告中心-详尽附图版-V1.md` — 每张界面 `![界面截图…](.attachments/*.png)`、逐条逆向业务规则与每小节 ≥5 条验收 |
| **路由说明** | 任务书中的 `/report/*` 为逻辑分组；**当前实现路径**为 **`/risk/report/*`**（见 §3 各节）。若网关统一加 `/api` 前缀，仅作用于接口而非前端 history path。 |

### 1.1 已知 / 约定接口（REST 风格草案）

以下为**建议**资源设计；与现网/mock 对齐时 `baseURL = VITE_API_BASE`（默认 `/api`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/report/templates` | 分页列出模板（系统 + 当前项目，`project_id`/`tenant_id` 由上下文解析） |
| GET | `/report/templates/{id}` | 模板详情 |
| POST | `/report/templates` | 新建项目模板 |
| PUT | `/report/templates/{id}` | 更新项目模板 |
| PATCH | `/report/templates/{id}/status` | 启用/停用 |
| DELETE | `/report/templates/{id}` | 删除项目模板（系统模板禁止物理删除） |
| POST | `/report/templates/{id}/copy` | 复制为草稿（或直接由前端拼装 POST） |
| POST | `/report/generate` | 异步或同步生成报告：body 含 `template_id`、`period` 或 `date_from`/`date_to`、`project_id`、`format`(html/pdf/xlsx/docx 等) |
| GET | `/report/instances` | 历史报告列表（我的报告） |
| GET | `/report/instances/{id}/download` | 下载已生成文件（签名 URL 或 302） |
| DELETE | `/report/instances/{id}` | 删除历史记录及对象存储文件（权限受控） |
| GET | `/report/schedules` | 定时任务列表 |
| POST | `/report/schedules` | 新建任务 |
| PUT | `/report/schedules/{id}` | 更新任务 |
| PATCH | `/report/schedules/{id}/status` | 启用/停用 |
| DELETE | `/report/schedules/{id}` | 删除任务 |
| POST | `/report/schedules/{id}/execute` | **立即执行**（建议返回 `job_id`） |
| GET | `/report/schedules/{id}/executions` | 执行历史分页 |
| GET | `/notification/methods` | 已启用通知方式（供任务多选；可与现有通知模块合并） |

**响应约定**：业务成功 `code=200` + `data`；失败带 `message`；长时间任务先返回 `202` + `job_id`，前端轮询 `GET /report/jobs/{job_id}`（可选）。

---

## 二、PRD 总体要求

本文件以下各功能点均按 **同一结构** 展开：

1. **功能概述**（一句话）  
2. **主要用途**（业务场景）  
3. **界面布局**（文字或 ASCII）  
4. **字段定义**（表格：字段名 / 类型 / 必填 / 说明 / 示例）  
5. **交互流程**（编号步骤 + 系统响应）  
6. **权限要求**（超级管理员 / 项目管理员 / 业务用户）  
7. **业务规则与校验**  
8. **错误与异常处理**  
9. **验收标准**（≥3 条可测试用例）  

### 2.1 非功能性要求（全局）

| 类别 | 要求 |
|------|------|
| **性能** | 报告生成 **P95 ≤ 5s**（单项目、自然月数据量内；超出走异步 + 轮询/通知）；前端 **不阻塞主线程**，使用 `loading` / 进度条。 |
| **安全** | 邮件收件人格式校验；Webhook URL **禁止**随意请求内网与元数据地址（防 SSRF：域名白名单、禁止 127.0.0.0/8、私有网段等）；密钥仅在服务端解密。 |
| **并发** | 同一 `schedule_id` **同时仅允许一个执行实例**（分布式锁，如 Redis `SETNX` + TTL）。 |
| **审计** | 模板/任务/删除历史需记录操作人、时间（表字段见 §六）。 |

---

## 三、子模块详细需求

### 3.1 报告模板管理

#### 3.1.1 模板列表页

- **功能概述**：集中维护本项目报告模板及可见的系统预置模板，支持检索、筛选与生命周期操作。  
- **主要用途**：项目侧统一「出什么报告、出什么板块」标准，供快速生成与定时任务引用。  

- **路由（实现）**：`/risk/report/templates`（父布局：`RiskReportLayout`，与「报告中心」「定时任务」共用顶栏 Tab）  
- **任务书别名**：`/report/templates` → 实现时可通过路由重定向到上者。  

- **界面布局（ASCII）**

```
+------------------------------------------------------------------+
| 风险报告 > [报告中心] [模板管理] [定时任务]                         |
+------------------------------------------------------------------+
| [搜索: 模板名称____] [类型 v] [状态 v]  [刷新]                     |
| +----------------------------------------------------------------+
| | 表格：名称 | 类型 | 状态 | 系统/项目 | 最后修改 | 操作            |
| +----------------------------------------------------------------+
+------------------------------------------------------------------+
```

- **字段定义（列表展示列）**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | string | — | 模板名称 | 标准周报模板 |
| periodType | enum | — | 日报/周报/月报/季/年（与周期枚举一致） | week |
| status | enum | — | enabled / disabled | enabled |
| isSystem | boolean | — | 系统预置不可删 | true |
| updatedAt | datetime | — | 最后修改时间 | 2026-05-07 10:00:00 |
| id | string | — | 主键 | sys-rtpl-week |

- **交互流程**

  1. 用户进入模板管理 → 系统加载当前 `project_id` 下**项目模板** + **系统模板**（只读区或合并表用标签区分）。  
  2. 输入名称关键字 / 选类型、状态 → 点击查询 → 表格刷新。  
  3. 点击「编辑」→ 打开新增/编辑弹窗（系统模板仅允许「复制为项目模板」或「停用」依策略而定，见业务规则）。  
  4. 点击「复制」→ 打开新增弹窗，名称默认 `原名_副本`。  
  5. 删除：仅**非系统**项目模板；二次确认。  

- **权限要求**

| 角色 | 列表 | 新建/编辑/删除/停用 | 系统模板 |
|------|------|---------------------|----------|
| 超级管理员 | ✓ | ✓（全平台策略可配） | 可维护系统模板实体（tenant_id=0） |
| 项目管理员 | ✓ | ✓ 本项目模板 | 只读 + 可复制为项目模板 |
| 业务用户 | ✓（只读） | ✗ | 只读 |

- **业务规则与校验**

  1. 系统预置 **三个**模板：**标准日报、标准周报、标准月报**（`tenant_id=0`，`is_system=true`）—— **不可物理删除**，允许 **停用**（`status=disabled`）。  
  2. 定时任务下拉仅可选用 **`status=enabled`** 模板。  
  3. 同一项目内 **`name` + `periodType` 组合唯一**（或与纯 `name` 唯一二选一，产品定一；建议 **项目内名称唯一**）。  

- **错误与异常处理**

  | 场景 | 处理 |
  |------|------|
  | 删除系统模板 | 返回 403 + 文案「系统模板不可删除」 |
  | 名称重复 | 409 + 文案「模板名称已存在」 |
  | 网络失败 | 「操作失败，请稍后重试」 |

- **验收标准**

  1. **TC-TPL-01** Given 项目管理员 Given 列表存在「标准周报」 When 筛选类型=周报 Then 该行展示且标记为系统模板。  
  2. **TC-TPL-02** Given 选中系统模板 When 点击删除 Then 前端无删除入口或请求返回禁止删除。  
  3. **TC-TPL-03** Given 新建模板名称与已有项目模板重复 When 保存 Then 服务端/前端校验失败并提示重复。  

---

#### 3.1.2 新增/编辑模板弹窗

- **功能概述**：配置模板名称、周期类型、报告章节与图表样式。  
- **主要用途**：让同一周期类型生成结构一致、可复用的报告。  

- **界面布局**：`el-dialog` 宽 ≤640px；表单项自上而下：名称 → 类型 → 「包含内容」复选分组 → 「图表样式」→  footer 取消/保存；可选 **「预览片段」** 按钮打开侧栏或小窗（见交互）。  

- **字段定义**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | string(64) | 是 | 项目内唯一 | 浦东新区月报 |
| periodType | enum | 是 | **创建后不可改**（编辑态 disabled） | day / week / month / quarter / year |
| sections.header | boolean | 否 | 报告头部（标题、时间、生成人） | true |
| sections.overviewCards | boolean | 否 | 风险总览卡片 | true |
| sections.levelPie | boolean | 否 | 等级分布饼图 | true |
| sections.trendLine | boolean | 否 | 趋势折线图 | true |
| sections.regionTable | boolean | 否 | 高风险区域/板块排行（与「板块分布」同义占位） | true |
| sections.ruleStats | boolean | 否 | 预警规则触发统计表 | false |
| sections.efficiencyBar | boolean | 否 | 处置效率柱状分析 | false |
| sections.openRisksTable | boolean | 否 | 未处置风险明细 | true |
| sections.footer | boolean | 否 | 报告尾部说明 | false |
| chartTheme | enum | 是 | 禹翼主题 / 简约 | yuyi / simple |
| chartSize | enum | 是 | 小/中/大（实现：sm/md/lg） | md |
| showDataLabel | boolean | 是 | 图表是否显示数据标签 | true |

- **交互流程**

  1. 用户点击「新增模板」→ 打开空表单，`periodType` 可选。  
  2. 勾选「包含内容」→ 实时影响后续「预览片段」数据范围。  
  3. （可选）点击「预览」→ 调用 `POST /report/generate` `format=html` + `preview=true` + 短周期 mock 数据 → 右侧展示截断 HTML。  
  4. 点击「保存」→ 校验通过 → 关闭弹窗 → 列表刷新 → Toast 成功。  

- **权限要求**：同 3.1.1；业务用户无入口。  

- **业务规则与校验**

  1. `name` trim 后非空；长度 ≤64。  
  2. `periodType` 新建后不可变。  
  3. **至少勾选一项** `sections.*`（否则报告无主体，保存前校验失败）。  
  4. 保存时 **唯一性校验**（与列表规则一致）。  

- **错误与异常处理**：表单 `rules` 字段下红字；接口 409 展示冲突原因。  

- **验收标准**

  1. **TC-TPL-04** Given 仅勾选「风险总览」与「等级分布」 When 保存并去报告中心生成 Then 预览区仅两块。  
  2. **TC-TPL-05** Given 编辑态 When 尝试修改模板类型下拉 Then 控件 disabled。  
  3. **TC-TPL-06** Given 取消所有章节勾选 When 保存 Then 提示至少选择一项报告内容。  

---

#### 3.1.3 复制模板功能

- **功能概述**：基于现有模板快速创建项目模板草稿。  
- **主要用途**：在系统标准模板上做小改，避免从零勾选。  

- **界面布局**：同新增弹窗，标题可为「复制模板」。  

- **字段定义**：同 3.1.2；预填源模板全部字段；`name` 默认 `原名称_副本`。  

- **交互流程**

  1. 用户在列表点击「复制」→ 打开弹窗，`periodType`/`sections`/`chart*` 拷贝自源。  
  2. 用户可改名称与章节 → 保存 → **新 id** 落库，`is_system=false`。  

- **权限要求**：项目管理员及以上；业务用户不可用。  

- **业务规则与校验**：新名称仍需唯一；系统模板复制后变为**项目模板**。  

- **错误与异常处理**：同保存接口。  

- **验收标准**

  1. **TC-TPL-07** Given 复制「标准周报」 When 默认名称未改保存 Then 提示重名失败或自动追加序号（产品二选一须在实现写明）。  
  2. **TC-TPL-08** Given 复制后修改勾选区块 When 保存 Then 新项目模板与原系统模板配置独立。  
  3. **TC-TPL-09** Given 业务用户 When 列表无复制按钮 Then 符合权限设计。  

---

### 3.2 报告生成与预览（快速生成）

- **功能概述**：按周期与模板即时聚合数据，在线预览并导出多格式。  
- **主要用途**：运营/管理员临时要一份正式结构报告，不依赖定时任务。  

- **路由（实现）**：`/risk/report/center`（页面内首屏三列之一为「快速生成」）  
- **任务书 `/report/quick`**：建议 **301/重定向** 到 `/risk/report/center`，或作为同页锚点 `/#quick`。  

- **界面布局（ASCII）**

```
+------------------+------------------+------------------+
| 快速生成          | 我的报告(列表)    | 定时任务(摘要)   |
| 周期 v            | ...              | 前3条 + 管理任务 |
| 时间范围(只读)     |                  |                  |
| 模板 v            |                  |                  |
| [生成][导出]      |                  |                  |
+------------------+------------------+------------------+
| 【预览区】 HTML + 工具条 [PDF][Excel][Word][推送]         |
+---------------------------------------------------------+
```

- **字段定义**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| period | enum | 是 | 日报/周报/月报/季/年；**自定义**为扩展项 | week |
| dateFrom / dateTo | date | 条件 | `period=custom` 时必填 | 2026-05-01 |
| templateId | string | 是 | 仅 **enabled** 且 **period 与所选周期匹配**（产品可放宽为任意模板+custom range） | rtpl-xx |
| outputFormat | enum | 导出时 | pdf / excel / word | pdf |

- **交互流程**

  1. 用户选择 **报告周期** → 界面展示推导的「时间范围」说明（只读或可配覆盖）。  
  2. 选择 **模板**（下拉 filtered by 周期或全部+后端校验）。  
  3. 点击「生成报告」→ 前端 `loading` → 调用 `POST /report/generate` → 返回 **HTML** 或预览 URL → 渲染预览区。  
  4. 点击「导出 PDF/Excel/Word」→ 请求对应格式 → 浏览器下载或新窗口。  
  5. 可选：成功后写入「我的报告」列表（或与步骤 4 独立于下载流）。  

- **权限要求**

| 角色 | 生成 | 导出 | 推送 |
|------|------|------|------|
| 超级管理员 | ✓ | ✓ | ✓ |
| 项目管理员 | ✓ | ✓ | ✓ |
| 业务用户 | ✓（可配） | ✓（下载本人相关） | ✗（可配） |

- **业务规则与校验**

  1. 自定义日期跨度 **≤ MAX_REPORT_RANGE_DAYS**（如 366，与前端 `MAX_REPORT_RANGE_DAYS` 对齐）。  
  2. 模板必须 **启用**；与周期不一致时 Toast + 阻断或自动切换模板列表。  
  3. 生成时间 **≤5s** 为 SLA；超长必须异步：`202` + 轮询。  

- **错误与异常处理**

  | 场景 | 处理 |
  |------|------|
  | 模板未选 | 前端校验 |
  | 后端聚合超时 | 引导异步任务 + 消息通知 |
  | 导出失败 | `message` 展示失败原因（权限/配额） |

- **验收标准**

  1. **TC-GEN-01** Given 启用模板勾选趋势图 When 生成 Then 预览区出现趋势区块且数据与时间范围一致。  
  2. **TC-GEN-02** Given 周报 + 过去7天时间窗 When 生成 Then X 轴覆盖 7 天/周序列（与后端口径文档一致）。  
  3. **TC-GEN-03** Given 单月数据量在约定内 When 生成 Then 端到端耗时 ≤5s（压测记入非功能）。  
  4. **TC-GEN-04** Given 超长自定义范围 When 生成 Then 提示超出最大跨度。  

---

### 3.3 历史报告管理（「我的报告」）

- **功能概述**：展示已生成的报告元数据与管理下载、删除。  
- **主要用途**：留档、复检、分享给业务只读下载。  

- **路由（实现）**：主列表嵌入 **报告中心** 左侧/中列；亦可单独 `GET /report/instances` 供「查看全部」页（可选 `/risk/report/center?view=all_reports`）。  

- **界面布局**：卡片内列表条目；点击条目 → 预览区加载对应快照；底部「查看全部」可弹出全屏表格Dialog或独立路由。  

- **字段定义（列表 / 表）**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| title | string | 是 | 报告名称 | 2026-04-20 周报 |
| generatedAt | datetime | 是 | 生成时间 | 2026-04-20 09:05:00 |
| periodType | enum | 是 | 周期类型 | week |
| fileSizeKb | number | 否 | 主文件大小 | 512 |
| storagePath / fileUrl | string | 是 | 对象存储 key 或签名 URL | s3://... |
| templateId | string | 是 | 来源模板 | sys-rtpl-week |

- **交互流程**

  1. 进入报告中心 → 加载最近 N 条。  
  2. 用户点击一条 → 预览区 `loadHistoryReport` 等价：拉取 HTML 快照或文件。  
  3. **下载** → `GET /report/instances/{id}/download?format=pdf`。  
  4. **删除**（管理员）→ `DELETE` + 确认框 → 删库记录 + 对象存储文件。  
  5. **按时间范围搜索**（扩展）：顶栏daterange筛选 `generatedAt`。  

- **权限要求**

| 角色 | 列表/预览 | 下载 | 删除 |
|------|-----------|------|------|
| 超级管理员 | ✓ | ✓ | ✓ |
| 项目管理员 | ✓ | ✓ | ✓ **本项目** |
| 业务用户 | ✓（策略内） | ✓ | ✗ |

- **业务规则与校验**

  1. 存储：**数据库仅存元数据**；二进制进 **OSS/磁盘**；删除需 **最终一致性**（失败重试队列）。  
  2. 下载链接：**短时签名**（如 15min）防嗅探泄露。  

- **错误与异常处理**：文件缺失 → 404 + 「文件已失效，请重新生成」；无权删除 → 403。  

- **验收标准**

  1. **TC-HIS-01** Given 已有一条历史 When 点击查看 Then 预览与生成时一致的章节结构。  
  2. **TC-HIS-02** Given 业务用户 When 无删除按钮 Then 仅下载可用。  
  3. **TC-HIS-03** Given 项目管理员删除成功 When 再请求下载 Then 404 或不可用。  

---

### 3.4 定时任务管理

#### 3.4.1 任务列表页

- **功能概述**：管理「何时、用哪份模板、推给谁」的自动生成与推送。  
- **主要用途**：每日/每周固定节奏发送风险日报到邮箱、钉钉群等。  

- **路由（实现）**：`/risk/report/schedules`  

- **界面布局（ASCII）**

```
+------------------------------------------------------------------+
| 筛选：[任务名称___] [状态 v] [最近结果 v]  [查询] [重置]            |
| [新增定时任务]                                                    |
| 表格：名称 | 模板 | 周期摘要 | 执行时间 | 上次执行 | 最近结果 | 状态 | 操作 |
| 操作：启用Switch | 编辑 | 执行 | 历史 | 删除                         |
+------------------------------------------------------------------+
```

- **字段定义（列表列）**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | string | 是 | 任务名称 | 每日风险日报 |
| templateId | string | 是 | 关联模板 id | rtpl-xx |
| cycle | enum | 是 | daily / weekly_mon / monthly_1 / cron | daily |
| runTime | time | 条件 | non-cron 时 | 09:00 |
| cronExpr | string | 条件 | cron 模式 | 0 9 * * * |
| enabled | boolean | 是 | 启用 | true |
| lastRunAt | datetime | 否 | 上次调度时间 | 2026-05-07 09:00:01 |
| lastResult | enum | 否 | success / fail / partial / none | success |

- **交互流程**：筛选 → 表格刷新；点击「新增」打开 3.4.2 弹窗；「执行」→ 3.4.3；「历史」→ 3.4.4。  

- **权限要求**：项目管理员及以上可 CRUD；业务用户只读或无入口。  

- **业务规则与校验**

  1. **同一项目下** 「任务名称」建议唯一。  
  2. **`(enabled templateId + cycle + runTime)` 组合防重复**：避免重复推送（产品可弱化：仅告警不阻止）。  

- **错误与异常处理**：列表加载失败全局重试文案。  

- **验收标准**

  1. **TC-SCH-01** Given 停用任务 When 次日到达计划时间 Then 不产生执行记录（或 Quartz 跳过）。  
  2. **TC-SCH-02** Given 筛选「最近结果=失败」 When 查询 Then 仅失败任务展现。  
  3. **TC-SCH-03** Given 无可用的启用模板 When 新建任务 Then 下拉为空并提示先去模板管理。  

---

#### 3.4.2 新增/编辑任务弹窗

- **功能概述**：配置调度节奏与推送接收人，绑定唯一逻辑模板实例。  

- **字段定义**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | string(80) | 是 | 任务名称 | 每日风险日报 |
| templateId | string | 是 | **enabled** 项目或系统模板 | sys-rtpl-day |
| cycle | enum | 是 | 每日 / 每周一 / 每月1日 / cron | daily |
| runTime | time | 条件 | cycle≠cron | 09:00 |
| cronExpr | string | 条件 | Quartz/cron 6/7字段按后端约定 | 0 9 * * * |
| notifyMethodIds | string[] | 是 | 多选渠道 id，来源于通知方式配置 | ["nm-mail-1","nm-ding-1"] |
| recipientsMail | string | 条件 | 含 mail 渠道时必填 | a@x.com;b@y.com |
| recipientsDing | string | 条件 | ding 可选 | 13800138000 |
| recipientsWework | string | 条件 | wework 可选 | userid |
| enabled | boolean | 是 | — | true |

- **交互流程**

  1. 填写名称 → 选模板 → 仅展示与 **`cycleToPeriodType(cycle)`** 匹配的模板（若 `cron` 则不做类型过滤或由高级用户自选）。  
  2. 勾选通知方式 → 动态展示收件人控件（邮件多分号/`;`分隔）。  
  3. 保存 → **校验收件人邮箱格式** → 服务端校验 webhook + 模板存在。  

- **权限要求**：项目管理员及以上。  

- **业务规则与校验**

  1. `notifyMethodIds` 必选至少一项。  
  2. **邮件正则**逐个校验（split 后 trim）。  
  3. 通知方式数据源：**已启用且测试连通非 fail**（与现前端 `listMethodsForSchedulePush` 一致）；**短信**不参与定时推送（若需支持另开 PRD）。  
  4. 同一模板 + 完全相同 cron 与时间 + 完全相同接收人可加 **防抖警告**（不强制拦截）。  

- **错误与异常处理**：任一渠道 SMTP 失效 → 执行时 `partial` + 明细写日志。  

- **验收标准**

  1. **TC-SCH-04** Given 勾选邮件未填收件人 When 保存 Then 校验失败。  
  2. **TC-SCH-05** Given 勾选钉钉 When 保存 Then `recipientsDing` 可选留空（仅群通知）。  
  3. **TC-SCH-06** Given 停用通知配置 When 打开弹窗 Then 该项不出现在多选列表。  

---

#### 3.4.3 立即执行（「执行」按钮）

- **功能概述**：手动触发一次与计划完全相同的生成与推送流水线。  

- **界面布局**：`ElMessageBox.confirm`：「确认立即执行任务【xxx】吗？将生成报告并推送给接收人。」  

- **字段定义**：无表单；可选传 `dryRun=false`。  

- **交互流程**

  1. 用户点击「执行」→ Confirm → 前端 **全屏 Loading**（或异步轮询）。  
  2. `POST /report/schedules/{id}/execute` → 服务端抢 **分布式锁** → 生成文件 → 推送 → 写 `schedule_execution_log`。  
  3. 成功 → Toast「执行成功」+ 可选插入「我的报告」；失败 → Toast/Dialog **含失败原因**（SMTP 被拒、Webhook 499 等）。  
  4. 解锁。  

- **权限要求**：项目管理员及以上。  

- **业务规则与校验**

  1. **并发**：同任务并行执行第二条返回 409「任务正在执行中」。  
  2. 执行前复核：模板仍存在且 enabled；至少一渠道可用。  

- **错误与异常处理**：锁等待超时；生成子任务失败链路写 `error_message`。  

- **验收标准**

  1. **TC-SCH-07** Given 排队执行 When 双击执行 Then 第二次收到「执行中」提示。  
  2. **TC-SCH-08** Given SMTP 无效 When 执行 Then lastResult=fail 且历史可展开错误码。  
  3. **TC-SCH-09** Given 首次成功 When 刷新我的报告 Then 可增加一条（若产品设计为插入）。  

---

#### 3.4.4 执行历史抽屉

- **功能概述**：按单次执行维度审计耗时、推送结果与文件。  

- **界面布局**：`el-drawer` 宽度 560–720px；内嵌表格；支持时间范围筛选。  

- **字段定义**

| 字段名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| execute_time | datetime | 是 | 执行开始/结束时间 | … |
| status | enum | 是 | success / fail / partial | success |
| file_size_kb | number | 否 | — | 1200 |
| push_channels | string | 否 | 摘要 | mail, ding |
| receivers | text | 否 | 收件人摘要 | … |
| error_message | text | 否 | 失败原因 | … |
| detail | json | 否 | 分渠道投递明细（扩展） | — |

- **交互流程**：点击「历史」→ 拉取分页 → 筛选时间 → 点击行「详情」弹 MessageBox 格式化 JSON（与现有 `RiskReportSchedulesPage` 行为对齐）。  

- **权限要求**：项目管理员及以上可查看；业务用户不可。  

- **业务规则与校验**：留存 ≥90 天（可配置）。  

- **错误与异常处理**：无记录时表格空态。  

- **验收标准**

  1. **TC-SCH-10** Given 成功执行两次 When 打开历史 Then 两行按时间倒序。  
  2. **TC-SCH-11** Given partial When 详情 Then 能区分哪个渠道失败。  
  3. **TC-SCH-12** Given 筛选仅昨天 When 查询 Then 不包含更早记录。  

---

### 3.5 推送方式整合（复用通知方式配置）

- **功能概述**：定时任务所选渠道与企业内已配置的 SMTP/Webhook 一致，无需重复录入主机信息。  

- **主要用途**：统一管理密钥与连通性，任务只选「用哪条路、发给谁」。  

- **界面布局**：任务弹窗内「推送设置」灰色底块；勾选组 + 条件收件人表单项（与 `RiskReportScheduleDialog` 一致）。  

- **数据源路径（实现）**：**安全管理 › 通知方式配置** `GET/维护于` `/security/events/notify-method`（前端 mock：`notificationMethodMock` + `localStorage yuyi-notification-methods-v2`）。**不等同**于「系统设置」菜单占位页——上线后以产品菜单为准，**数据源接口**可归 `GET /notification/methods`。  

- **字段定义**：与 §3.4.2 `notifyMethodIds` + 分渠道收件人一致；服务端解析 id → 解密 SMTP / Webhook。  

- **交互流程**

  1. 打开任务弹窗 → 请求可用渠道列表。  
  2. 勾选邮件 → 显示 `recipientsMail`；勾选钉钉机器人 → `recipientsDing`。  
  3. 执行时：邮件 **附件** PDF（或链接）；钉钉 **markdown + 下载链接**。  

- **权限要求**：能配置通知方式的角色与任务管理员分离——**配置**在通知页；**使用**在任务页。  

- **业务规则与校验**

  1. **SSRF**：保存 Webhook 时校验 URL Host 不允许私网、`metadata` IP 等。  
  2. `fail` 连通状态的渠道不参与 `listMethodsForSchedulePush`。  

- **错误与异常处理**：执行阶段单渠道失败写 partial，不向用户刷屏堆栈。  

- **验收标准**

  1. **TC-NTF-01** Given 新建 SMTP 并通过测试 When 勾选该渠道执行任务 Then 收件箱收到附件或链接。  
  2. **TC-NTF-02** Given Webhook 指向内网 When 保存通知配置 Then 拒绝并提示安全风险。  
  3. **TC-NTF-03** Given 钉钉未填收件人 When 执行任务 Then 群内仍收到卡片（群机器人语义）。  

---

## 四、非功能性要求（本章汇总）

| 项 | 要求 |
|----|------|
| 异步 | `generate`/`execute` >3s 时返回 job_id；前端轮询；WebSocket 可选。 |
| 限流 | 每项目每分钟生成次数阈值，防恶意刷 OSS。 |
| 观测 | Prometheus 埋点：`report_generate_seconds`、`schedule_execute_total{status}`。 |

（§二已含性能、安全、并发全文。）

---

## 五、验收测试标准（跨模块）

| 编号 | 用例简述 |
|------|----------|
| TC-E2E-01 | 项目管理员创建**日报模板**，勾选「风险总览」「等级分布」，**预览**含对应区块。（对齐任务书 TC1） |
| TC-E2E-02 | 选**周报 + 标准周报**，生成报告，预览含**近 7 天趋势**。（TC2） |
| TC-E2E-03 | 创建启用任务「每日风险日报」，**次日 09:00** 收到邮件 PDF（与时间 TZ 对齐）。（TC3） |
| TC-E2E-04 | 任务列表点击**执行**，成功后**执行历史**为 success。（TC4） |
| TC-E2E-05 | 切换项目，`localStorage`/`project_id` 隔离模板与任务（与现 `yuyi-risk-report-proj-{id}` 行为一致迁移到后端时为 DB 隔离）。 |

---

## 六、附录 A — SQL DDL 示例（MySQL 8）

> 仅为示例：**雪花/UUID、`tenant_id`、`project_id`、审计字段**按贵司规范裁剪。

```sql
-- 报告模板（系统 + 项目；系统模板 project_id=NULL 且 tenant_id=0）
CREATE TABLE risk_report_template (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  tenant_id       BIGINT       NOT NULL DEFAULT 0,
  project_id      BIGINT       NULL COMMENT 'NULL 表示系统模板',
  is_system       TINYINT(1)   NOT NULL DEFAULT 0,
  name            VARCHAR(128) NOT NULL,
  period_type     VARCHAR(16)  NOT NULL COMMENT 'day,week,month,quarter,year',
  status          VARCHAR(16)  NOT NULL DEFAULT 'enabled' COMMENT 'enabled,disabled',
  chart_theme     VARCHAR(32)  NOT NULL DEFAULT 'yuyi',
  chart_size      VARCHAR(16)  NOT NULL DEFAULT 'md',
  show_data_label TINYINT(1)   NOT NULL DEFAULT 1,
  sections_json   JSON         NOT NULL COMMENT 'header,overviewCards,...',
  deleted         TINYINT(1)   NOT NULL DEFAULT 0,
  created_by      BIGINT       NULL,
  updated_by      BIGINT       NULL,
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uk_proj_name (tenant_id, project_id, name, deleted),
  KEY idx_proj_status (project_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 已生成报告（我的报告）
CREATE TABLE risk_report_instance (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  tenant_id       BIGINT       NOT NULL,
  project_id      BIGINT       NOT NULL,
  template_id     VARCHAR(64)  NOT NULL,
  title           VARCHAR(256) NOT NULL,
  period_type     VARCHAR(16)  NOT NULL,
  range_start     DATE         NULL,
  range_end       DATE         NULL,
  generated_at    DATETIME(3)  NOT NULL,
  file_size_kb    INT          NULL,
  storage_bucket  VARCHAR(128) NOT NULL,
  storage_key     VARCHAR(512) NOT NULL,
  format_main     VARCHAR(16)  NOT NULL DEFAULT 'pdf',
  created_by      BIGINT       NULL,
  KEY idx_proj_time (project_id, generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 定时任务
CREATE TABLE risk_report_schedule (
  id                 VARCHAR(64)  NOT NULL PRIMARY KEY,
  tenant_id          BIGINT       NOT NULL,
  project_id         BIGINT       NOT NULL,
  name               VARCHAR(160) NOT NULL,
  template_id        VARCHAR(64)  NOT NULL,
  cycle              VARCHAR(32)  NOT NULL COMMENT 'daily,weekly_mon,monthly_1,cron',
  run_time           CHAR(5)      NULL COMMENT 'HH:mm',
  cron_expr          VARCHAR(64)  NULL,
  notify_method_ids  JSON         NOT NULL,
  recipients_mail    VARCHAR(1024) NULL,
  recipients_ding    VARCHAR(512)  NULL,
  recipients_wework  VARCHAR(512)  NULL,
  enabled            TINYINT(1)   NOT NULL DEFAULT 1,
  last_run_at        DATETIME(3)  NULL,
  last_run_status    VARCHAR(16)  NULL,
  executing          TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '软标记，真实并发靠锁',
  created_by         BIGINT       NULL,
  updated_by         BIGINT       NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_proj_enabled (project_id, enabled),
  UNIQUE KEY uk_proj_schedule_name (project_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 执行历史
CREATE TABLE risk_report_schedule_execution (
  id              BIGINT       NOT NULL PRIMARY KEY AUTO_INCREMENT,
  schedule_id     VARCHAR(64)  NOT NULL,
  tenant_id       BIGINT       NOT NULL,
  project_id      BIGINT       NOT NULL,
  execute_time    DATETIME(3)  NOT NULL,
  finished_at     DATETIME(3)  NULL,
  duration_ms     INT          NULL,
  status          VARCHAR(16)  NOT NULL COMMENT 'success,fail,partial',
  file_size_kb    INT          NULL,
  report_instance_id VARCHAR(64) NULL,
  push_channels   VARCHAR(256) NULL,
  receivers_summary VARCHAR(1024) NULL,
  error_message   TEXT         NULL,
  detail_json     JSON         NULL,
  KEY idx_schedule_time (schedule_id, execute_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 分布式执行锁（可选独立表或用 Redis）
CREATE TABLE risk_report_execution_lock (
  schedule_id VARCHAR(64) NOT NULL PRIMARY KEY,
  locked_at   DATETIME(3) NOT NULL,
  holder      VARCHAR(128) NOT NULL COMMENT 'pod instance id',
  ttl_sec     INT         NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 七、附录 B — 章节 key 与产品文案映射

| 产品文案（章节名） | `sections_*` JSON key |
|--------------------|------------------------|
| 报告头部 | header |
| 风险总览（卡片） | overviewCards |
| 等级分布饼图 | levelPie |
| 趋势折线图 | trendLine |
| 高风险区域排行 / 板块 TOP | regionTable |
| 预警规则触发统计 | ruleStats |
| 处置效率分析 | efficiencyBar |
| 未处置风险明细 | openRisksTable |
| 报告尾部 | footer |

---

## 八、文档变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| V1.0 | 2026-05-07 | 首版：对齐任务书结构 + `yuyi-fam` 当前路由与组件字段 |

---

**文档结束。** 如需将本节并入总 PRD `PRD-禹翼机管局平台-V1.0-开发测试全量.md` §3.9，可整体链接或节选合并。
