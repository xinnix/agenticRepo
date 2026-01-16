# Agent 开发规范

> 本文档定义了 Claude Code 在此项目中工作时必须遵守的规则和流程。

---

## 核心原则

### 1. Schema-First 开发
**所有开发必须从 Prisma Schema 开始。**

- 数据库是"真理之源"
- 不要在多个地方定义同一个模型
- 任何模型变更必须先修改 `packages/database/prisma/schema.prisma`

### 2. 双协议架构
项目采用 **tRPC + REST 双协议**架构：

| 协议 | 用途 | 目标用户 |
|------|------|----------|
| **tRPC** | 管理端 (Admin) | 内部开发，享受端到端类型安全 |
| **REST/OpenAPI** | 外部集成 | 小程序、移动端、第三方调用 |

- 管理端必须使用 tRPC，禁止绕过 tRPC 直接调用 REST API
- REST API 仅供外部集成使用，文档位于 `http://localhost:3000/api/docs`
- 所有 API 变更必须更新 `packages/shared/src/index.ts` (Zod schemas)

### 3. 遵循现有模式
- REST Controller: 参考 `apps/api/src/modules/todo/`
- tRPC Router: 参考 `apps/api/src/trpc/todo.router.ts`
- 前端页面: 参考 `apps/admin/src/pages/todos/`

---

## 添加新资源的完整流程

当需要添加新资源（如 Member、Order 等）时，按以下顺序执行：

### Step 1: 定义 Prisma Model
**文件：** `packages/database/prisma/schema.prisma`

```prisma
model Member {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Step 2: 运行数据库迁移
```bash
cd packages/database
npx prisma migrate dev --name add_member
```

### Step 3: 生成 Prisma Client
```bash
cd packages/database
npx prisma generate
```

### Step 4: 创建 Zod Schemas
**文件：** `packages/shared/src/index.ts`

```typescript
import { z } from "zod";

export const CreateMemberSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("邮箱格式不正确"),
});

export const UpdateMemberSchema = CreateMemberSchema.partial();
```

### Step 5: 创建 tRPC Router
**文件：** `apps/api/src/trpc/member.router.ts`

```typescript
import { router, publicProcedure } from "./trpc";
import { CreateMemberSchema } from "@opencode/shared";
import { z } from "zod";

export const memberRouter = router({
  getMany: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.member.findMany();
  }),
  getOne: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.member.findUnique({ where: { id: input.id } });
    }),
  create: publicProcedure
    .input(CreateMemberSchema)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.member.create({ data: input });
    }),
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: CreateMemberSchema.partial(),
    }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.member.update({
        where: { id: input.id },
        data: input.data,
      });
    }),
  deleteOne: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.member.delete({ where: { id: input.id } });
    }),
});
```

### Step 6: 合并到主 Router
**文件：** `apps/api/src/trpc/app.router.ts`

```typescript
import { todoRouter } from "./todo.router";
import { memberRouter } from "./member.router";  // 添加这行

export const appRouter = router({
  todo: todoRouter,
  member: memberRouter,  // 添加这行
});

export type AppRouter = typeof appRouter;
```

### Step 7: 创建 REST Controller（可选）
**目录：** `apps/api/src/modules/member/`

如果需要为小程序/移动端提供 REST API，使用 generate-crud 脚本：

```bash
./scripts/generate-crud.sh Member
```

然后手动补充：
1. DTO 类定义（用于 Swagger 文档）
2. 导入 Module 到 `app.module.ts`

**注意：** 管理端不使用 REST API，仅用于外部集成。

### Step 8: 创建前端页面
**目录：** `apps/admin/src/pages/members/`

创建 `list.tsx`、`create.tsx`、`edit.tsx`

参考 `AgentTable.tsx` 组件实现列表页。

### Step 9: 添加 Refine Resource
**文件：** `apps/admin/src/App.tsx`

```typescript
resources={[
  { name: "todo", list: "/todos" },
  { name: "member", list: "/members" },  // 添加这行
]}
```

---

## 代码风格规范

### 样式
- **优先使用 Tailwind CSS 类名**
- **禁止创建独立的 CSS 文件**
- 使用 Arco Design 组件库

### 命名约定
- tRPC router 文件：`[resource].router.ts`
- REST Module 目录：`modules/[resource]/`
- 前端页面目录：`pages/[resource]/`
- Zod Schema：`Create[Resource]Schema`、`Update[Resource]Schema`

### 优先级字段
1 = 低, 2 = 中, 3 = 高

---

## Pre-Commit 检查清单

在提交代码前，必须运行：

```bash
# 类型检查（必须通过）
pnpm type-check

# 或者手动检查各个包
cd packages/shared && pnpm exec tsc --noEmit
cd apps/api && pnpm exec tsc --noEmit
cd apps/admin && pnpm exec tsc --noEmit
```

---

## 常用命令

### 数据库相关
```bash
# 生成 Prisma Client
pnpm db:generate

# 创建并应用迁移
pnpm db:migrate

# 打开 Prisma Studio
pnpm db:studio
```

### 开发服务器
```bash
# 启动后端
pnpm dev:api

# 启动前端
pnpm dev:admin
```

### 同步脚本
```bash
# 同步所有（Prisma 生成 + 共享包编译）
pnpm sync
```

### CRUD 代码生成
```bash
# 生成完整 CRUD 模块（Service + Controller + Module）
./scripts/generate-crud.sh Member
```

### API 文档
```bash
# 访问 Swagger/OpenAPI 文档
open http://localhost:3000/api/docs
```

---

## 禁止事项

1. ❌ 管理端不要使用 fetch/axios 调用 REST API（必须用 tRPC）
2. ❌ 不要在多个文件中重复定义同一个数据模型
3. ❌ 不要跳过 Prisma migration 直接修改数据库
4. ❌ 不要创建独立的 CSS/SCSS 文件
5. ❌ 不要使用任何未在 Arco Design 中的 UI 组件库
6. ❌ 不要为管理端创建 REST Controller（仅用于外部集成）

---

## 故障排查

### 类型错误
如果遇到类型不匹配：
1. 运行 `pnpm sync`
2. 检查 `packages/shared/src/index.ts` 中的导出路径
3. 确保 AppRouter 类型正确导出

### tRPC 连接失败
1. 确认后端运行在 `http://localhost:3000/trpc`
2. 检查 `apps/admin/src/utils/trpc.ts` 中的 URL
3. 确认 CORS 配置正确

### Prisma 错误
1. 确认 DATABASE_URL 已设置
2. 运行 `npx prisma generate`
3. 运行 `npx prisma migrate dev`
