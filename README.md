这份方案融合了 **Agent-Centric（智能体中心）**、**Dual-Protocol（双协议驱动）** 和 **Service-Oriented（服务导向）** 的核心思想。它不仅解决了开发效率问题，还兼顾了生态兼容性（小程序/第三方集成）。

---

## 🏗️ 2026 全栈自动驾驶脚手架：完整技术方案

### 1. 核心架构逻辑：单一真理源 (SSOT)

在 Agent 开发模式下，我们将 **Service 层** 设为唯一的业务逻辑执行中心。

- **tRPC (Internal)**: 专供管理端 (Admin)，享受极致的类型推导。
- **REST/OpenAPI (External)**: 供小程序、移动端和第三方调用。
- **Zod (Contract)**: 跨协议共享的校验逻辑与数据结构。

---

## 2. 目录结构：Agent 友好的 Monorepo

```text
.
├── docs/                    # Agent 驾驶手册 (PRD, Conventions, Roadmap)
├── packages/
│   ├── database/            # Prisma Schema & Generated Client
│   └── shared/              # Zod Schemas, DTO Types, API Interfaces
└── apps/
    ├── api/                 # NestJS (REST + tRPC + Swagger)
    │   └── src/
    │       ├── modules/     # 业务模块 (Service + Controller)
    │       ├── trpc/        # tRPC 适配层 (Routers)
    │       ├── common/      # 过滤器、拦截器、全局 DTO
    │       └── main.ts      # 双协议启动入口
    ├── admin/               # React + Refine + Arco (via tRPC)
    └── mobile/              # Uni-app (via REST)

```

---

## 3. 关键层级实现：以 Todo 为例

### 第一步：Shared 包定义（契约）

使用 Zod 定义基础 Schema，它是所有协议的基石。

```typescript
// packages/shared/src/index.ts
export const CreateTodoSchema = z.object({
  title: z.string().min(1, "标题必填"),
  priority: z.number().int().min(1).max(3),
});

export type TodoDTO = { id: string; title: string; isCompleted: boolean };
```

### 第二步：NestJS Service（核心逻辑）

Agent 主要编写此层，不涉及网络协议细节。

```typescript
// apps/api/src/modules/todo/todo.service.ts
@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTodoInput) {
    return this.prisma.todo.create({ data });
  }

  async findAll() {
    const items = await this.prisma.todo.findMany();
    return { data: items, total: items.length };
  }
}
```

### 第三步：双路分发 (Controller & Router)

- **REST (Controller)**: 自动生成 Swagger。
- **tRPC (Router)**: 直接调用 Service，为 Admin 提供零 API 声明的开发体验。

```typescript
// apps/api/src/trpc/routers/todo.router.ts
export const todoRouter = router({
  getMany: publicProcedure.query(({ ctx }) => ctx.todoService.findAll()),
});
```

---

## 4. 基础设施配置

### 4.1 后端启动逻辑 (`main.ts`)

整合双协议与 Swagger。

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 配置 REST API 版本与 Swagger
  app.setGlobalPrefix("api/v1");
  const config = new DocumentBuilder().setTitle("OpenCode API").build();
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(app, config)
  );

  // 2. 注册 tRPC (通过中间件或适配器)
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);

  await app.listen(3000);
}
```

### 4.2 Docker 持续交付 (`docker-compose.yml`)

利用 Docker 实现一键环境初始化。

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: opencode

  api:
    build: .
    command: pnpm --filter @opencode/api dev
    depends_on:
      - postgres

  admin:
    build: .
    command: pnpm --filter @opencode/admin dev
```

---

## 5. Agent 驾驶技能 (Skills & Hooks)

为了让 Agent 真正“动起来”，我们需要在根目录注入自动化脚本。

| 技能名称         | 命令                                  | Agent 何时调用                          |
| ---------------- | ------------------------------------- | --------------------------------------- |
| **`sync:all`**   | `pnpm install && npx prisma generate` | 当你修改了数据库字段后。                |
| **`gen:module`** | `scripts/gen-nest-module.sh`          | 当你想新增一个业务模块（如“订单”）时。  |
| **`check:api`**  | `pnpm --filter @opencode/api test`    | 代码写入后，验证 Service 逻辑是否破坏。 |

---

## 6. 实施路线图：三步走

### 阶段一：建立“工业基础” (Day 1)

1. **Monorepo 初始化**：配置 `pnpm-workspace.yaml`。
2. **Shared & Database**：完成 Prisma 生成路径优化 (`../generated`)。
3. **NestJS 基础层**：编写全局 Filter、Interceptor 和 `PrismaService`。

### 阶段二：打通“双向车道” (Day 2)

1. **集成 Swagger**：确保 `http://localhost:3000/api/docs` 可见。
2. **Refine tRPC Adapter**：在 Admin 端建立基于 tRPC 的 `dataProvider`。
3. **Agent 规范注入**：在 `docs/agent/conventions.md` 中写入“双协议编写守则”。

### 阶段三：自动化与部署 (Day 3)

1. **Dockerization**：编写 `Dockerfile` 实现多阶段构建。
2. **编写 Skill 脚本**：实现一个 `generate-crud` 脚本，让 Agent 可以一键生成从 Prisma 到 Refine 的代码。
