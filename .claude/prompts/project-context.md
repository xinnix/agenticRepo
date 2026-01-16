# OpenCode Stack - Project Context

## Overview
This is a full-stack monorepo built with **NestJS**, **React**, **tRPC**, and **Prisma**.

## Tech Stack
- **Backend:** NestJS 11 + tRPC 11 + Prisma 7 + PostgreSQL
- **Frontend:** React 19 + Refine 5 + Arco Design + Vite 7
- **Monorepo:** pnpm workspaces
- **Language:** TypeScript 5.9

## Directory Structure
```
opencode-stack/
├── apps/
│   ├── api/          # NestJS backend (port 3000)
│   ├── admin/        # React admin dashboard (Refine)
│   └── mobile/       # (placeholder)
├── packages/
│   ├── database/     # Prisma schema & client
│   └── shared/       # Zod schemas & shared types
└── .claude/          # MCP configuration
```

## Key Conventions
- **Resource Naming:** Refine resource names must match tRPC router keys exactly
- **Priority Field:** 1=low, 2=medium, 3=high
- **Database URL:** From `packages/database/.env` (gitignored)
- **Type Safety:** `AppRouter` exported from `@opencode/shared`

## Common Workflows
1. **Schema Changes:** Edit schema → migrate → generate
2. **Add tRPC Procedure:** Define schema → create router → merge → export type
3. **Add Refine Resource:** Add procedures → add resource → create page → implement data provider

## Claude MCP Skills Available
- `/db:migrate <name>` - Create Prisma migration
- `/db:generate` - Generate Prisma Client
- `/db:studio` - Open Prisma Studio
- `/type-check` - Run type checks
- `/sync` - Sync workspace
- `/dev:api` - Start API server
- `/dev:admin` - Start Admin server
- `/build:all` - Build all packages
