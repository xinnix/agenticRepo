#!/bin/bash
# 清空数据库脚本 - 删除所有表和枚举类型

DB_HOST="47.109.94.212"
DB_PORT="5432"
DB_NAME="feedbackHub"
DB_USER="xinnix"
DB_PASSWORD="x12345678"

echo "开始清空数据库..."

# 使用 docker 运行 PostgreSQL 客户端
docker run --rm postgres:18-alpine psql \
  "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
  << 'EOF'
-- 先删除所有枚举类型
DROP TYPE IF EXISTS "NotificationType" CASCADE;
DROP TYPE IF EXISTS "CommentType" CASCADE;
DROP TYPE IF EXISTS "AttachmentType" CASCADE;
DROP TYPE IF EXISTS "LocationType" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;
DROP TYPE IF EXISTS "TicketStatus" CASCADE;
DROP TYPE IF EXISTS "AssignType" CASCADE;

-- 删除所有表（按照外键依赖顺序）
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "status_history" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "attachments" CASCADE;
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "preset_areas" CASCADE;
DROP TABLE IF EXISTS "categories" CASCADE;
DROP TABLE IF EXISTS "todos" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "user_roles" CASCADE;
DROP TABLE IF EXISTS "role_permissions" CASCADE;
DROP TABLE IF EXISTS "permissions" CASCADE;
DROP TABLE IF EXISTS "roles" CASCADE;
DROP TABLE IF EXISTS "departments" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

SELECT 'Database cleared successfully!' AS result;
EOF

echo "数据库清空完成！"
