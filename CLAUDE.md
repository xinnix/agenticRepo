# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack monorepo application built with **NestJS**, **React**, **tRPC**, **REST/OpenAPI**, and **Prisma**. The architecture emphasizes end-to-end type safety across the frontend/backend boundary using tRPC for internal development and REST APIs for external integrations.

**Tech Stack:**

- **Backend:** NestJS 11 + tRPC 11 + Swagger/OpenAPI + Prisma 7 + PostgreSQL
- **Frontend:** React 19 + Refine 5 + Arco Design + Vite 7
- **Monorepo:** pnpm workspaces (apps/_ and infra/_ pattern)
- **Language:** TypeScript 5.9

**Dual-Protocol Architecture:**

- **tRPC:** Used by Admin dashboard for end-to-end type safety
- **REST/OpenAPI:** Used by mobile apps, mini-programs, and third-party integrations
- **Shared Zod Schemas:** Validation logic shared across both protocols

## Architecture

### Directory Structure

```
opencode-stack/
├── apps/
│   ├── api/          # NestJS backend with tRPC + REST
│   │   └── src/
│   │       ├── modules/     # Feature modules (Controller + Service + tRPC)
│   │       ├── shared/      # Shared tRPC router, filters, interceptors
│   │       └── main.ts      # Dual-protocol entry point
│   └── admin/        # React admin dashboard (via tRPC)
├── infra/
│   ├── database/     # Prisma schema, migrations, and generated client
│   └── shared/       # Zod schemas and shared TypeScript types
├── scripts/          # Automation scripts (generate-crud, etc.)
└── docs/             # Documentation
```

### Data Flow

**Admin Dashboard (tRPC):**

1. Frontend calls tRPC procedures via type-safe client (`apps/admin/src/utils/trpc.ts`)
2. tRPC router in backend routes requests to handlers (`apps/api/src/trpc/`)
3. Handlers use PrismaService to interact with PostgreSQL database
4. Shared package (`@opencode/shared`) ensures type safety

**External Clients (REST):**

1. Mobile/Third-party calls REST endpoints (`/api/v1/todos`)
2. NestJS Controllers validate request with class-validator
3. Controllers call Services to interact with database
4. Responses are formatted by global interceptor
5. Swagger documentation available at `/api/docs`

**Shared Validation:**

- Zod schemas in `infra/shared/src/` used by both protocols
- tRPC uses Zod directly for runtime validation
- REST Controllers use class-validator DTOs (can be generated from Zod)

### Key Backend Components

**Entry Point:**

- **`apps/api/src/main.ts`** - NestJS entry point, configures tRPC + Swagger, starts server on port 3000

**Core:**

- **`apps/api/src/app.module.ts`** - NestJS module configuration with global filters/interceptors
- **`apps/api/src/prisma.service.ts`** - Prisma client wrapper as NestJS service

**REST API:**

- **`apps/api/src/modules/[resource]/`** - Feature modules (Controller + Service)
- **`apps/api/src/common/`** - Global filters, interceptors, DTOs

**tRPC:**

- **`apps/api/src/trpc/trpc.ts`** - tRPC initialization and context creation
- **`apps/api/src/trpc/app.router.ts`** - Main tRPC router (merge sub-routers here)
- **`apps/api/src/trpc/*.router.ts`** - Feature-specific tRPC procedures

### Key Frontend Components

- **`apps/admin/src/utils/trpc.ts`** - tRPC client (points to `http://localhost:3000/trpc`)
- **`apps/admin/src/utils/dataProvider`** - Custom data provider bridging Refine to tRPC
- **`apps/admin/src/App.tsx`** - Refine provider setup with resources

## Common Commands

### Root (monorepo)

```bash
pnpm install          # Install all workspace dependencies
```

### Backend (apps/api)

```bash
cd apps/api
pnpm dev              # Start development server with hot reload
pnpm build            # Compile TypeScript to dist/
pnpm start            # Run compiled server from dist/main.ts
```

### Frontend (apps/admin)

```bash
cd apps/admin
pnpm dev              # Start Vite dev server
pnpm build            # TypeScript compilation + Vite build
pnpm lint             # Run ESLint
pnpm preview          # Preview production build
```

### Database (infra/database)

```bash
cd infra/database
npx prisma generate   # Generate Prisma client (after schema changes)
npx prisma migrate dev # Create and apply new migration
npx prisma studio     # Open Prisma Studio GUI
```

## 🚀 Agent Skills

This project includes a powerful **Agent Skill** for rapid module generation that creates complete full-stack modules from database schema to frontend management pages.

### Available Skills

#### generate-module

**Location:** `.claude/skills/generate-module/`

**Description:** Rapidly generates full-stack modules with intelligent field analysis, file upload support, and complete CRUD functionality.

**Usage:**

```bash
# Smart analysis (recommended)
node .claude/skills/generate-module/generate-module.ts product

# Custom fields
node .claude/skills/generate-module/generate-module.ts order --fields="customerId:number:required,total:number:required"

# File upload support
node .claude/skills/generate-module/generate-module.ts article --fields="title:string:required,cover:image:optional" --file-upload

# Preview mode
node .claude/skills/generate-module/generate-module.ts todo --dry-run

# Help
node .claude/skills/generate-module/generate-module.ts --help
```

