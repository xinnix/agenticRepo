<p align="center">
  <img src="https://github.com/uni-helper/vitesse-uni-app/raw/main/.github/images/preview.png" width="300"/>
</p>

<h2 align="center">
Vitesse for uni-app
</h2>
<p align="center">
  <a href="https://vitesse-uni-app.netlify.app/">📱 在线预览</a>
  <a href="https://uni-helper.js.org/vitesse-uni-app">📖 阅读文档</a>
</p>

## 特性

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite](https://github.com/vitejs/vite), [pnpm](https://pnpm.io/), [esbuild](https://github.com/evanw/esbuild) - 就是快！

- 🔧 [ESM 优先](https://github.com/uni-helper/plugin-uni)

- 🗂 [基于文件的路由](./src/pages)

- 📦 [组件自动化加载](./src/components)

- 📑 [布局系统](./src/layouts)

- 🎨 [UnoCSS](https://github.com/unocss/unocss) - 高性能且极具灵活性的即时原子化 CSS 引擎

- 😃 [各种图标集为你所用](https://github.com/antfu/unocss/tree/main/packages/preset-icons)

- 🔥 使用 [新的 `<script setup>` 语法](https://github.com/vuejs/rfcs/pull/227)

- 📥 [API 自动加载](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 无需引入

- 🦾 [TypeScript](https://www.typescriptlang.org/) & [ESLint](https://eslint.org/) - 保证代码质量

---

# @opencode/miniapp

基于 uni-app 的微信小程序，使用 Vue 3 + TypeScript + Vite 开发。

## 项目集成

本小程序已集成到 agenticRepo monorepo 中，可以与后端 API 共享类型和工具。

## 开发

### 安装依赖

在项目根目录执行：

```bash
pnpm install
```

### 启动开发服务器

```bash
# 仅启动小程序
pnpm dev:miniapp

# 或使用 pnpm filter
pnpm --filter @opencode/miniapp dev
```

### 构建生产版本

```bash
pnpm build:miniapp
```

## 项目结构

```
src/
├── api/           # API 接口
├── components/    # 组件
├── composables/   # 组合式函数
├── config/        # 配置文件
│   └── api.ts     # API 配置
├── layouts/       # 布局
├── pages/         # 页面
├── static/        # 静态资源
├── stores/        # 状态管理
├── utils/         # 工具函数
│   └── http.ts    # HTTP 请求封装
├── App.vue        # 应用入口
└── main.ts        # 主文件
```

## API 配置

API 地址通过环境变量配置：

- 开发环境：`.env.development`
- 生产环境：`.env.production`

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
```

## 使用共享包

小程序可以使用 `@opencode/shared` 包中的类型和工具：

```typescript
import { someUtil } from '@opencode/shared'
import type { User } from '@opencode/shared'
```

## 注意事项

1. 小程序使用 uni-app 框架，需要安装 HBuilderX 或使用 CLI 开发
2. 微信小程序需要在微信公众平台注册并配置 AppID
3. 开发前请在 `manifest.config.ts` 中配置小程序 AppID
