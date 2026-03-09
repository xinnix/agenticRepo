# Docker 开发环境使用指南

## 概述

Docker 开发环境用于在本地测试 Docker 部署，模拟生产环境配置。

**注意：** 此环境**不挂载源代码**，代码修改需要重新构建镜像。

## 前置要求

1. **Docker Desktop** 或 Docker Engine 已安装
2. **外部 PostgreSQL 数据库**（或 Docker 运行的 PostgreSQL）
3. **环境变量配置**

## 快速开始

### 1. 配置环境变量

创建 `.env` 文件（或在命令行设置环境变量）：

```bash
# 必需：数据库连接
DATABASE_URL=postgresql://postgres:password@localhost:5432/feedbackhub

# 可选：JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# 可选：微信小程序配置
WX_APP_ID=your_app_id
WX_APP_SECRET=your_app_secret

# 可选：文件存储配置
FILE_STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads

# 可选：阿里云 OSS 配置
OSS_ENDPOINT=oss-cn-zhangjiakou.aliyuncs.com
OSS_REGION=oss-cn-zhangjiakou
OSS_ACCESS_KEY_ID=your_access_key
OSS_ACCESS_KEY_SECRET=your_secret_key
OSS_BUCKET=feedbackhub
```

### 2. 启动服务

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.dev.yml up --build

# 或者在后台运行
docker-compose -f docker-compose.dev.yml up --build -d
```

### 3. 访问服务

- **后端 API**: http://localhost:3000
  - tRPC: http://localhost:3000/trpc
  - REST API: http://localhost:3000/api
  - Swagger 文档: http://localhost:3000/api/docs

- **前端 Admin**: http://localhost:5173

### 4. 查看日志

```bash
# 查看所有日志
docker-compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.dev.yml logs -f api
docker-compose -f docker-compose.dev.yml logs -f admin
```

### 5. 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose.dev.yml down

# 停止并删除卷
docker-compose -f docker-compose.dev.yml down -v
```

## 工作流程

### 开发流程

由于不挂载源代码，开发流程如下：

1. **修改代码**
2. **重新构建镜像**
   ```bash
   # 重新构建 API
   docker-compose -f docker-compose.dev.yml build api

   # 重新构建 Admin
   docker-compose -f docker-compose.dev.yml build admin

   # 重新构建所有
   docker-compose -f docker-compose.dev.yml build
   ```
3. **重启服务**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

### 快速重开发流程

使用单个命令：

```bash
# 重新构建并启动
docker-compose -f docker-compose.dev.yml up --build

# 或者在后台
docker-compose -f docker-compose.dev.yml up --build -d
```

## 数据库配置

### 方式 1: 使用外部数据库

```bash
# 设置 DATABASE_URL
export DATABASE_URL=postgresql://postgres:password@your-host:5432/feedbackhub

# 启动服务
docker-compose -f docker-compose.dev.yml up
```

### 方式 2: 使用 Docker 运行 PostgreSQL

创建 `docker-compose.db.yml`：

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    container_name: feedbackhub-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: feedbackhub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

启动数据库：

```bash
docker-compose -f docker-compose.db.yml up -d

# 然后启动应用
docker-compose -f docker-compose.dev.yml up
```

## 常见问题

### 1. 端口被占用

如果端口 3000 或 5173 已被占用，修改 `docker-compose.dev.yml`：

```yaml
ports:
  - "3001:3000"  # 使用 3001 端口
```

### 2. 数据库连接失败

检查：
- DATABASE_URL 是否正确
- PostgreSQL 是否运行
- 网络连接是否正常（`docker network ls`）

### 3. 镜像构建失败

清理并重新构建：

```bash
# 清理旧镜像
docker-compose -f docker-compose.dev.yml down --rmi all

# 重新构建（不使用缓存）
docker-compose -f docker-compose.dev.yml build --no-cache

# 启动
docker-compose -f docker-compose.dev.yml up
```

### 4. 容器内依赖问题

进入容器检查：

```bash
# 进入 API 容器
docker-compose -f docker-compose.dev.yml exec api sh

# 检查依赖
ls -la node_modules
cat package.json

# 测试启动
pnpm dev:api
```

## 与生产环境的区别

| 特性 | 开发环境 | 生产环境 |
|------|---------|---------|
| 配置文件 | docker-compose.dev.yml | docker-compose.prod.yml |
| 镜像 | development target | production target |
| 启动命令 | pnpm dev:api | node dist/main.js |
| 热重载 | ✅ 支持 | ❌ 不支持 |
| 源代码挂载 | ❌ 不挂载 | ❌ 不挂载 |
| 健康检查 | 端口检查 | HTTP 健康检查 |

## 优化建议

### 加速构建

使用 BuildKit 和缓存：

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 构建时使用缓存
docker-compose -f docker-compose.dev.yml build

# 或在 ~/.docker/config.json 中配置
{
  "features": {
    "buildkit": true
  }
}
```

### 减小镜像大小

开发环境使用 `alpine` 基础镜像，已经比较小。如需更小：

- 考虑使用 `docker-slim` 优化
- 只安装必需的依赖

## 故障排查

### 查看容器状态

```bash
# 查看所有容器
docker-compose -f docker-compose.dev.yml ps

# 查看容器详细信息
docker inspect feedbackhub-api-dev
docker inspect feedbackhub-admin-dev
```

### 查看资源使用

```bash
# 查看容器资源使用
docker stats feedbackhub-api-dev feedbackhub-admin-dev
```

### 进入容器调试

```bash
# 进入 API 容器
docker-compose -f docker-compose.dev.yml exec api sh

# 进入 Admin 容器
docker-compose -f docker-compose.dev.yml exec admin sh
```

## 相关文件

- `docker-compose.dev.yml` - 开发环境配置
- `docker-compose.prod.yml` - 生产环境配置
- `Dockerfile.api` - API Dockerfile
- `Dockerfile.admin` - Admin Dockerfile
- `.dockerignore` - Docker 忽略文件

## 下一步

- 配置 CI/CD 自动构建
- 设置多阶段部署（开发 → 测试 → 生产）
- 配置日志收集和监控
- 设置自动备份和恢复