**Features:**

- ✅ Smart field analysis for 10+ business patterns
- ✅ Full-stack code generation (NestJS + tRPC + React + Refine)
- ✅ File upload support (image, file, files)
- ✅ Automatic database schema updates
- ✅ Complete automation (95% automated)

**Generated Output:**

- Backend: Service, Controller, Module, DTO, tRPC Router
- Frontend: List, Create, Edit, Show pages
- Database: Prisma Schema, Zod validation schemas
- Config: Automatic module registration

**Supported Field Types:**

- `string`, `text`, `number`, `float`, `boolean`, `date`
- `enum` with custom values
- `image`, `file`, `files` (with upload support)

**Supported Business Patterns:**

- Content: article, post, blog, news
- Tasks: todo, task, assignment
- E-commerce: product, item, goods, order
- User management: user, customer, member
- And more...

**Documentation:**

- Full documentation: `.claude/skills/generate-module/SKILL.md`
- Quick start: `QUICKSTART.md`
- Examples: `examples/generate-module-example.md`

## Development Workflow

### Quick Start: Using generate-module Skill

For rapid development, use the `generate-module` skill to auto-generate full-stack modules:

```bash
# Smart analysis (recommended - detects business patterns automatically)
node .claude/skills/generate-module/generate-module.ts product

# Custom fields specification
node .claude/skills/generate-module/generate-module.ts order --fields="customerId:number:required,total:number:required"

# With file upload support
node .claude/skills/generate-module/generate-module.ts article --fields="title:string:required,cover:image:optional" --file-upload

# Preview mode (dry run)
node .claude/skills/generate-module/generate-module.ts todo --dry-run

# Help
node .claude/skills/generate-module/generate-module.ts --help
```

**When to use:**

- Creating new CRUD modules from scratch
- Standard business entities (products, orders, users, articles, etc.)
- Modules requiring file upload functionality
- Rapid prototyping and MVP development

**What it generates:**

- Database: Prisma schema with migration
- Backend: tRPC router, service, controller, DTOs
- Frontend: List, Create, Edit, Detail pages
- All CRUD operations with proper naming conventions

### Starting the Application

1. **Set up database:** Ensure `DATABASE_URL` is set in `infra/database/.env`
2. **Run migrations:** `cd infra/database && npx prisma migrate dev`
3. **Generate Prisma client:** `cd infra/database && npx prisma generate`
4. **Start backend:** `cd apps/api && pnpm dev`
   - tRPC: http://localhost:3000/trpc
   - Swagger docs: http://localhost:3000/api/docs
5. **Start frontend:** `cd apps/admin && pnpm dev`

## Important Notes

- **Dual Protocol:** Admin uses tRPC for type safety; REST is for external integrations only
- **Swagger Docs:** Available at `http://localhost:3000/api/docs` when backend is running
- **CORS:** Backend enables CORS for admin frontend (`apps/api/src/main.ts`)
- **Global Error Handling:** All errors are caught by `AllExceptionsFilter` with consistent format
- **Response Format:** All REST responses are wrapped by `TransformInterceptor`
- **Type Safety:** `AppRouter` type is exported from `@opencode/shared` for frontend tRPC client
- **Resource Naming:** Refine resource names must match tRPC router keys exactly
- **Prisma Client:** Generated in `infra/database/generated/` (not node_modules)
- **Environment:** Database URL from `infra/database/.env` (gitignored)
- **Priority Field:** 1=low, 2=medium, 3=high (defined in schema)

## CRUD Naming Convention (IMPORTANT)

This project uses a **unified naming convention** - all operations use the same names:

### tRPC Procedure Names (Generated by createCrudRouter)
- `getMany.query()` - List with pagination
- `getOne.query()` - Get single record
- `create.mutate()` - Create record (NO One suffix)
- `update.mutate()` - Update record (NO One suffix)
- `delete.mutate()` - Delete record (NO One suffix)
- `deleteMany.mutate()` - Delete multiple records

### createCrudRouter Usage
```typescript
createCrudRouter('Product', {
  create: ProductSchema.createInput,   // ← Matches procedure name
  update: ProductSchema.updateInput,   // ← Matches procedure name
  getMany: ProductSchema.getManyInput,
  getOne: ProductSchema.getOneInput,
});
```

### Refine Hooks & dataProvider Mapping
```typescript
// Frontend hooks
useCreate()   → dataProvider.create()
useUpdate()   → dataProvider.update()
useDelete()   → dataProvider.deleteOne()

// dataProvider maps to tRPC procedures
create()    → trpc.product.create.mutate({ data: ... })
update()    → trpc.product.update.mutate({ id, data: ... })
delete()    → trpc.product.delete.mutate({ id })
getOne()    → trpc.product.getOne.query({ id })
getList()   → trpc.product.getMany.query({ page, limit })
```

**Summary:**
- **Unified naming**: All operations use `create`, `update`, `delete`, `getMany`, `getOne`, `deleteMany` (NO `One` suffix)
- createCrudRouter **parameters** match the procedure names exactly
- tRPC **procedures** match the parameter names exactly
- Refine **hooks** match the procedure names exactly
- Resource names must match exactly between Refine and tRPC routers
