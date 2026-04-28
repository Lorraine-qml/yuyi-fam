-- 用户维度预警消息表（与实时事件表解耦，按租户+用户查询）
-- MySQL 5.7+ / 8.0+

CREATE TABLE IF NOT EXISTS notification_message (
  id VARCHAR(32) PRIMARY KEY,
  tenant_id VARCHAR(32) NOT NULL,
  user_id VARCHAR(32) NOT NULL,
  event_id VARCHAR(32) NOT NULL,
  workorder_id VARCHAR(32) DEFAULT NULL,
  title VARCHAR(256) NOT NULL,
  content TEXT,
  level VARCHAR(10) COMMENT 'high / medium / low',
  status VARCHAR(20) COMMENT 'pending / processing / closed',
  is_read TINYINT NOT NULL DEFAULT 0 COMMENT '0=未读,1=已读',
  create_time DATETIME NOT NULL,
  read_time DATETIME DEFAULT NULL,
  KEY idx_tenant_user (tenant_id, user_id),
  KEY idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
