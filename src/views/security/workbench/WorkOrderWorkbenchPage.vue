<template>
  <div class="workbench-page flex flex-col min-h-0 flex-1">
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-1">
      <h1 class="text-2xl font-bold text-gray-800 m-0">事件工作台</h1>
      <div class="flex flex-wrap items-center gap-2">
        <el-dropdown trigger="click" placement="bottom-end" @command="onMoreCommand">
          <el-button>
            更多
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export-filtered" :disabled="!isAdmin">
                导出当前列表（与筛选结果）
              </el-dropdown-item>
              <el-dropdown-item command="reset-filters">重置筛选条件</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-if="viewMode !== 'closed'" trigger="click" @command="onColCommand">
          <el-button>
            自定义列
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="reset">恢复默认</el-dropdown-item>
              <el-dropdown-item divided disabled>显示字段</el-dropdown-item>
              <el-dropdown-item>
                <el-checkbox v-model="cols.woType">工单类型</el-checkbox>
              </el-dropdown-item>
              <el-dropdown-item>
                <el-checkbox v-model="cols.deadline">处理时限</el-checkbox>
              </el-dropdown-item>
              <el-dropdown-item v-if="viewMode === 'initiated'">
                <el-checkbox v-model="cols.initiator">发起人</el-checkbox>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-tabs
      :model-value="route.path"
      class="workbench-main-tabs"
      type="card"
      @tab-click="onWorkbenchTabClick"
    >
      <el-tab-pane
        v-for="t in workbenchNav"
        :key="t.path"
        :name="t.path"
        :label="t.label"
      />
    </el-tabs>

    <div class="workbench-body flex flex-col flex-1 min-h-0">
      <p class="text-sm text-gray-500 mb-4 m-0 leading-relaxed max-w-4xl">
        {{ pageDesc }}
      </p>

    <!-- 筛选 + 批量（与风险规则页同结构的卡片） -->
    <div
      class="rounded-xl border bg-white p-4 shadow-sm mb-4"
      style="border-color: var(--yw-border)"
    >
      <el-form :inline="true" class="flex flex-wrap items-end gap-x-3 gap-y-2">
        <el-form-item label="状态" class="!mb-0">
          <el-select
            v-model="filters.status"
            clearable
            placeholder="全部"
            class="!w-32"
            @change="currentPage = 1"
          >
            <el-option
              v-for="(v, k) in WO_STATUS"
              :key="k"
              :label="v.label"
              :value="k"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="紧急程度" class="!mb-0">
          <el-select
            v-model="filters.urgency"
            clearable
            placeholder="全部"
            class="!w-32"
            @change="currentPage = 1"
          >
            <el-option
              v-for="u in DISPLAY_URGENCY_FILTER"
              :key="u.value"
              :label="u.label"
              :value="u.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="工单类型" class="!mb-0">
          <el-select
            v-model="filters.category"
            clearable
            placeholder="全部"
            class="!w-32"
            @change="currentPage = 1"
          >
            <el-option
              v-for="(c, k) in WO_CATEGORY"
              :key="k"
              :label="c.label"
              :value="k"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" class="!mb-0">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            class="!w-64"
            @change="currentPage = 1"
          />
        </el-form-item>
        <el-form-item label="关键词" class="!mb-0">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="编号 / 摘要 / 位置 / 责任人"
            class="!w-56"
            @keyup.enter="applySearch"
          />
        </el-form-item>
        <el-form-item class="!mb-0">
          <el-button type="primary" @click="applySearch">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <div
        v-if="viewMode === 'all'"
        class="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t"
        style="border-color: var(--yw-border)"
      >
        <span class="text-sm font-medium text-gray-600 mr-1">批量操作</span>
        <el-button type="primary" :disabled="!canBatch" @click="openBatch('simple')">
          批量简单处理
        </el-button>
        <el-button :disabled="!canBatch" @click="openBatch('transfer')">批量转派</el-button>
        <el-button :disabled="!canBatch" @click="openBatchUrgeDialog">批量催办</el-button>
        <el-button :disabled="!isAdmin || !canBatch" @click="exportSelected">导出</el-button>
        <el-button
          v-if="isAdmin"
          type="warning"
          :disabled="!canBatch"
          @click="openBatch('falseclose')"
        >
          批量误报关闭
        </el-button>
      </div>
      <div
        v-else-if="viewMode === 'todo'"
        class="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t"
        style="border-color: var(--yw-border)"
      >
        <span class="text-sm font-medium text-gray-600 mr-1">批量操作</span>
        <el-button
          type="primary"
          :disabled="!canBatchBatchAccept"
          @click="batchAccept"
        >
          批量接单
        </el-button>
        <el-button :disabled="!canBatch" @click="openBatch('simple')">批量简单处理</el-button>
        <el-button :disabled="!canBatch" @click="openBatch('transfer')">批量转派</el-button>
        <el-button :disabled="!canBatch" @click="openBatchUrgeDialog">批量催办</el-button>
      </div>
      <div
        v-else-if="viewMode === 'initiated'"
        class="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3"
        role="note"
      >
        本人发起或需跟踪的工单可催办、取消；转派需由当前责任人处理（不展示批量转派）。
      </div>
      <div
        v-else-if="viewMode === 'done'"
        class="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t"
        style="border-color: var(--yw-border)"
      >
        <el-button :disabled="!canBatch" @click="openBatchUrgeDialog">批量催办</el-button>
      </div>
      <div
        v-else-if="viewMode === 'closed'"
        class="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t"
        style="border-color: var(--yw-border)"
      >
        <span class="text-sm text-gray-500">只读；勾选记录后可导出归档</span>
        <el-button
          type="primary"
          :disabled="!isAdmin || !selectedRows.length"
          @click="exportSelected"
        >
          导出
        </el-button>
      </div>
    </div>

    <div
      class="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0"
      style="border-color: var(--yw-border)"
    >
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="pagedRows"
        :height="tableHeight"
        stripe
        row-key="id"
        class="workbench-table"
        @selection-change="onSelectionChange"
      >
        <el-table-column
          v-if="viewMode !== 'closed' || isAdmin"
          type="selection"
          width="48"
          fixed="left"
          :selectable="rowSelectable"
        />
        <el-table-column label="工单编号" width="160" fixed="left" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="primary" link class="!p-0" @click="openDetailDrawer(row)">{{ row.id }}</el-button>
          </template>
        </el-table-column>
        <el-table-column v-if="cols.woType" label="工单类型" width="102" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag
              v-if="WO_CATEGORY[row.category]"
              :type="row.category === 'risk' ? 'danger' : row.category === 'inspection' ? 'success' : 'warning'"
              effect="light"
              size="small"
            >
              {{ WO_CATEGORY[row.category].label }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="紧急程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getDisplayUrgency(row).elType" size="small" effect="light">
              {{ getDisplayUrgency(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="事件/报修摘要" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button
              v-if="row.eventId"
              type="primary"
              link
              class="!p-0 !h-auto !leading-snug"
              @click="openEvent(row)"
            >
              {{ row.summary }}
            </el-button>
            <span v-else>{{ row.summary }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="空间位置" min-width="120" show-overflow-tooltip />
        <el-table-column label="当前责任人" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.assigneeName || '待分配' }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="viewMode === 'initiated' && cols.initiator"
          label="发起人"
          width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.initiatorLabel }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column v-if="cols.deadline" label="处理时限" min-width="120">
          <template #default="{ row }">
            <div class="flex flex-wrap items-center gap-1">
              <span :class="['text-sm font-medium', deadlineDisplay(row).lineClass]">
                {{ deadlineDisplay(row).text }}
              </span>
              <el-tag v-if="deadlineDisplay(row).showOverdueTag" type="info" size="small" effect="plain">
                超时
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small" effect="light">
              {{ WO_STATUS[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          :width="opColWidth"
          fixed="right"
          class-name="workbench-actions-col"
        >
          <template #default="{ row }">
            <div class="workbench-ops">
              <template v-if="viewMode === 'closed'">
                <el-button type="primary" link size="small" @click="openDetailDrawer(row)">详情</el-button>
              </template>
              <template v-else>
                <el-button type="primary" size="small" @click="openProcessModal(row)">处理</el-button>
                <el-button type="primary" link size="small" @click="openDetailDrawer(row)">详情</el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div
        class="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-t text-sm text-gray-500"
        style="border-color: var(--yw-border)"
      >
        <span>共 {{ filteredRows.length }} 条</span>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="prev, pager, next, sizes"
          :total="filteredRows.length"
          background
        />
      </div>
    </div>

    <transition name="el-fade-in">
      <div
        v-show="selectedRows.length"
        class="flex flex-wrap items-center justify-between gap-3 yw-card px-4 py-3 mt-2 border"
        style="position: sticky; bottom: 0; z-index: 20; border-color: var(--yw-primary); background: var(--yw-primary-bg)"
      >
        <span class="text-sm font-medium" style="color: var(--yw-primary-dark)">
          已选 {{ selectedRows.length }} 条
          <span v-if="viewMode === 'all'" class="font-normal" style="color: var(--yw-text-secondary)">
            （与上方批量操作配合）
          </span>
        </span>
        <el-button @click="clearSelection">取消选择</el-button>
      </div>
    </transition>
    </div>


    <!-- 工单详情抽屉（模拟 GET /api/workorder/:id/detail） -->
    <el-drawer
      v-model="detailDrawerVisible"
      :size="drawerWidth"
      direction="rtl"
      destroy-on-close
      append-to-body
      class="workorder-detail-drawer"
      @closed="onDetailDrawerClosed"
    >
      <template #header>
        <div class="flex flex-wrap items-center gap-2 pr-8">
          <span class="text-base font-semibold text-gray-900">工单详情</span>
          <span v-if="drawerRow" class="text-sm text-gray-500 font-mono">{{ drawerRow.id }}</span>
          <template v-if="drawerRow">
            <el-tag size="small" effect="light">
              {{ WO_CATEGORY[drawerRow.category]?.label || '—' }}
            </el-tag>
            <el-tag :type="statusTagType(drawerRow.status)" size="small" effect="light">
              {{ WO_STATUS[drawerRow.status]?.label }}
            </el-tag>
          </template>
        </div>
      </template>

      <div class="detail-drawer-inner flex flex-col min-h-0 h-full">
        <div v-loading="detailLoading" class="detail-drawer-scroll flex-1 overflow-y-auto pr-1 -mr-1">
          <template v-if="drawerDetail && drawerRow">
            <section class="mb-5">
              <h3 class="detail-section-title">基本信息</h3>
              <div class="detail-card text-sm text-gray-700 space-y-2.5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div><span class="text-gray-500">工单编号</span>：{{ drawerDetail.basic.id }}</div>
                  <div><span class="text-gray-500">工单类型</span>：{{ drawerDetail.basic.categoryLabel }}</div>
                  <div class="sm:col-span-2 flex flex-wrap items-center gap-2">
                    <span class="text-gray-500">紧急程度</span>：
                    <span>{{ urgencyEmoji(drawerDetail.basic.urgency) }}</span>
                    <el-tag :type="drawerDetail.basic.urgency.elType" size="small" effect="light">
                      {{ drawerDetail.basic.urgency.label }}
                    </el-tag>
                  </div>
                  <div><span class="text-gray-500">当前责任人</span>：{{ drawerDetail.basic.assigneeName }}</div>
                  <div><span class="text-gray-500">创建人</span>：{{ drawerDetail.basic.creatorLabel }}</div>
                </div>
                <div><span class="text-gray-500">工单摘要</span>：{{ drawerDetail.basic.summary }}</div>
                <div><span class="text-gray-500">空间位置</span>：{{ drawerDetail.basic.location }}</div>
                <div><span class="text-gray-500">创建时间</span>：{{ drawerDetail.basic.createTime }}</div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-gray-500">处理时限</span>：
                  <span :class="['font-medium', deadlineDisplay(drawerRow).lineClass]">
                    {{ deadlineDisplay(drawerRow).text }}
                  </span>
                  <el-tag v-if="deadlineDisplay(drawerRow).showOverdueTag" type="info" size="small" effect="plain">
                    超时
                  </el-tag>
                </div>
                <div><span class="text-gray-500">完成时限</span>：{{ drawerDetail.basic.completeDueAt }}</div>
              </div>
            </section>

            <section class="mb-5">
              <h3 class="detail-section-title">处理流程</h3>
              <div class="detail-card">
                <el-timeline v-if="drawerDetail.flowTimeline.length">
                  <el-timeline-item
                    v-for="(ev, idx) in drawerDetail.flowTimeline"
                    :key="idx"
                    :timestamp="ev.timestamp"
                    placement="top"
                    :type="ev.type || 'primary'"
                    hollow
                  >
                    <p class="m-0 font-medium text-gray-800 text-sm">{{ ev.title }}</p>
                    <p class="m-0 mt-0.5 text-xs text-gray-600 leading-snug">{{ ev.description }}</p>
                  </el-timeline-item>
                </el-timeline>
                <p v-else class="m-0 text-sm text-gray-500">暂无流程节点</p>
              </div>
            </section>

            <section v-if="drawerDetail.relatedEvent" class="mb-5">
              <h3 class="detail-section-title">关联事件</h3>
              <div class="detail-card text-sm space-y-2">
                <div><span class="text-gray-500">事件名称</span>：{{ drawerDetail.relatedEvent.name }}</div>
                <div v-if="drawerDetail.relatedEvent.ruleName">
                  <span class="text-gray-500">触发规则</span>：{{ drawerDetail.relatedEvent.ruleName }}
                  <span v-if="drawerDetail.relatedEvent.ruleId" class="text-gray-400">（{{ drawerDetail.relatedEvent.ruleId }}）</span>
                </div>
                <div v-if="drawerDetail.relatedEvent.conditionText">
                  <span class="text-gray-500">触发条件</span>：{{ drawerDetail.relatedEvent.conditionText }}
                </div>
                <div v-if="drawerDetail.relatedEvent.thirdPartySystem">
                  <span class="text-gray-500">来源系统</span>：{{ drawerDetail.relatedEvent.thirdPartySystem }}
                </div>
                <el-button type="primary" size="small" @click="openEventFromDrawer">
                  查看事件详情
                </el-button>
              </div>
            </section>

            <section class="mb-5">
              <h3 class="detail-section-title">操作记录</h3>
              <div class="detail-card max-h-52 overflow-y-auto">
                <ul class="m-0 pl-0 list-none space-y-3">
                  <li
                    v-for="(log, idx) in drawerDetail.operationLogs"
                    :key="idx"
                    class="text-sm border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                  >
                    <div class="text-xs text-gray-400 mb-0.5">{{ log.time }}</div>
                    <span class="text-gray-600">{{ log.operator }}</span>
                    <span class="text-gray-800"> · {{ log.content }}</span>
                  </li>
                </ul>
              </div>
            </section>

            <section v-if="drawerDetail.attachments?.length" class="mb-5">
              <h3 class="detail-section-title">附件</h3>
              <div class="detail-card">
                <ul class="m-0 pl-0 list-none space-y-2">
                  <li
                    v-for="(f, idx) in drawerDetail.attachments"
                    :key="idx"
                    class="flex flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <span class="text-gray-800">{{ f.name }}</span>
                    <span class="text-gray-400 text-xs">{{ f.size }}</span>
                    <el-button type="primary" link size="small" class="!ml-auto" @click="mockDownload(f)">
                      下载
                    </el-button>
                  </li>
                </ul>
              </div>
            </section>
          </template>
        </div>

        <div
          class="detail-drawer-footer flex flex-wrap justify-end gap-2 pt-3 mt-2 border-t flex-shrink-0"
          style="border-color: var(--yw-border)"
        >
          <el-button v-if="viewMode !== 'closed'" type="primary" :disabled="!drawerRow" @click="processFromDrawer">
            去处理
          </el-button>
          <el-button @click="detailDrawerVisible = false">关闭</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 单条工单处理 -->
    <el-dialog
      v-model="processVisible"
      :title="processTarget ? `处理工单 - ${processTarget.id}` : '处理工单'"
      width="580px"
      destroy-on-close
      append-to-body
      @close="resetProcessModal"
    >
      <template v-if="processTarget">
        <div class="rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5 mb-3 text-sm space-y-1">
          <p class="m-0 font-medium text-gray-800">工单摘要：{{ processTarget.summary }}</p>
          <p class="m-0 text-gray-600">
            位置：{{ processTarget.location }}　当前责任人：{{ processTarget.assigneeName || '待分配' }}
          </p>
          <p class="m-0 text-gray-600">
            紧急程度：<el-tag :type="getDisplayUrgency(processTarget).elType" size="small" effect="light" class="align-middle">
              {{ getDisplayUrgency(processTarget).label }}
            </el-tag>
            　创建时间：{{ processTarget.createTime }}
          </p>
          <p class="m-0 flex flex-wrap items-center gap-1.5">
            处理时限：
            <span :class="['font-medium', deadlineDisplay(processTarget).lineClass]">
              {{ deadlineDisplay(processTarget).text }}
            </span>
            <el-tag
              v-if="deadlineDisplay(processTarget).showOverdueTag"
              type="info"
              size="small"
              effect="plain"
            >
              超时
            </el-tag>
          </p>
        </div>

        <div
          v-if="processTarget.eventId"
          class="mb-3 rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-sm"
        >
          <span class="text-gray-700">关联事件：</span>
          <el-button type="primary" link class="!p-0 align-baseline" @click="toggleProcessEventDetail">
            {{ processEventExpanded ? '收起事件详情' : '查看事件详情' }}
          </el-button>
          <el-button type="primary" link class="!p-0 ml-2 align-baseline" @click="openEvent(processTarget)">
            侧滑打开完整页
          </el-button>
          <div v-if="processEventExpanded && processEventDetail" class="mt-2 pt-2 border-t border-blue-100/80 text-gray-700 space-y-1 text-xs leading-relaxed">
            <p class="m-0"><strong>事件</strong>：{{ processEventDetail.name }}（{{ processEventDetail.type }}）</p>
            <p v-if="processEventDetail.ruleName" class="m-0">
              <strong>触发规则</strong>：{{ processEventDetail.ruleName }}（{{ processEventDetail.ruleId }}）
            </p>
            <p v-if="processEventDetail.metricName" class="m-0">
              <strong>指标</strong>：{{ processEventDetail.metricName }} {{ processEventDetail.metricCode || '' }}
            </p>
            <p v-if="processEventDetail.conditionText" class="m-0">
              <strong>条件快照</strong>：{{ processEventDetail.conditionText }}
            </p>
            <p v-if="processEventDetail.ruleExtra" class="m-0">
              <strong>附加说明</strong>：{{ processEventDetail.ruleExtra }}
            </p>
            <p class="m-0 text-gray-500">等级：{{ processEventDetail.levelLabel }} · 位置：{{ processEventDetail.location }}</p>
          </div>
        </div>

        <el-form v-if="processOptions.length" label-width="100px" class="mt-1">
          <el-form-item label="处理操作">
            <el-radio-group v-model="processForm.action" class="flex flex-col items-start gap-1 !leading-normal">
              <el-radio v-for="opt in processOptions" :key="opt.id" :label="opt.id" class="!h-auto !mr-0 !items-start">
                {{ opt.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="processForm.action === 'transfer'" label="转派人" required>
            <el-select v-model="processForm.assignee" placeholder="请选择" class="!w-full" filterable>
              <el-option v-for="p in staffOthers" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理说明">
            <el-input
              v-model="processForm.remark"
              type="textarea"
              :rows="2"
              maxlength="200"
              show-word-limit
              placeholder="选填，最多200字"
            />
          </el-form-item>
        </el-form>
        <p v-else class="text-sm text-gray-500 m-0 mb-3">当前视图下无可执行的处理动作，请使用工单编号进入详情或联系调度。</p>
      </template>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button v-if="processTarget" type="primary" link @click="openDetailFromProcessModal">工单详情页</el-button>
        <el-button
          v-if="processOptions.length"
          type="primary"
          :disabled="!canSubmitProcess"
          @click="submitProcess"
        >
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 单条/批量 转派 -->
    <el-dialog
      v-model="transferOpen"
      :title="batchTransferMode ? `批量转派（已选择 ${selectForBatch.length} 条工单）` : '转派'"
      width="520px"
      destroy-on-close
      append-to-body
    >
      <p v-if="!batchTransferMode && transferRow" class="text-xs text-gray-500 m-0 mb-2">
        {{ transferRow.id }} · {{ transferRow.summary }}
      </p>
      <el-form label-width="100px">
        <el-form-item v-if="batchTransferMode" label="工单清单">
          <ul class="m-0 pl-4 text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
            <li v-for="r in selectForBatch" :key="r.id">
              • {{ r.id }} {{ r.summary }}（状态：{{ WO_STATUS[r.status]?.label }}）
            </li>
          </ul>
        </el-form-item>
        <el-form-item required :label="batchTransferMode ? '转派给' : '目标责任人'">
          <el-select v-model="transferToId" placeholder="请选择人员或班组" class="!w-full" filterable>
            <el-option v-for="p in staffOthers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="transferRemark" type="textarea" :rows="2" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferOpen = false">取消</el-button>
        <el-button type="primary" :disabled="!transferToId" @click="submitTransfer">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量简单处理 / 误报 -->
    <el-dialog
      v-model="batchModeOpen"
      :title="batchMode === 'falseclose' ? `批量误报关闭（已选择 ${selectForBatch.length} 条）` : `批量简单处理（已选择 ${selectForBatch.length} 条工单）`"
      width="600px"
      destroy-on-close
      append-to-body
    >
      <el-form v-if="batchMode !== 'falseclose'" :model="batchForm" label-width="120px" size="default">
        <el-form-item label="统一处理结果">
          <el-radio-group v-model="batchForm.result">
            <el-radio label="done">完成并关闭</el-radio>
            <el-radio label="reassign">转派</el-radio>
            <el-radio label="urge">催办</el-radio>
            <el-radio label="false_close">误报/取消</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="batchForm.result === 'reassign'"
          label="转派人"
          required
        >
          <el-select v-model="batchForm.assignee" placeholder="请选择班组或人员" class="!w-full" filterable>
            <el-option v-for="p in staffOthers" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="batchForm.remark"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
            placeholder="选填；转派/关闭等建议填写说明"
          />
        </el-form-item>
        <el-form-item label="预览影响">
          <ul class="m-0 pl-4 text-sm text-gray-600 space-y-1 max-h-44 overflow-y-auto">
            <li v-for="r in selectForBatch" :key="r.id">
              • {{ r.id }}: {{ r.summary }} → {{ batchPreviewLine(r) }}
            </li>
          </ul>
        </el-form-item>
      </el-form>
      <p v-else class="text-amber-800 text-sm m-0">
        将选中工单标记为误报并关闭，关联风险事件可置为已忽略（演示）。
      </p>
      <template #footer>
        <el-button @click="batchModeOpen = false">取消</el-button>
        <el-button
          v-if="batchMode === 'falseclose'"
          type="primary"
          @click="doBatchFalseClose"
        >
          确认
        </el-button>
        <el-button
          v-else
          type="primary"
          :disabled="!canSubmitBatchSimple"
          @click="submitBatchSimple"
        >
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量催办 -->
    <el-dialog
      v-model="batchUrgeOpen"
      :title="`批量催办（已选择 ${batchUrgeRows.length} 条工单）`"
      width="520px"
      destroy-on-close
      append-to-body
    >
      <el-form label-width="88px">
        <el-form-item label="催办说明">
          <el-input
            v-model="batchUrgeRemark"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="将一并发送给各单当前责任人（演示）"
          />
        </el-form-item>
        <el-form-item label="工单清单">
          <ul class="m-0 pl-4 text-sm text-gray-600 space-y-1 max-h-48 overflow-y-auto">
            <li v-for="r in batchUrgeRows" :key="r.id">
              • {{ r.id }} {{ r.summary }}（{{ WO_STATUS[r.status]?.label }} · {{ r.assigneeName || '待分配' }}）
            </li>
          </ul>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchUrgeOpen = false">取消</el-button>
        <el-button type="primary" @click="submitBatchUrge">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  CURRENT_USER,
  DISPLAY_URGENCY_FILTER,
  WO_CATEGORY,
  WO_STATUS,
  cloneWorkOrderList,
  filterWorkOrders,
  getDisplayUrgency,
  getEventContextForOrder,
  getWorkOrderDrawerDetail
} from '@/data/workOrderMock'
import { useEventDetailStore } from '@/stores/eventDetail'

const STAFF = [
  { id: 'u-zhang', name: '张三' },
  { id: 'u-li', name: '李四' },
  { id: 'u-wang', name: '王五' },
  { id: 'p-zhang', name: '张工程师' }
]

const staffOthers = computed(() => STAFF.filter((p) => p.id !== CURRENT_USER.id))

const route = useRoute()
const router = useRouter()

const workbenchNav = [
  { path: '/security/workbench/repair', label: '报修工单' },
  { path: '/security/workbench/todo', label: '我的待办' },
  { path: '/security/workbench/initiated', label: '我发起的' },
  { path: '/security/workbench/done', label: '我的已办' },
  { path: '/security/workbench/closed', label: '办结事宜' }
]
const eventDetailStore = useEventDetailStore()
const tableRef = ref(null)
const loading = ref(false)
const allRows = ref([])
const selectedRows = ref([])
const tableHeight = ref(420)
const currentPage = ref(1)
const pageSize = ref(10)

const isAdmin = ref(true)
const isDispatcher = ref(true)

const viewMode = computed(() => route.meta.workOrderView || 'all')

const PAGE_COPY = {
  all: {
    title: '报修工单',
    desc: '全量工单总览。调度员/管理员可转派、催办、关闭；支持按类型、状态、紧急度与时间筛选。'
  },
  todo: {
    title: '我的待办',
    desc: '待接单/处理中且责任人为「当前用户」的工单；可接单、简单处理、转派与催办。'
  },
  initiated: {
    title: '我发起的',
    desc: '本人主动发起或由规则/系统生成、需由您跟踪的工单；发起人列展示为规则名或系统。可催办、补充说明、取消。'
  },
  done: {
    title: '我的已办',
    desc: '曾参与处理但尚未最终办结的工单（如已转交他人后仍在流转）；可催办、补充说明。'
  },
  closed: {
    title: '办结事宜',
    desc: '状态为「已完成」或「已关闭」的归档记录；仅可查看、筛选与导出。'
  }
}

const pageDesc = computed(() => PAGE_COPY[viewMode.value]?.desc || '')

const filters = ref({
  status: '',
  urgency: '',
  category: '',
  dateRange: null,
  keyword: ''
})

const cols = ref({
  woType: true,
  deadline: true,
  initiator: true
})

const filteredRows = computed(() => {
  return filterWorkOrders(allRows.value, viewMode.value, {
    status: filters.value.status || undefined,
    urgency: filters.value.urgency || undefined,
    category: filters.value.category || undefined,
    dateRange: filters.value.dateRange,
    keyword: filters.value.keyword
  })
})

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch(
  [filteredRows, pageSize],
  () => {
    const maxPage = Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value) || 1)
    if (currentPage.value > maxPage) currentPage.value = maxPage
  },
  { deep: true }
)

watch(
  () => [filters.value.status, filters.value.keyword, viewMode.value],
  () => {
    currentPage.value = 1
  }
)

const canBatch = computed(
  () => selectedRows.value.length > 0 && viewMode.value !== 'closed' && viewMode.value !== 'initiated'
)

const canBatchBatchAccept = computed(() => {
  if (!selectedRows.value.length) return false
  return selectedRows.value.some(
    (r) => r.status === 'pending' && r.assigneeId === CURRENT_USER.id
  )
})

const opColWidth = computed(() => {
  if (viewMode.value === 'closed') return 72
  return 132
})

function resetFilters() {
  filters.value = { status: '', urgency: '', category: '', dateRange: null, keyword: '' }
  currentPage.value = 1
}

/**
 * 从路由 query 应用筛选（风险看板「查看详情/处置」携带 fromRiskBoard=1）。
 */
function applyWorkbenchRouteQuery() {
  const q = route.query
  if (q.fromRiskBoard !== '1') return

  if (q.category && ['risk', 'repair', 'inspection'].includes(String(q.category))) {
    filters.value.category = String(q.category)
  }
  if ('status' in q) {
    const s = q.status
    if (!s) filters.value.status = ''
    else if (WO_STATUS[s]) filters.value.status = String(s)
  }
  if ('keyword' in q) {
    filters.value.keyword = q.keyword ? String(q.keyword) : ''
  }
  const ds = q.start || q.dateStart
  const de = q.end || q.dateEnd
  if (ds && de) {
    filters.value.dateRange = [String(ds), String(de)]
  }
}

function applySearch() {
  currentPage.value = 1
}

function onWorkbenchTabClick(pane) {
  const name = unref(pane.paneName) ?? pane.props?.name
  if (name != null && name !== route.path) {
    router.push({ path: String(name), query: { ...route.query } }).catch(() => {})
  }
}

function onMoreCommand(cmd) {
  if (cmd === 'export-filtered') {
    exportFilteredList()
  } else if (cmd === 'reset-filters') {
    resetFilters()
  }
}

function onColCommand(cmd) {
  if (cmd === 'reset') {
    cols.value = { woType: true, deadline: true, initiator: true }
  }
}

const detailDrawerVisible = ref(false)
const drawerRow = ref(null)
const drawerDetail = ref(null)
const detailLoading = ref(false)
const drawerWidth = ref('520px')

function syncDrawerWidth() {
  drawerWidth.value = window.innerWidth < 768 ? '100%' : '520px'
}

async function openDetailDrawer(row) {
  drawerRow.value = row
  drawerDetail.value = null
  syncDrawerWidth()
  detailDrawerVisible.value = true
  detailLoading.value = true
  await new Promise((r) => setTimeout(r, 200))
  if (!drawerRow.value || drawerRow.value.id !== row.id) return
  drawerDetail.value = getWorkOrderDrawerDetail(row)
  detailLoading.value = false
}

function tryFocusWoFromQuery() {
  const raw = route.query.focusWo
  if (typeof raw !== 'string' || !raw.trim()) return
  const id = raw.trim()
  const row = allRows.value.find((r) => r.id === id)
  if (!row) return
  openDetailDrawer(row)
  const q = { ...route.query }
  delete q.focusWo
  router.replace({ path: route.path, query: q }).catch(() => {})
}

function onDetailDrawerClosed() {
  drawerRow.value = null
  drawerDetail.value = null
}

function processFromDrawer() {
  const row = drawerRow.value
  if (!row) return
  detailDrawerVisible.value = false
  nextTick(() => openProcessModal(row))
}

function openDetailFromProcessModal() {
  const row = processTarget.value
  if (!row) return
  processVisible.value = false
  nextTick(() => openDetailDrawer(row))
}

function openEventFromDrawer() {
  const id = drawerDetail.value?.relatedEvent?.id
  if (id) eventDetailStore.openById(id)
}

function urgencyEmoji(u) {
  if (!u) return ''
  if (u.elType === 'danger') return '🔴'
  if (u.elType === 'warning') return '🟠'
  return '⚫'
}

function mockDownload(f) {
  ElMessage.success(`演示：将下载 ${f.name}`)
}

function onResizeWorkbenchLayout() {
  calcTableHeight()
  syncDrawerWidth()
}

function calcTableHeight() {
  tableHeight.value = Math.max(280, window.innerHeight - 380)
}
onMounted(() => {
  allRows.value = cloneWorkOrderList()
  applyWorkbenchRouteQuery()
  syncDrawerWidth()
  calcTableHeight()
  window.addEventListener('resize', onResizeWorkbenchLayout)
  nextTick(() => tryFocusWoFromQuery())
})
onUnmounted(() => {
  window.removeEventListener('resize', onResizeWorkbenchLayout)
})

function statusTagType(s) {
  return WO_STATUS[s]?.tag || 'info'
}

function deadlineDisplay(row) {
  const m = row.remainingMinutes
  if (m < 0) {
    return { text: '已超时', lineClass: 'text-gray-500 font-medium', showOverdueTag: true }
  }
  if (m === 0) {
    return { text: '即将到期', lineClass: 'text-red-600 font-medium', showOverdueTag: false }
  }
  const text = `剩余${m}分钟`
  if (m > 120) {
    return { text, lineClass: 'text-green-600 font-medium', showOverdueTag: false }
  }
  if (m >= 60) {
    return { text, lineClass: 'text-orange-600 font-medium', showOverdueTag: false }
  }
  return { text, lineClass: 'text-red-600 font-medium', showOverdueTag: false }
}

function buildProcessOptions(row) {
  const vm = viewMode.value
  const opts = []
  if (vm === 'closed' || !row) return opts

  if (vm === 'initiated') {
    opts.push({ id: 'urge', label: '催办（仅提醒当前责任人）' })
    opts.push({ id: 'note', label: '补充说明（写入处理日志）' })
    if (row.status === 'pending' || row.status === 'processing') {
      opts.push({ id: 'false_close', label: '误报/取消（关闭工单）' })
    }
    return opts
  }

  if (vm === 'done') {
    opts.push({ id: 'urge', label: '催办（仅提醒当前责任人）' })
    opts.push({ id: 'note', label: '补充说明（写入处理日志）' })
    return opts
  }

  const actionable = row.status !== 'done' && row.status !== 'closed'
  if (row.status === 'pending' && row.assigneeId === CURRENT_USER.id && (vm === 'todo' || vm === 'all')) {
    opts.push({ id: 'accept', label: '接单' })
  }

  const mayComplete = actionable && (canSimple(row, vm === 'todo' ? 'todo' : 'all') || isAdmin.value)
  if (mayComplete) {
    opts.push({ id: 'done', label: '完成并关闭' })
    opts.push({ id: 'false_close', label: '误报/取消（关闭工单）' })
  }

  if (actionable && (vm === 'todo' || isDispatcher.value)) {
    opts.push({ id: 'transfer', label: '转派给他人' })
    opts.push({ id: 'urge', label: '催办（仅提醒当前责任人）' })
  }

  return opts
}

const processVisible = ref(false)
const processTarget = ref(null)
const processForm = ref({ action: '', remark: '', assignee: '' })
const processEventExpanded = ref(false)

const processOptions = computed(() => buildProcessOptions(processTarget.value))

const processEventDetail = computed(() => {
  const id = processTarget.value?.eventId
  if (!id) return null
  return getEventContextForOrder(id)
})

watch(
  [processVisible, processOptions],
  () => {
    if (!processVisible.value || !processOptions.value.length) return
    const first = processOptions.value[0].id
    if (!processOptions.value.some((o) => o.id === processForm.value.action)) {
      processForm.value.action = first
    }
  },
  { flush: 'post' }
)

watch(processVisible, (v) => {
  if (!v) processEventExpanded.value = false
})

function toggleProcessEventDetail() {
  processEventExpanded.value = !processEventExpanded.value
}

function resetProcessModal() {
  processTarget.value = null
  processForm.value = { action: '', remark: '', assignee: '' }
}

function openProcessModal(row) {
  processTarget.value = row
  processForm.value = { action: '', remark: '', assignee: '' }
  processEventExpanded.value = false
  processVisible.value = true
}

const canSubmitProcess = computed(() => {
  if (processForm.value.action === 'transfer') return !!processForm.value.assignee
  return true
})

function submitProcess() {
  const row = processTarget.value
  if (!row || !canSubmitProcess.value) return
  const act = processForm.value.action
  const remark = processForm.value.remark.trim()

  if (act === 'accept') {
    acceptOne(row)
  } else if (act === 'done') {
    markParticipated(row)
    row.status = 'done'
    ElMessage.success(remark ? `已标记完成：${remark.slice(0, 40)}…` : '工单已完成')
  } else if (act === 'false_close') {
    markParticipated(row)
    row.status = 'closed'
    ElMessage.success('工单已关闭' + (row.eventId ? '；关联事件可标记误报（演示）' : ''))
  } else if (act === 'transfer') {
    const t = findStaff(processForm.value.assignee)
    markParticipated(row)
    row.assigneeId = t.id
    row.assigneeName = t.name
    row.status = 'pending'
    ElMessage.success('已转派，新责任人待接')
  } else if (act === 'urge') {
    urgeOne(row)
  } else if (act === 'note') {
    ElMessage.success(remark ? `已记录说明：${remark.slice(0, 60)}${remark.length > 60 ? '…' : ''}` : '已记录（演示）')
  }

  processVisible.value = false
}

function rowSelectable(row) {
  if (viewMode.value === 'closed' && isAdmin.value) return true
  if (row.status === 'done' || row.status === 'closed') return false
  return true
}

function onSelectionChange(list) {
  selectedRows.value = list
}

function clearSelection() {
  tableRef.value?.clearSelection()
  selectedRows.value = []
}

function openEvent(row) {
  if (row.eventId) eventDetailStore.openById(row.eventId)
}

function canSimple(row, mode) {
  if (row.status !== 'pending' && row.status !== 'processing') return false
  if (mode === 'todo') {
    return row.assigneeId === CURRENT_USER.id
  }
  return isDispatcher.value
}

function markParticipated(wo) {
  const ids = wo.participatedUserIds || (wo.participatedUserIds = [])
  if (!ids.includes(CURRENT_USER.id)) ids.push(CURRENT_USER.id)
}

function findStaff(id) {
  return STAFF.find((s) => s.id === id) || { id, name: id }
}

function acceptOne(row) {
  if (row.status !== 'pending' || row.assigneeId !== CURRENT_USER.id) return
  markParticipated(row)
  row.status = 'processing'
  ElMessage.success('已接单，状态为「处理中」')
}

function batchAccept() {
  let n = 0
  selectedRows.value.forEach((row) => {
    if (row.status === 'pending' && row.assigneeId === CURRENT_USER.id) {
      markParticipated(row)
      row.status = 'processing'
      n++
    }
  })
  ElMessage[n ? 'success' : 'info'](n ? `已批量接单 ${n} 条` : '无待接工单可处理')
  clearSelection()
}

const transferOpen = ref(false)
const transferRow = ref(null)
const transferToId = ref('')
const transferRemark = ref('')
const batchTransferMode = ref(false)
const selectForBatch = ref([])

function submitTransfer() {
  const tid = transferToId.value
  if (!tid) return
  const t = findStaff(tid)
  if (batchTransferMode.value) {
    const skipped = []
    let ok = 0
    selectForBatch.value.forEach((row) => {
      if (row.status !== 'pending' && row.status !== 'processing') {
        skipped.push(row.id)
        return
      }
      markParticipated(row)
      row.assigneeId = t.id
      row.assigneeName = t.name
      row.status = 'pending'
      ok++
    })
    if (skipped.length) {
      ElMessage.warning(`已跳过 ${skipped.length} 条（非待接单/处理中）；成功转派 ${ok} 条`)
    } else {
      ElMessage.success(`批量转派已提交（演示）共 ${ok} 条`)
    }
  } else if (transferRow.value) {
    const row = transferRow.value
    if (row.status === 'done' || row.status === 'closed') {
      ElMessage.warning('已办结/关闭的工单不能转派')
      transferOpen.value = false
      return
    }
    markParticipated(row)
    row.assigneeId = t.id
    row.assigneeName = t.name
    row.status = 'pending'
    ElMessage.success('已转派，新责任人待接')
  }
  transferOpen.value = false
  clearSelection()
}

const batchModeOpen = ref(false)
const batchMode = ref('simple')
const batchForm = ref({ result: 'done', remark: '', assignee: '' })

const batchUrgeOpen = ref(false)
const batchUrgeRows = ref([])
const batchUrgeRemark = ref('')

function batchPreviewLine(row) {
  const r = batchForm.value.result
  if (r === 'done') return '完成并关闭'
  if (r === 'false_close') return '误报/关闭'
  if (r === 'urge') return '催办通知'
  if (r === 'reassign') {
    if (batchForm.value.assignee) {
      return `转派给 ${findStaff(batchForm.value.assignee).name}`
    }
    return '转派（请选择人员）'
  }
  return '—'
}

const canSubmitBatchSimple = computed(() => {
  if (batchForm.value.result === 'reassign') return !!batchForm.value.assignee
  return true
})

function openBatch(mode) {
  if (!selectedRows.value.length) {
    ElMessage.info('请先勾选工单')
    return
  }
  const list = selectedRows.value.filter(
    (r) => (r.status === 'pending' || r.status === 'processing') && r.status !== 'closed'
  )
  if (!list.length) {
    ElMessage.warning('所选工单中无进行中的可处理项')
    return
  }
  if (mode === 'transfer') {
    batchTransferMode.value = true
    transferRow.value = null
    selectForBatch.value = list
    transferToId.value = ''
    transferRemark.value = ''
    transferOpen.value = true
    return
  }
  if (mode === 'falseclose') {
    selectForBatch.value = list
    batchMode.value = 'falseclose'
    batchModeOpen.value = true
    return
  }
  selectForBatch.value = list
  batchMode.value = 'simple'
  batchForm.value = { result: 'done', remark: '', assignee: '' }
  batchModeOpen.value = true
}

function submitBatchSimple() {
  if (batchForm.value.result === 'reassign' && !batchForm.value.assignee) return
  if (batchForm.value.result === 'urge') {
    ElMessage.success(
      `已向 ${selectForBatch.value.length} 条发送催办${batchForm.value.remark.trim() ? '（附说明）' : ''}（演示）`
    )
    batchModeOpen.value = false
    clearSelection()
    return
  }
  const lines = []
  selectForBatch.value.forEach((row, i) => {
    if (selectForBatch.value.length > 2 && i === 2) {
      lines.push(`失败：${row.id} — 状态冲突（演示单条失败）`)
      return
    }
    if (batchForm.value.result === 'reassign' && batchForm.value.assignee) {
      const t = findStaff(batchForm.value.assignee)
      markParticipated(row)
      row.assigneeId = t.id
      row.assigneeName = t.name
      row.status = 'pending'
    } else if (batchForm.value.result === 'false_close') {
      markParticipated(row)
      row.status = 'closed'
    } else {
      markParticipated(row)
      row.status = 'done'
    }
  })
  if (lines.length) {
    ElMessage.error(lines[0] + '（其他已处理）')
  } else {
    ElMessage.success('批量处理已提交（演示）')
  }
  batchModeOpen.value = false
  clearSelection()
}

function doBatchFalseClose() {
  selectForBatch.value.forEach((row) => {
    markParticipated(row)
    row.status = 'closed'
  })
  ElMessage.success('已批量误报关闭（演示）')
  batchModeOpen.value = false
  clearSelection()
}

function openBatchUrgeDialog() {
  if (!selectedRows.value.length) {
    ElMessage.info('请先勾选工单')
    return
  }
  batchUrgeRows.value = selectedRows.value.slice()
  batchUrgeRemark.value = ''
  batchUrgeOpen.value = true
}

function submitBatchUrge() {
  const n = batchUrgeRows.value.length
  const tail = batchUrgeRemark.value.trim()
    ? `（说明：${batchUrgeRemark.value.trim().slice(0, 40)}${
        batchUrgeRemark.value.trim().length > 40 ? '…' : ''
      }）`
    : ''
  ElMessage.success(`已向 ${n} 条工单的当前责任人发送催办通知${tail}（演示）`)
  batchUrgeOpen.value = false
  clearSelection()
}

function exportSelected() {
  if (!isAdmin.value) {
    ElMessage.warning('无导出权限')
    return
  }
  const n = selectedRows.value.length
  ElMessage.success(
    `将导出 ${n} 条已选（编号/类型/紧急/摘要/位置/状态/时间/责任人等，Excel 演示）`
  )
  clearSelection()
}

function exportFilteredList() {
  if (!isAdmin.value) {
    ElMessage.warning('无导出权限')
    return
  }
  const n = filteredRows.value.length
  ElMessage.success(`将按当前筛选项导出共 ${n} 条为 Excel（演示）`)
}

function urgeOne(row) {
  ElMessage.success(
    `已向 ${row.assigneeName || '责任人'} 发送催办：${row.id}（演示）`
  )
}

watch(
  () => route.fullPath,
  () => {
    applyWorkbenchRouteQuery()
    nextTick(() => tryFocusWoFromQuery())
  }
)

watch(
  viewMode,
  () => {
    currentPage.value = 1
    clearSelection()
  },
  { immediate: true }
)
</script>

<style scoped>
/* 与风险规则页 risk-rule-main-tabs 一致：仅展示标签栏，内容在下方 .workbench-body */
.workbench-page :deep(.workbench-main-tabs .el-tabs__header) {
  margin-bottom: 0;
}
.workbench-page :deep(.workbench-main-tabs .el-tabs__content) {
  display: none;
}
.workbench-body {
  padding-top: 16px;
}
.workbench-page :deep(.workbench-actions-col .cell) {
  white-space: nowrap;
}
.workbench-page :deep(.workbench-table .el-table__header th) {
  color: var(--yw-text-primary);
  font-weight: 600;
}
.workbench-page :deep(.workbench-table .el-table__header-wrapper) {
  z-index: 2;
}
.workbench-page :deep(.workbench-ops) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.35rem;
  align-items: center;
  line-height: 1.45;
}
.workbench-page :deep(.workbench-ops .el-button.is-link) {
  font-weight: 500;
  font-size: 13px;
  padding: 0 2px;
}

.workorder-detail-drawer :deep(.el-drawer__body) {
  padding: 0 16px 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 72px);
}
.detail-drawer-inner {
  min-height: 0;
}
.detail-section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--yw-text-primary, #1f2937);
}
.detail-card {
  border-radius: 10px;
  border: 1px solid var(--yw-border, #e5e7eb);
  background: rgba(249, 250, 251, 0.85);
  padding: 12px 14px;
}
.workorder-detail-drawer :deep(.el-timeline) {
  padding-left: 2px;
}
.workorder-detail-drawer :deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: #6b7280;
}
</style>
