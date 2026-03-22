---
description: 启动小程序开发服务（uni-app）
---

启动小程序开发服务器。

微信小程序:
```bash
cd apps/miniapp && pnpm dev:mp-weixin
```

H5:
```bash
cd apps/miniapp && pnpm dev
```

服务说明：
- 微信小程序: 需要在微信开发者工具中打开 `dist/dev/mp-weixin` 目录
- H5: 自动在浏览器中打开 http://localhost:5173