#!/bin/sh
# 移除 set -e，避免迁移失败导致容器重启循环
echo "🚀 Starting Production Environment..."

# 确保在正确的目录
cd /app

# 运行数据库迁移
echo "📡 Running Database Migrations..."
# 切换到 infra/database 目录以便 Prisma CLI 能找到 prisma.config.ts
if [ -n "$DATABASE_URL" ]; then
  cd /app/infra/database
  # 创建临时的 .env 文件供 Prisma CLI 使用
  echo "DATABASE_URL=$DATABASE_URL" > .env
  echo "Created .env file with DATABASE_URL in infra/database"
  # 直接调用 Prisma CLI (pnpm deploy 后的路径结构)
  node /app/node_modules/.pnpm/prisma@7.2.0_@types+react@19.2.7_react-dom@19.2.3_react@19.2.3__react@19.2.3_typescript@5.9.3/node_modules/prisma/build/index.js migrate deploy || echo "⚠️  Migration failed, continuing anyway..."
  rm -f .env
  echo "Cleaned up .env file"
  # 切换回根目录
  cd /app
else
  echo "⚠️  DATABASE_URL not set, skipping migrations"
fi

echo "🌟 Starting Server..."
# 使用 node 直接运行编译后的代码
node dist/main.js
