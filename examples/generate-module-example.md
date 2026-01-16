# Generate Module Skill - 使用示例

这个文档展示了如何使用 `generate-module` Skill 来快速创建完整的模块。

## 基础示例

### 1. 创建简单任务模块

```bash
# 使用智能分析（推荐）
/generate-module todo
```

输出：
```
🚀 OpenCode Stack - Module Generator

==================================================

🤖 智能分析模块: "todo"
   匹配业务模式: todo|task|assignment
   自动生成字段: 10个
   字段列表:
   ✓ title (string, required)
   ✓ description (text, optional)
   ✓ status (enum: pending, in_progress, completed, cancelled)
   ✓ priority (enum: 1, 2, 3)
   ✓ dueDate (date, optional)
   ✓ assigneeId (relation: User)
   ...

✅ 模块生成完成！

📦 Generated files:
  ✓ apps/api/src/modules/todo/todo.service.ts
  ✓ apps/api/src/modules/todo/todo.controller.ts
  ✓ apps/api/src/modules/todo/todo.module.ts
  ✓ apps/api/src/modules/todo/todo.dto.ts
  ✓ apps/api/src/trpc/todo.router.ts
  ✓ apps/admin/src/pages/todo/list.tsx
  ✓ apps/admin/src/pages/todo/create.tsx
  ✓ apps/admin/src/pages/todo/edit.tsx
  ✓ apps/admin/src/pages/todo/show.tsx

🚀 下一步:
1. cd packages/database && npx prisma migrate dev --name add-todo
2. pnpm --filter @opencode/api run dev
3. pnpm --filter @opencode/admin run dev
```

### 2. 创建产品模块（带文件上传）

```bash
# 创建带图片上传功能的产品模块
/generate-module product --fields="name:string:required,price:number:required,description:text:optional,categoryId:number:relation:Category,sku:string:unique:required,images:image:multiple,manual:file:optional" --file-upload
```

输出：
```
🚀 OpenCode Stack - Module Generator

==================================================

📎 File Upload Support Preview

The following features will be added:

Backend (NestJS):
  ✓ Multer configuration for file uploads
  ✓ File validation (type, size)
  ✓ Storage service integration
  ✓ API endpoints for file operations

Frontend (React + Refine):
  ✓ Drag & drop file upload UI
  ✓ Image preview for images
  ✓ File list management
  ✓ Upload progress indicator

Database (Prisma):
  ✓ File metadata storage
  ✓ Relation to parent model
  ✓ File type validation

--------------------------------------------------

[==================================================] 100%

✅ Module generated successfully!

📦 Generated files:
  ✓ apps/api/src/modules/product/product.service.ts
  ✓ apps/api/src/modules/product/product.controller.ts
  ✓ apps/api/src/modules/product/product.module.ts
  ✓ apps/api/src/modules/product/product.dto.ts
  ✓ apps/api/src/trpc/product.router.ts
  ✓ apps/api/src/modules/file-upload/file-upload.service.ts
  ✓ apps/api/src/modules/file-upload/file-upload.controller.ts
  ✓ apps/admin/src/pages/product/list.tsx
  ✓ apps/admin/src/pages/product/create.tsx
  ✓ apps/admin/src/pages/product/edit.tsx
  ✓ apps/admin/src/pages/product/show.tsx
  ✓ apps/admin/src/components/FileUpload.tsx

📎 File upload configuration:

1. Configure Multer in apps/api/src/main.ts
2. Set up file storage (local/cloud)
3. Update CORS settings if needed

🚀 下一步:
1. Create database migration:
   cd packages/database && npx prisma migrate dev --name add-product
2. Start the development servers:
   pnpm --filter @opencode/api run dev
   pnpm --filter @opencode/admin run dev
```

### 3. 创建订单模块（自定义字段）

```bash
# 使用自定义字段规范
/generate-module order --fields="orderNumber:string:unique:required,customerId:number:required:relation:Customer,total:number:required,status:enum:pending:paid:shipped:delivered:refunded,items:json:required,shippingAddress:text:required,paymentMethod:string:optional,notes:text:optional"
```

### 4. 预览模式（Dry Run）

```bash
# 查看将要生成的内容，但不实际创建文件
/generate-module article --dry-run
```

## 字段语法详解

### 基本语法

```
name:type:attribute1:attribute2
```

### 支持的字段类型

