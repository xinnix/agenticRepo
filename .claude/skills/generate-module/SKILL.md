---
name: generate-module
description: Rapidly generates full-stack modules from database schema to frontend management pages. Supports smart field analysis for 10+ business patterns, file upload capabilities, and complete CRUD functionality.
allowed-tools:
  - Bash(node:*)
  - Bash(cd:*)
  - Bash(mkdir -p:*)
  - Bash(chmod:*)
  - Bash(ln -s:*)
  - Bash(find:*)
---

# Generate Module

## Overview

Generates complete full-stack modules including database schema, backend APIs (NestJS + tRPC + REST), frontend pages (React + Refine), and configuration files. Features intelligent field analysis for common business patterns and supports custom field specifications.

## Features

### Smart Field Analysis
- **10+ business patterns** automatically detected:
  - Content: article, post, blog, news
  - Tasks: todo, task, assignment
  - E-commerce: product, item, goods, order, transaction
  - User management: user, customer, member
  - Organization: category, tag, role, permission
  - File management: file, media, document, image
  - Feedback: comment, review, feedback, message
  - Audit: log, audit, history
  - Settings: setting, config, option

### Full-Stack Code Generation
- **Backend (NestJS)**:
  - Service layer with Prisma integration
  - REST API Controller with Swagger docs
  - NestJS Module configuration
  - DTOs with class-validator
  - tRPC Router with end-to-end type safety

- **Frontend (React + Refine)**:
  - List page (table with pagination)
  - Create page (form with validation)
  - Edit page (form with data prefill)
  - Show page (detail view)
  - Ant Design components

### File Upload Support
- **Field Types**:
  - `image` - Single image upload with preview
  - `file` - Single file upload
  - `files` - Multiple file upload

- **Features**:
  - Drag & drop UI
  - Image preview
  - File validation
  - Progress indicators

## Location

Run from project root directory.

## Instructions

### 1. Smart Analysis (Recommended)
```bash
# Automatic field detection
node .claude/skills/generate-module/generate-module.ts product

# Task management module
node .claude/skills/generate-module/generate-module.ts todo

# User management module
node .claude/skills/generate-module/generate-module.ts user
```

### 2. Custom Fields
```bash
# Specify custom fields
node .claude/skills/generate-module/generate-module.ts order --fields="customerId:number:required,total:number:required,status:enum:pending:paid:shipped:delivered"

# Complex module with relations
node .claude/skills/generate-module/generate-module.ts article --fields="title:string:required,content:text:required,categoryId:number:required:relation:Category,authorId:number:required:relation:User"
```

### 3. File Upload Support
```bash
# Module with image upload
node .claude/skills/generate-module/generate-module.ts article --fields="title:string:required,content:text:required,cover:image:optional,attachments:files:multiple" --file-upload

# Product with images and documents
node .claude/skills/generate-module/generate-module.ts product --fields="name:string:required,price:number:required,images:image:multiple,manual:file:optional"
```

### 4. Preview Mode
```bash
# See what would be generated without creating files
node .claude/skills/generate-module/generate-module.ts todo --dry-run
```

## Field Specification

### Basic Syntax
```
name:type:attribute1:attribute2
```

### Supported Field Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Short text | `name:string:required` |
| `text` | Long text | `description:text:optional` |
| `number` | Integer | `age:number:required` |
| `float` | Decimal number | `price:float:required` |
| `boolean` | True/false | `active:boolean:default:true` |
| `date` | Date/time | `birthday:date:optional` |
| `enum` | Enumerated values | `status:enum:active:inactive:pending` |
| `image` | Single image | `logo:image:required` |
| `file` | Single file | `document:file:optional` |
| `files` | Multiple files | `attachments:files:multiple` |

### Field Attributes

| Attribute | Description | Example |
|----------|-------------|---------|
| `required` | Mandatory field | `name:string:required` |
| `optional` | Optional field | `description:text:optional` |
| `unique` | Unique constraint | `email:string:unique:required` |
| `default:value` | Default value | `status:enum:active:inactive:default:active` |
| `relation:Model` | Foreign key | `userId:number:relation:User` |

## Generated Code Structure

### Backend Files
```
apps/api/src/modules/{module}/
├── {module}.service.ts      # Business logic
├── {module}.controller.ts   # REST API
├── {module}.module.ts       # NestJS module
├── {module}.dto.ts         # Data transfer objects
└── {module}.types.ts       # Type definitions

apps/api/src/trpc/
└── {module}.router.ts      # tRPC router
```

