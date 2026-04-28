-- 实时事件表扩展：触发来源与规则关联（与 notification、风险规则模块对齐）
-- 取值与前端 EVENT_SOURCE 常量一致

-- ALTER TABLE realtime_event 示例（表名请按项目实际表名调整）：
-- ALTER TABLE realtime_event
--   ADD COLUMN source VARCHAR(20) NULL COMMENT 'rule / third_party / manual' AFTER event_level,
--   ADD COLUMN rule_id VARCHAR(32) NULL COMMENT '风险规则ID（source=rule）' AFTER source,
--   ADD COLUMN metric_id VARCHAR(32) NULL COMMENT '指标ID（可选）' AFTER rule_id;
-- CREATE INDEX idx_event_source (tenant_id, source);

-- 预警消息表可同步扩展来源（与列表、抽屉一致，可选）：
-- ALTER TABLE notification_message
--   ADD COLUMN source VARCHAR(20) NULL COMMENT 'rule / third_party / manual' AFTER level,
--   ADD COLUMN rule_id VARCHAR(32) NULL AFTER source,
--   ADD COLUMN rule_name VARCHAR(256) NULL AFTER rule_id;
