# 🔴 API 启动问题报告

## 问题现象

API 容器在启动时遇到两个主要错误：

### 1. **数据库迁移失败**
```
Error: The datasource.url property is required in your Prisma config file when using prisma migrate deploy.
```

### 2. **核心依赖缺失**
```
Error: Cannot find module 'dotenv'
Require stack:
- /app/dist/main.js
```

## 📊 问题分析

### 根本原因：`pnpm deploy` 输出结构不正确

通过检查容器内部结构，发现了以下问题：

1. **根目录缺少 package.json**
   - 容器根目录 `/app/` 没有 package.json
   - 只有 `./infra/database/package.json` 存在

2. **依赖结构异常**
   - `node_modules/.pnpm/` 包含了大量依赖包
   - 但是顶层缺少关键依赖如 `dotenv`、`@nestjs/common` 等
   - 所有依赖都是软链接指向 `.pnpm` 目录

3. **`pnpm deploy` 使用不当**
   - 当前配置期望 `pnpm deploy` 输出完整的独立包结构
   - 但实际上 `pnpm deploy` 需要特定的配置才能正常工作

## 🛠️ 技术分析

### 当前 Dockerfile 的问题点：

```dockerfile
# Deployer Stage
COPY --from=builder /app/apps/api/package.json ./package.json
# ... 复制其他文件 ...
RUN pnpm deploy --prod /out
```

**问题**：
- `pnpm deploy` 需要在完整的 workspace 环境中运行
- 它期望找到 `pnpm-workspace.yaml` 和正确的依赖关系
- 复制过来的 package.json 没有完整的 workspace 上下文

### `pnpm deploy` 的正确用法：

根据 pnpm 文档，`pnpm deploy` 的设计目的是：
> "Create a deployment package for a package that can be published to a registry or deployed to a server."

它**不是**用来提取 monorepo 子包及其依赖的工具，而是用来创建可发布包的。

## 🎯 问题总结

| 问题 | 根本原因 | 影响 |
|------|----------|------|
| 缺少 dotenv | `pnpm deploy` 没有正确提取生产依赖 | 应用无法启动 |
| Prisma URL 缺失 | 没有环境变量配置 | 数据库迁移失败 |
| 模块找不到 | 依赖结构不完整 | 运行时错误 |

## 🤔 讨论点

### 方案 A：修复 `pnpm deploy` 方案

**优点**：
- 如果成功，可以得到最小的镜像体积
- 依赖结构清晰

**缺点**：
- `pnpm deploy` 对 monorepo 支持有限
- 需要复杂的配置

### 方案 B：回归传统方案

**优点**：
- 简单直接，稳定可靠
- 对 monorepo 支持好

**缺点**：
- 镜像体积稍大
- 需要手动处理依赖拷贝

### 方案 C：混合方案

保留依赖安装阶段，但不使用 `pnpm deploy`：
1. 在 builder 阶段完成所有编译
2. 只复制需要的 node_modules 部分
3. 使用物理拷贝替代软链接

## 📋 建议下一步

1. 先回归到稳定可靠的方案
2. 确保功能正常工作
3. 再优化镜像体积

你倾向于哪个方案？我们可以一起讨论和实现。
