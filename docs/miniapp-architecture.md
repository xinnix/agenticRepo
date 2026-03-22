# 小程序技术文档

## 概述

本小程序基于 **uni-app** 框架开发，采用 Vue 3 + TypeScript + Vite 技术栈，已完整集成到 agenticRepo monorepo 架构中。

## 技术栈

### 核心框架
- **uni-app**: `3.0.0-4080720251210001` - 跨平台应用开发框架
- **Vue**: `3.4.21` - 渐进式 JavaScript 框架
- **Vite**: `^5.2.8` - 下一代前端构建工具
- **TypeScript**: `~5.8.3` - JavaScript 的超集

### 开发工具
- **@uni-helper/unh**: `^0.2.3` - uni-app 增强工具
- **@uni-helper/vite-plugin-uni-pages**: `^0.3.19` - 基于文件的路由
- **@uni-helper/vite-plugin-uni-components**: `^0.2.3` - 组件自动化加载
- **UnoCSS**: `66.0.0` - 即时原子化 CSS 引擎

### 多平台支持
支持构建到以下平台:
- H5
- 微信小程序
- 支付小程序
- 百度小程序
- 字节跳动小程序
- QQ 小程序
- 京东小程序
- 快手小程序
- 飞书小程序
- 小红书小程序
- 快应用

## 项目结构

```
apps/miniapp/
├── src/
│   ├── api/              # API 接口层
│   │   ├── index.ts      # API 统一导出
│   │   └── todo.ts       # Todo API 示例
│   ├── components/       # 公共组件
│   ├── composables/      # 组合式函数
│   ├── config/           # 配置文件
│   │   └── api.ts        # API 配置和端点定义
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── index.vue     # 首页
│   │   └── todo.vue      # Todo 示例页面
│   ├── static/           # 静态资源
│   ├── stores/           # 状态管理
│   ├── utils/            # 工具函数
│   │   └── http.ts       # HTTP 请求封装
│   ├── App.vue           # 应用入口组件
│   └── main.ts           # 应用入口文件
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
└── vite.config.ts        # Vite 配置
```

## 架构设计

### 1. HTTP 请求封装

基于 `uni.request` 封装统一的 HTTP 客户端 (`src/utils/http.ts`):

**核心特性:**
- ✅ 统一的请求/响应处理
- ✅ 自动添加认证 Token (Bearer Auth)
- ✅ 统一错误处理和提示
- ✅ 支持 GET/POST/PUT/DELETE 方法
- ✅ TypeScript 类型安全

**使用示例:**
```typescript
import { http } from '@/utils/http'

// GET 请求
const res = await http.get<Todo[]>('/todo')

// POST 请求
const res = await http.post<Todo>('/todo', { title: 'New Todo' })

// PUT 请求
const res = await http.put<Todo>('/todo/1', { title: 'Updated' })

// DELETE 请求
const res = await http.delete('/todo/1')
```

### 2. API 规范

**统一响应格式:**
```typescript
interface Response<T = unknown> {
  success: boolean
  data: T
  message?: string
}
```

**API 端点管理 (`src/config/api.ts`):**
```typescript
export const API_ENDPOINTS = {
  // 用户相关
  login: '/auth/login',
  logout: '/auth/logout',
  register: '/auth/register',
  profile: '/user/me',

  // TODO 相关
  todos: '/todo',
  todoDetail: (id: string) => `/todo/${id}`,
} as const
```

### 3. API 模块化

每个业务模块独立管理 API (`src/api/*.ts`):

**示例 - Todo API:**
```typescript
// src/api/todo.ts
import { http } from '@/utils/http'
import { API_ENDPOINTS } from '@/config/api'

export interface Todo {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  priority: number
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export const todoApi = {
  getList: () => http.get<Todo[]>(API_ENDPOINTS.todos),
  getDetail: (id: string) => http.get<Todo>(API_ENDPOINTS.todoDetail(id)),
  create: (data: CreateTodoParams) => http.post<Todo>(API_ENDPOINTS.todos, data),
  update: (id: string, data: UpdateTodoParams) => http.put<Todo>(API_ENDPOINTS.todoDetail(id), data),
  delete: (id: string) => http.delete(API_ENDPOINTS.todoDetail(id)),
}
```

### 4. 认证机制

**登录流程:**
```typescript
// 1. 调用登录 API
const res = await http.post('/auth/login', { email, password })

// 2. 存储 Token
uni.setStorageSync('token', res.data.accessToken)
uni.setStorageSync('refreshToken', res.data.refreshToken)
uni.setStorageSync('userInfo', res.data.user)

// 3. 自动添加到请求头
// HTTP 工具会自动在请求头添加: Authorization: `Bearer ${token}`
```

**退出登录:**
```typescript
uni.removeStorageSync('token')
uni.removeStorageSync('refreshToken')
uni.removeStorageSync('userInfo')
```

### 5. Monorepo 集成

小程序可以使用 `@opencode/shared` 包中的类型和工具:

