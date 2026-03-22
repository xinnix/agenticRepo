---
description: 同时启动后端、前端和小程序服务
---

同时在后台启动后端、前端和小程序服务。

后端:
```bash
cd apps/api && pnpm dev
```

前端:
```bash
cd apps/admin && pnpm dev
```

小程序:
```bash
cd apps/miniapp && pnpm dev:mp-weixin
```

服务地址：
- 后端 tRPC: http://localhost:3000/trpc
- 后端 Swagger: http://localhost:3000/api/docs
- 前端管理后台: http://localhost:5173
- 小程序: 在微信开发者工具中打开 `dist/dev/mp-weixin` 目录
