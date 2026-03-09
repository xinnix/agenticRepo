# 生产环境部署指南

本文档提供了 FeedbackHub 系统在生产环境中部署的完整指南。

## 📋 目录

- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [部署步骤](#部署步骤)
- [健康检查](#健康检查)
- [故障排查](#故障排查)
- [维护指南](#维护指南)

## 前置要求

### 服务器要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 8+)
- **内存**: 最少 2GB RAM (推荐 4GB+)
- **CPU**: 最少 2 核 (推荐 4 核+)
- **存储**: 最少 20GB 可用空间
- **网络**: 开放端口 80, 443, 3000

### 软件要求

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **PostgreSQL**: 13+ (外部数据库)
- **域名**: 已配置 DNS 解析 (可选)

### 外部服务

- **PostgreSQL 数据库**: 13+ 版本
- **阿里云 OSS**: 如果使用 OSS 文件存储 (可选)
- **微信小程序**: 需要微信开放平台账号 (可选)

## 快速开始

### 1. 准备环境变量

```bash
# 复制环境变量模板
cp .env.prod.example .env.prod

# 编辑环境变量（必需）
vi .env.prod
```

**重要配置项**:
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `JWT_SECRET`: JWT 密钥（至少 32 个字符）
- `VITE_API_URL`: 前端访问后端的 URL

### 2. 构建 Docker 镜像

```bash
# 构建 API 镜像
docker build -f Dockerfile.api -t feedbackhub-api:v1-latest .

# 构建 Admin 镜像
docker build -f Dockerfile.admin -t feedbackhub-admin:v1-latest .
```

### 3. 启动服务

```bash
# 启动所有服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 详细配置

### 环境变量说明

#### 数据库配置

```bash
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

- **username**: 数据库用户名
- **password**: 数据库密码
- **host**: 数据库主机地址
- **5432**: 数据库端口
- **database_name**: 数据库名称

#### 安全配置

```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://yourdomain.com
```

- **JWT_SECRET**: 使用强随机字符串，至少 32 个字符
- **CORS_ORIGIN**: 生产环境应设置具体域名，不要使用 `*`

#### 文件存储配置

支持两种存储方式：

1. **本地存储** (默认):
```bash
FILE_STORAGE_PROVIDER=local
UPLOAD_PATH=./uploads
```

2. **阿里云 OSS**:
```bash
FILE_STORAGE_PROVIDER=aliyun-oss
OSS_ENDPOINT=oss-cn-zhangjiakou.aliyuncs.com
OSS_REGION=oss-cn-zhangjiakou
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_USE_SIGNED_URL=false
```

### 健康检查配置

生产环境已配置健康检查：

- **API 服务**: 
  - 检查端点: `/health`
  - 间隔: 30 秒
  - 超时: 10 秒
  - 重试: 3 次

- **Admin 服务**:
  - 检查端点: `/`
  - 间隔: 30 秒
  - 超时: 5 秒
  - 重试: 3 次

### 日志配置

日志文件配置：
- **最大大小**: 10MB
- **最大文件数**: 3 个
- **总大小**: 30MB per service

查看日志：
```bash
# 实时查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f admin

# 查看最近 100 行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 资源限制

默认资源限制：

**API 服务**:
- CPU 限制: 1.0 核心
- 内存限制: 1GB
- CPU 保留: 0.25 核心
- 内存保留: 256MB

**Admin 服务**:
- CPU 限制: 0.5 核心
- 内存限制: 256MB
- CPU 保留: 0.1 核心
- 内存保留: 64MB

可以根据实际负载调整这些值。

## 部署步骤

### 完整部署流程

1. **克隆代码**
```bash
git clone <repository-url>
cd feedbackHub
git checkout v1
```

2. **配置环境变量**
```bash
cp .env.prod.example .env.prod
vi .env.prod
```

3. **构建镜像**
```bash
# 构建 API 镜像
docker build -f Dockerfile.api -t feedbackhub-api:v1-latest .

# 构建 Admin 镜像
docker build -f Dockerfile.admin -t feedbackhub-admin:v1-latest .
```

4. **启动服务**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

5. **验证部署**
```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 检查健康状态
curl http://localhost:3000/health
curl http://localhost:80/

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 使用 1Panel 部署

如果使用 1Panel 部署：

1. 在 1Panel 中创建网站
2. 配置环境变量（`1panel.env`）
3. 上传镜像或从镜像仓库拉取
4. 启动容器

## 健康检查

### 检查端点

- **API 健康检查**: `GET /health`
- **Admin 健康检查**: `GET /`

### 监控指标

监控以下指标：

- **CPU 使用率**: `docker stats`
- **内存使用率**: `docker stats`
- **磁盘空间**: `df -h`
- **容器状态**: `docker-compose ps`

### 告警配置

建议配置以下告警：

- 容器退出
- 健康检查失败
- CPU 使用率 > 80%
- 内存使用率 > 80%
- 磁盘空间 < 20%

## 故障排查

### 常见问题

#### 1. 容器启动失败

```bash
# 查看详细日志
docker logs feedbackhub-api-prod
docker logs feedbackhub-admin-prod

# 检查环境变量
docker exec feedbackhub-api-prod env | grep DATABASE_URL

# 检查数据库连接
docker exec feedbackhub-api-prod ping <database-host>
```

#### 2. 数据库连接失败

- 检查 `DATABASE_URL` 是否正确
- 确认数据库服务器可访问
- 验证数据库用户名和密码
- 检查数据库防火墙规则

#### 3. 迁移失败

```bash
# 查看迁移日志
docker logs feedbackhub-api-prod | grep -i migration

# 手动运行迁移
docker exec feedbackhub-api-prod sh -c "
  cd /app/infra/database && \
  echo 'DATABASE_URL=\$DATABASE_URL' > .env && \
  node /app/node_modules/.pnpm/prisma@*/build/index.js migrate deploy && \
  rm .env
"
```

#### 4. 文件上传失败

- 检查 `FILE_STORAGE_PROVIDER` 配置
- 确认 OSS 配置正确（如果使用 OSS）
- 检查上传目录权限
- 查看应用日志获取详细错误

### 日志位置

- **应用日志**: `docker-compose logs`
- **Nginx 日志**: 容器内 `/var/log/nginx/`
- **系统日志**: `/var/log/syslog`

## 维护指南

### 更新部署

```bash
# 1. 拉取最新代码
git pull origin v1

# 2. 停止当前服务
docker-compose -f docker-compose.prod.yml down

# 3. 构建新镜像
docker build -f Dockerfile.api -t feedbackhub-api:v1-latest .
docker build -f Dockerfile.admin -t feedbackhub-admin:v1-latest .

# 4. 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 5. 验证更新
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### 数据库备份

定期备份 PostgreSQL 数据库：

```bash
# 备份数据库
pg_dump $DATABASE_URL > feedbackhub_backup_$(date +%Y%m%d).sql

# 恢复数据库
psql $DATABASE_URL < feedbackhub_backup_20250309.sql
```

建议使用 cron 定时任务自动备份：

```bash
# 每天凌晨 2 点备份
0 2 * * * /usr/bin/pg_dump $DATABASE_URL > /backups/feedbackhub_$(date +\%Y\%m\%d).sql
```

### 容器维护

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune

# 查看资源使用
docker system df
```

### 监控建议

使用以下工具监控生产环境：

- **Prometheus + Grafana**: 指标收集和可视化
- **cAdvisor**: 容器性能监控
- **ELK Stack**: 日志聚合和分析
- **Sentry**: 错误追踪

## 安全建议

### 生产环境安全检查清单

- [ ] 修改默认的 JWT_SECRET
- [ ] 配置正确的 CORS_ORIGIN
- [ ] 使用强密码
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 定期更新依赖
- [ ] 配置日志审计
- [ ] 实施数据备份策略
- [ ] 限制容器权限
- [ ] 使用非 root 用户运行容器

### HTTPS 配置

使用 Let's Encrypt 免费证书：

```bash
# 安装 certbot
apt-get install certbot

# 获取证书
certbot certonly --standalone -d yourdomain.com

# 配置 Nginx 使用 HTTPS
# 修改 nginx.conf 添加 SSL 配置
```

## 附录

### 有用的命令

```bash
# 查看容器资源使用
docker stats

# 进入容器调试
docker exec -it feedbackhub-api-prod sh

# 重启服务
docker-compose -f docker-compose.prod.yml restart api

# 查看服务日志
docker-compose -f docker-compose.prod.yml logs -f api

# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 完全清理（包括卷）
docker-compose -f docker-compose.prod.yml down -v
```

### 支持与联系

- **文档**: `/docs`
- **问题反馈**: GitHub Issues
- **邮件支持**: support@example.com

## 更新日志

- **v1.0.0** (2025-03-09): 初始生产环境部署配置