```typescript
// 使用共享类型
import type { User } from '@opencode/shared'

// 使用共享工具
import { someUtil } from '@opencode/shared'
```

**package.json 配置:**
```json
{
  "dependencies": {
    "@opencode/shared": "workspace:*"
  }
}
```

## 开发指南

### 环境配置

**环境变量 (`.env.development`):**
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

**环境变量 (`.env.production`):**
```bash
VITE_API_BASE_URL=https://api.example.com/api
```

### 开发命令

```bash
# 安装依赖 (在项目根目录)
pnpm install

# 启动 H5 开发
pnpm dev:miniapp

# 启动微信小程序开发
pnpm --filter @opencode/miniapp dev:mp-weixin

# 构建生产版本 (H5)
pnpm build:miniapp

# 构建微信小程序
pnpm --filter @opencode/miniapp build:mp-weixin

# 类型检查
pnpm --filter @opencode/miniapp type-check
```

### 新增 API 模块流程

#### 1. 定义端点

在 `src/config/api.ts` 中添加:
```typescript
export const API_ENDPOINTS = {
  // ... 其他端点
  articles: '/article',
  articleDetail: (id: string) => `/article/${id}`,
}
```

#### 2. 创建 API 文件

创建 `src/api/article.ts`:
```typescript
import { http } from '@/utils/http'
import { API_ENDPOINTS } from '@/config/api'

export interface Article {
  id: string
  title: string
  content: string
  createdAt: string
}

export const articleApi = {
  getList: () => http.get<Article[]>(API_ENDPOINTS.articles),
  getDetail: (id: string) => http.get<Article>(API_ENDPOINTS.articleDetail(id)),
  create: (data: { title: string; content: string }) =>
    http.post<Article>(API_ENDPOINTS.articles, data),
}
```

#### 3. 页面中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { articleApi, type Article } from '@/api/article'

const articles = ref<Article[]>([])

const loadArticles = async () => {
  try {
    const res = await articleApi.getList()
    articles.value = res.data || []
  } catch (error) {
    console.error('加载失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  loadArticles()
})
</script>
```

## 示例功能

### Todo List

完整展示了 CRUD 操作的最佳实践:

**页面**: `src/pages/todo.vue`
**API**: `src/api/todo.ts`

**功能清单:**
- ✅ 获取 Todo 列表
- ✅ 创建新 Todo
- ✅ 编辑 Todo
- ✅ 删除 Todo
- ✅ 切换完成状态
- ✅ 优先级管理
- ✅ 加载状态
- ✅ 错误处理

**访问方式:** 首页点击 "Todo List" 卡片

### 用户登录

集成完整的认证流程:

**功能:**
- ✅ 测试账号快速登录
- ✅ Token 本地存储
- ✅ 登录状态检查
- ✅ 退出登录

**测试账号:**
- 普通用户: `user@example.com` / `password123`
- 普通用户2: `user2@example.com` / `password123`

## 最佳实践

### 1. 类型安全
- ✅ 始终定义 TypeScript 接口
- ✅ API 响应数据使用泛型
- ✅ 避免使用 `any` 类型

### 2. 错误处理
```typescript
try {
  const res = await todoApi.getList()
  // 处理成功
} catch (error) {
  console.error('操作失败:', error)
  uni.showToast({ title: '操作失败', icon: 'none' })
}
```

### 3. 加载状态
```vue
<script setup lang="ts">
const loading = ref(false)

const loadData = async () => {
  try {
    loading.value = true
    // 加载数据
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view v-if="loading">加载中...</view>
  <view v-else>内容</view>
</template>
```

### 4. 数据缓存
```typescript
// 存储
uni.setStorageSync('key', value)

// 读取
const value = uni.getStorageSync('key')

// 删除
uni.removeStorageSync('key')
```

### 5. 代码组织
- 按功能模块组织文件
- API、类型、组件分离
- 复用逻辑抽取为 composables

## 部署配置

### 微信小程序配置

1. 在 `manifest.config.ts` 中配置 AppID:
```typescript
export default {
  'mp-weixin': {
    appid: '你的小程序AppID',
  },
}
```

2. 在微信公众平台配置服务器域名

### 生产环境构建

```bash
# 构建微信小程序
pnpm --filter @opencode/miniapp build:mp-weixin

# 构建产物在 dist/build/mp-weixin/
# 使用微信开发者工具上传代码
```

## 注意事项

1. **平台差异**: 不同小程序平台 API 可能有差异，使用条件编译处理
2. **域名配置**: 生产环境需在小程序管理后台配置合法域名
3. **AppID 配置**: 开发前必须在 `manifest.config.ts` 配置小程序 AppID
4. **网络请求**: 必须使用 HTTPS 协议
5. **存储限制**: 小程序本地存储有大小限制 (通常 10MB)

## 技术支持

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3 文档](https://cn.vuejs.org/)
- [uni-helper 文档](https://uni-helper.js.org/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)