| 类型 | 描述 | 示例 |
|------|------|------|
| string | 字符串 | `title:string:required` |
| text | 长文本 | `content:text:required` |
| number | 整数 | `age:number:required` |
| float | 浮点数 | `price:float:required` |
| boolean | 布尔值 | `active:boolean:default:true` |
| date | 日期 | `birthday:date:optional` |
| enum | 枚举 | `status:enum:active:inactive:pending` |
| image | 单张图片 | `logo:image:required` |
| file | 单个文件 | `document:file:optional` |
| files | 多个文件 | `attachments:files:multiple` |

### 属性说明

| 属性 | 描述 | 示例 |
|------|------|------|
| required | 必填字段 | `name:string:required` |
| optional | 可选字段 | `description:text:optional` |
| unique | 唯一约束 | `email:string:unique:required` |
| default:value | 默认值 | `status:enum:active:inactive:default:active` |
| relation:Model | 关联模型 | `userId:number:relation:User` |

### 字段规范示例

```bash
# 用户模块
/generate-module user --fields="username:string:unique:required,email:string:unique:required,name:string:required,avatar:image:optional,roleId:number:relation:Role"

# 文章模块
/generate-module article --fields="title:string:required,content:text:required,summary:text:optional,cover:image:optional,categoryId:number:relation:Category,tags:files:multiple,status:enum:draft:published:archived:default:draft"

# 订单模块
/generate-module order --fields="orderNumber:string:unique:required,customerId:number:required:relation:Customer,items:json:required,total:number:required,status:enum:pending:paid:shipped:delivered:cancelled:default:pending"
```

## 高级用法

### 1. 组合使用

```bash
# 结合智能分析和自定义字段
/generate-module product --fields="name:string:required,price:number:required,categoryId:number:relation:Category"
```

### 2. UI类型选择

```bash
# 创建看板视图的模块
/generate-module task --ui=kanban

# 创建卡片视图的模块
/generate-module card --ui=card
```

### 3. 查看帮助

```bash
/generate-module --help
```

## 支持的业务模式

### 内容管理
- **article** - 文章
- **post** - 帖子
- **blog** - 博客
- **news** - 新闻

### 任务管理
- **todo** - 待办事项
- **task** - 任务
- **assignment** - 作业

### 电商
- **product** - 产品
- **item** - 商品
- **goods** - 货物
- **order** - 订单
- **transaction** - 交易

### 用户管理
- **user** - 用户
- **customer** - 客户
- **member** - 会员

### 组织架构
- **category** - 分类
- **tag** - 标签
- **role** - 角色
- **permission** - 权限

### 文件管理
- **file** - 文件
- **media** - 媒体
- **document** - 文档
- **image** - 图片

### 反馈系统
- **comment** - 评论
- **review** - 评价
- **feedback** - 反馈
- **message** - 消息

### 系统管理
- **log** - 日志
- **audit** - 审计
- **history** - 历史
- **setting** - 设置
- **config** - 配置

## 故障排除

### 错误：模块已存在
```
❌ Error:
  Module "product" already exists. Use --force to overwrite.
```

**解决方案：**
- 使用 `--dry-run` 预览
- 手动删除现有模块后再运行

### 错误：模块名称格式无效
```
❌ Error:
  Module name must be lowercase alphanumeric (e.g., "product", "todo_item")
```

**解决方案：**
- 使用小写字母和数字
- 示例：`product`, `todo_item`, `user_profile`

### 错误：字段语法错误
```
❌ Error:
  Invalid field syntax: name:type:attr1:attr2
```

**解决方案：**
- 检查字段语法
- 确保使用正确的类型名称
- 验证属性名称

## 最佳实践

1. **使用智能分析**：优先使用智能分析而非手动字段定义
2. **合理命名**：使用清晰、简洁的模块名称
3. **字段规划**：提前规划好字段类型和属性
4. **版本控制**：在生成前提交当前更改
5. **测试**：生成后先运行测试确保功能正常

## 常见问题

### Q: 如何修改已生成的模块？
A: 手动编辑生成的文件，然后运行迁移

### Q: 如何删除模块？
A: 手动删除生成的文件，运行 `npx prisma migrate dev` 回滚

### Q: 可以生成非CRUD功能吗？
A: 目前只支持CRUD，需要手动扩展

### Q: 如何自定义模板？
A: 修改 `scripts/templates/` 目录下的模板文件