### Frontend Files
```
apps/admin/src/pages/{module}/
├── list.tsx    # List page
├── create.tsx  # Create page
├── edit.tsx    # Edit page
└── show.tsx    # Show page
```

### Database Updates
```
packages/database/prisma/schema.prisma  # Updated with new model
packages/shared/src/index.ts  # Updated with Zod schemas
```

## Output Example

```
🚀 OpenCode Stack - Module Generator

==================================================

🤖 Smart Analysis: "product"
   Pattern: product|item|goods
   Auto-generated fields: 15

📁 Generating module files...
  ✅ Backend files generated
  ✅ Frontend files generated
  ✅ Updated app.module.ts
  ✅ Updated app.router.ts
  ✅ Updated App.tsx

✅ Module generated successfully!

📦 Generated files:
  ✓ apps/api/src/modules/product/product.service.ts
  ✓ apps/api/src/modules/product/product.controller.ts
  ✓ apps/api/src/modules/product/product.module.ts
  ✓ apps/api/src/modules/product/product.dto.ts
  ✓ apps/api/src/trpc/product.router.ts
  ✓ apps/admin/src/pages/product/list.tsx
  ✓ apps/admin/src/pages/product/create.tsx
  ✓ apps/admin/src/pages/product/edit.tsx
  ✓ apps/admin/src/pages/product/show.tsx

🚀 Next steps:
1. cd packages/database && npx prisma migrate dev --name add-product
2. pnpm --filter @opencode/api run dev
3. pnpm --filter @opencode/admin run dev

==================================================
```

## After Generation

1. **Create database migration**:
   ```bash
   cd packages/database
   npx prisma migrate dev --name add-{module_name}
   ```

2. **Restart development servers**:
   ```bash
   pnpm --filter @opencode/api run dev
   pnpm --filter @opencode/admin run dev
   ```

3. **Access admin interface**:
   Open browser to `http://localhost:5173`

## Common Use Cases

### E-commerce Product Module
```bash
node .claude/skills/generate-module/generate-module.ts product --fields="name:string:required,price:number:required,categoryId:number:required:relation:Category,images:image:multiple,description:text:optional"
```

### Blog Article Module
```bash
node .claude/skills/generate-module/generate-module.ts article --fields="title:string:required,content:text:required,cover:image:optional,categoryId:number:relation:Category,tags:files:multiple,status:enum:draft:published:archived"
```

### User Feedback Module
```bash
node .claude/skills/generate-module/generate-module.ts feedback --fields="userId:number:required:relation:User,subject:string:required,message:text:required,rating:number:optional,attachments:files:multiple"
```

## Business Patterns

### Content Management
Automatically includes: title, content, summary, cover, category, tags, status, author, viewCount, publishedAt

### Task Management
Automatically includes: title, description, status, priority, dueDate, assignee, estimatedHours, actualHours

### Product Management
Automatically includes: name, description, price, costPrice, sku, barcode, category, brand, stock, minStock, weight, dimensions, images, status, featured

### User Management
Automatically includes: username, email, password, name, phone, avatar, gender, birthday, role, department, position, status, lastLoginAt, emailVerified

### Order Management
Automatically includes: orderNumber, customer, status, totalAmount, discount, tax, shippingFee, paymentMethod, paymentStatus, shippingAddress, billingAddress, notes, orderedAt

## Options

| Option | Description | Example |
|--------|-------------|---------|
| `--fields <spec>` | Custom field specification | `--fields="name:string:required,age:number"` |
| `--ui <type>` | UI layout type | `--ui=kanban` (table, card, kanban) |
| `--file-upload` | Enable file upload support | `--file-upload` |
| `--dry-run` | Preview without creating files | `--dry-run` |
| `--help` | Show help information | `--help` |

## Notes

- Module names must be lowercase alphanumeric (underscores allowed)
- Smart analysis automatically detects business patterns from module name
- File upload requires `--file-upload` flag to enable preview
- Generated code follows project best practices and coding standards
- All files include TypeScript types for type safety
- Prisma client must be regenerated after schema changes
- Use `--dry-run` to preview before actual generation
- Existing modules will cause conflicts - remove them first or use different name

## Troubleshooting

### Module Already Exists
```bash
Error: Module "product" already exists
```
**Solution**: Remove existing module or choose a different name

### Invalid Field Syntax
```bash
Error: Invalid field syntax
```
**Solution**: Check field format: `name:type:attr1:attr2`

### Prisma Validation Error
```bash
Error: Prisma schema validation failed
```
**Solution**: Check generated schema.prisma for syntax errors

## Help

```bash
node .claude/skills/generate-module/generate-module.ts --help
```
