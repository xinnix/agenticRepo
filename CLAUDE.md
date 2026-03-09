这份 `CLAUDE.md` 是专门为你这套 **NestJS + tRPC + Refine + pnpm Workspace** 架构量身定制的。它既是 Agent 的“操作手册”，也是维持 Monorepo 秩序的“宪法”。

---

# CLAUDE.md - OpenCode Monorepo 架构指南

## 🛠 项目定位 (Vision)

这是一个基于 **Agent-Centric** 开发模式的全栈管理系统脚手架。

- **核心理念**：框架与业务分离。框架逻辑（Base CRUD）保持稳定，业务逻辑（PRD/Feature）动态演进。
- **技术栈**：NestJS (Backend), tRPC (Internal Protocol), Refine (Admin UI), Prisma (ORM), pnpm (Workspace).

---

## 🏗 Monorepo 协作规范

项目分为 `apps/`（独立应用）和 `infra/`（共享基础设施）。

### 1. 依赖引用规则

- **内部依赖**：`apps/*` 引用 `infra/*` 必须使用 `workspace:*` 协议。
- _正确示例_：`"dependencies": { "@opencode/shared": "workspace:*" }`

- **禁止反向引用**：`infra/` 下的包严禁引用 `apps/` 里的任何内容。
- **单一依赖源**：通用工具（如 `lodash`, `dayjs`）应尽可能在根目录安装或在 `infra/shared` 中统一导出。

### 2. 目录职责

- `apps/api`: NestJS 服务端。业务逻辑必须在 `*.service.ts` 中，严禁在 Router/Controller 写逻辑。
- `apps/admin`: Refine 前端。利用 tRPC 的强类型进行数据消费。
- `apps/miniapp`: 小程序 前端。利用 RESTful API 进行数据交互。
- `infra/database`: Prisma Schema 和生成的 Client 所在地。
- `infra/shared`: 全栈通用的 Zod Schema、类型定义和工具函数。

---

## 💻 开发与构建指令

Agent 在执行任务前应优先使用以下命令：

- **安装依赖**: `pnpm install`
- **生成代码**: `pnpm --filter @opencode/database prisma generate`
- **启动开发环境**: `pnpm dev` (启动全量) 或 `pnpm --filter @opencode/api dev` (启动特定)
- **构建生产镜像**: `docker compose -f docker-compose.prod.yml build`
- **同步基建 (外科手术模式)**: `git checkout v1 -- <path>`

---

## ✍️ 编码风格 (Coding Standards)

### 1. 后端 CRUD 模式

必须继承 `BaseService` 以保持一致性：

```typescript
// 必须继承 BaseService 减少冗余代码
export class ProductService extends BaseService<Product> {
  constructor(prisma: PrismaService) {
    super(prisma, "product");
  }
}
```

### 2. 命名规范

- **文件命名**: 小写横杠 `feature-name.service.ts`。
- **变量命名**: TS 使用 `camelCase`，数据库字段使用 `snake_case`。
- **tRPC 路由**: 必须与 `infra/database` 中的模型名称保持对齐。

### 3. 类型流转 (SSOT)

- **真理源**: `schema.prisma` 是唯一的模型真理源。
- **校验源**: `infra/shared` 中的 Zod Schema 是唯一的验证真理源。

---

## 📝 文档与 PRD 流程

Agent 在开始任何 Feature 开发前，**必须**遵循以下步骤：

1. **读取上下文**：先阅读 `docs/product/vision.md` 和对应的 `docs/prd/*.md`。
2. **更新路线图**：任务完成后，更新 `docs/product/roadmap.md` 的进度。
3. **部署审计**：如果新增了环境变量或外部服务，必须更新 `docker-compose.prod.yml` 和 `.env.example`。

---

## 🤖 Agent 专用 Skills (Slash Commands)

- `/gen-crud <model>`: 调用 `.claude/templates` 生成完整的 Service/Router/UI 链路。
- `/check-deps`: 检查 Monorepo 依赖是否出现重复安装或版本冲突。
- `/deploy-audit`: 扫描 `Dockerfile` 确保符合 `pnpm deploy` 瘦身规范。
