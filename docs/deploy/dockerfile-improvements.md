# Dockerfile.api 改进说明

## 🎯 改进目标

根据 `pnpm deploy` 官方推荐方案，彻底解决 Monorepo 环境下的模块依赖和镜像体积问题。

## 🔧 关键改进点

### 1. 使用 `pnpm deploy` 解决软链接问题

**问题**：在 Monorepo 中，`@opencode/api` 依赖 `@opencode/shared` 和 `@opencode/database`，这些依赖通过 pnpm workspace 软链接实现。但在 Docker 容器运行时，软链接往往会失效。

**解决方案**：
```dockerfile
# Deployer Stage
RUN pnpm deploy --prod /out
```

这会：
- 将所有 workspace 依赖从软链接转换为物理文件
- 自动剔除 devDependencies
- 生成扁平化的生产环境 node_modules

### 2. 多阶段构建优化

我们使用 5 个构建阶段：

#### Stage 1: Base
- 配置 Node.js 环境
- 启用 pnpm

#### Stage 2: Dependencies
- 仅复制配置文件，利用 Docker 缓存层
- 使用 `--mount=type=cache` 加速依赖安装

#### Stage 3: Builder
- 复制源码
- 生成 Prisma Client（**关键步骤**）
- 编译 shared 包（API 依赖其编译产物）
- 编译 API 项目

#### Stage 4: Deployer
- 使用 `pnpm deploy` 提取生产依赖
- 处理所有 workspace 依赖关系

#### Stage 5: Runner
- 最小化运行镜像
- 只包含运行时必需的文件

### 3. 关键执行顺序

```dockerfile
# 必须先生成 Prisma Client
RUN pnpm --filter @opencode/database prisma generate

# 然后编译 shared（API 依赖它）
RUN pnpm --filter @opencode/shared build

# 最后编译 API
RUN pnpm --filter @opencode/api build
```

## 📋 使用方法

### 本地测试

```bash
# 1. 使用测试脚本
./scripts/test-docker-build.sh

# 2. 手动构建
docker-compose -f docker-compose.local.yml build api

# 3. 运行容器
docker-compose -f docker-compose.local.yml up api
```

### 生产部署

```bash
# 构建生产镜像
docker build -f Dockerfile.api -t xinnix2000/feedbackhub-api:v1 .

# 推送到 Docker Hub
docker push xinnix2000/feedbackhub-api:v1
```

## 🔍 验证清单

构建完成后，检查以下内容：

```bash
# 1. 镜像大小（应该在 300-500MB 之间）
docker images xinnix2000/feedbackhub-api:v1-local

# 2. 检查 node_modules 结构
docker run --rm xinnix2000/feedbackhub-api:v1-local ls node_modules/@opencode/

# 应该看到：
# shared
# database

# 3. 检查编译产物
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la dist/

# 4. 检查 shared 包
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la infra/shared/dist/
```

## ⚠️ 常见问题

### 1. pnpm deploy 失败

**原因**：package.json 配置不正确

**解决**：确保 workspace 依赖使用 `workspace:*` 协议

```json
{
  "dependencies": {
    "@opencode/shared": "workspace:*",
    "@opencode/database": "workspace:*"
  }
}
```

### 2. 找不到 Prisma Client

**原因**：没有在构建前运行 `prisma generate`

**解决**：确保在编译前执行：
```dockerfile
RUN pnpm --filter @opencode/database prisma generate
```

### 3. 运行时找不到 shared 模块

**原因**：shared 包没有编译或路径不正确

**解决**：
- 确保 shared 包有 build 脚本
- 确保 API 能找到 `infra/shared/dist` 路径

## 📊 预期效果

- **镜像大小**：从 1GB+ 减少到 300-500MB
- **构建速度**：利用 Docker 缓存，二次构建速度提升 50%+
- **运行稳定性**：彻底解决软链接导致的模块找不到问题
- **依赖完整性**：确保所有 workspace 依赖正确打包

## 🚀 下一步

运行测试脚本验证改进：

```bash
./scripts/test-docker-build.sh
```

如果遇到问题，请检查：
1. 1panel.env 中的数据库连接配置
2. Prisma schema 路径是否正确
3. shared 包是否成功编译
