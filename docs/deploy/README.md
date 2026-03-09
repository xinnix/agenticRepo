# FeedbackHub 部署文档

本目录包含 FeedbackHub 系统的部署相关文档和脚本。

## 📁 文件结构

```
docs/deploy/
├── README.md              # 本文件
├── production.md          # 生产环境部署详细指南
└── ../                   # 其他文档
```

## 🚀 快速开始

### 本地开发环境

参考根目录的 `docker-compose.local.yml` 配置。

### 生产环境部署

1. **阅读部署指南**: [production.md](./production.md)
2. **配置环境变量**: 复制 `.env.prod.example` 为 `.env.prod` 并填写
3. **使用部署脚本**: 运行 `scripts/deploy-production.sh`

## 📋 部署方式

### 方式一：使用部署脚本（推荐）

```bash
# 一键部署
./scripts/deploy-production.sh deploy

# 其他命令
./scripts/deploy-production.sh build    # 仅构建
./scripts/deploy-production.sh start    # 仅启动
./scripts/deploy-production.sh logs     # 查看日志
./scripts/deploy-production.sh status   # 查看状态
```

### 方式二：手动部署

```bash
# 1. 配置环境变量
cp .env.prod.example .env.prod
vi .env.prod

# 2. 构建镜像
docker build -f Dockerfile.api -t feedbackhub-api:v1-latest .
docker build -f Dockerfile.admin -t feedbackhub-admin:v1-latest .

# 3. 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 🔧 配置文件说明

### Docker Compose 文件

- **docker-compose.local.yml**: 本地开发环境配置
- **docker-compose.prod.yml**: 生产环境配置
- **docker-compose.dev.yml**: 开发环境配置

### Dockerfile

- **Dockerfile.api**: API 服务 Dockerfile
- **Dockerfile.admin**: Admin 前端 Dockerfile
- **Dockerfile.api.simple**: 简化版 API Dockerfile

### 环境变量

- **.env.prod.example**: 生产环境变量模板
- **1panel.env**: 1Panel 部署环境变量（需要手动创建）

## 📚 相关文档

- [生产环境部署指南](./production.md) - 详细的生产环境部署文档
- [CLAUDE.md](../../CLAUDE.md) - 项目架构和开发规范
- [package.json](../../package.json) - 项目依赖和脚本

## 🛠️ 脚本说明

### deploy-production.sh

生产环境快速部署脚本，提供以下功能：

- 环境检查
- 镜像构建
- 服务启动
- 健康检查
- 日志查看

### clear-database.sh

数据库清理脚本，用于开发/测试环境。

## 🔍 常见问题

### 1. 部署失败

检查：
- Docker 是否正常运行
- 环境变量是否正确配置
- 数据库是否可访问
- 端口是否被占用

### 2. 数据库迁移失败

参考 [production.md](./production.md) 中的故障排查章节。

### 3. 服务无法启动

查看日志：
```bash
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f admin
```

## 📞 获取帮助

- 查看详细文档: [production.md](./production.md)
- 查看项目根目录: [README.md](../../README.md)
- 提交问题: GitHub Issues

## 🔄 更新日志

- **2025-03-09**: 根据本地部署成功经验优化生产环境配置
  - 更新 docker-compose.prod.yml，增加健康检查和资源限制
  - 创建环境变量模板 .env.prod.example
  - 创建快速部署脚本 deploy-production.sh
  - 编写详细的生产环境部署文档
