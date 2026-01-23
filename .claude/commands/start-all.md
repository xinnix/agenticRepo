---
description: 同时启动前后端服务
---

同时在后台启动后端和前端服务。

后端:
```bash
cd apps/api && pnpm dev
```

前端:
```bash
cd apps/admin && pnpm dev
```

服务地址：
- 后端 tRPC: http://localhost:3000/trpc
- 后端 Swagger: http://localhost:3000/api/docs
- 前端管理后台: http://localhost:5173
