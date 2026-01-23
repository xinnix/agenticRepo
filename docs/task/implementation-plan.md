# 后勤反馈系统 - 详细实现计划

**版本：** V1.0
**状态：** 待实施
**创建时间：** 2025-01-20

---

## 一、项目概述

本计划基于 PRD 文档和现有项目架构，设计后勤反馈系统的完整实施方案。

### 1.1 核心需求

| 需求 | 实现方案 |
|------|----------|
| 反馈管理 | Ticket 模块，状态机流转 |
| 任务指派 | 分配机制，处理人管理 |
| 附件上传 | Attachment 模块 + 云存储 |
| 数据统计 | Statistics 模块 |
| 通知系统 | Notification 模块 + 微信订阅消息 |
| 评价闭环 | rating + feedback 字段 |
| 超时预警 | Deadline 计算服务 |

---

## 二、数据模型设计

### 2.1 新增 Prisma Models

```prisma
// ============================================
// 反馈/工单核心模型
// ============================================

model Ticket {
  id                String        @id @default(cuid())
  ticketNumber      String        @unique  // YYYYMMDD + 4位自增

  // 基本信息
  title             String
  description       String        @db.Text
  status            TicketStatus  @default(WAIT_ASSIGN)
  priority          Priority      @default(NORMAL)

  // 分类信息
  categoryId        String
  category          Category      @relation(fields: [categoryId], references: [id])

  // 位置信息
  locationType      LocationType  @default(MANUAL)
  location          String?       // JSON格式
  presetAreaId      String?

  // 用户关联
  createdById       String
  createdBy         User          @relation("TicketCreatedBy", fields: [createdById], references: [id])

  assignedId        String?
  assignedTo        User?         @relation("TicketAssignedTo", fields: [assignedId], references: [id])

  // 时间限制
  deadlineAt        DateTime?
  completedAt       DateTime?
  closedAt          DateTime?

  // 评价信息
  rating            Int?          // 1-5星
  feedback          String?       @db.Text

  // 超时标记
  isOverdue         Boolean       @default(false)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // 关联关系
  attachments       Attachment[]
  comments          Comment[]
  statusHistory     StatusHistory[]
  notifications     Notification[]

  @@index([status])
  @@index([categoryId])
  @@index([createdById])
  @@index([assignedId])
  @@index([ticketNumber])
  @@map("tickets")
}

enum TicketStatus {
  WAIT_ASSIGN    // 待指派
  WAIT_ACCEPT    // 待接单
  PROCESSING     // 处理中
  COMPLETED      // 待评价
  CLOSED         // 已关闭
}

enum Priority {
  NORMAL         // 普通
  URGENT         // 紧急
}

enum LocationType {
  MANUAL         // 手动输入
  PRESET         // 预设区域
}

// ============================================
// 附件模型
// ============================================

model Attachment {
  id              String          @id @default(cuid())
  type            AttachmentType  // IMAGE, VIDEO
  url             String
  fileName        String
  fileSize        Int
  mimeType        String

  ticketId        String
  ticket          Ticket          @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  uploadedById    String
  uploadedBy      User            @relation(fields: [uploadedById], references: [id])

  createdAt       DateTime        @default(now())

  @@index([ticketId])
  @@map("attachments")
}

enum AttachmentType {
  IMAGE
  VIDEO
}

// ============================================
// 评论/沟通记录
// ============================================

model Comment {
  id              String      @id @default(cuid())
  content         String      @db.Text

  ticketId        String
  ticket          Ticket      @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  userId          String
  user            User        @relation(fields: [userId], references: [id])

  commentType     CommentType @default(USER)

  createdAt       DateTime    @default(now())

  @@index([ticketId])
  @@map("comments")
}

enum CommentType {
  USER
  HANDLER
  SYSTEM
}

// ============================================
// 状态流转历史
// ============================================

model StatusHistory {
  id              String      @id @default(cuid())

  ticketId        String
  ticket          Ticket      @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  fromStatus      TicketStatus?
  toStatus        TicketStatus

  userId          String
  user            User        @relation(fields: [userId], references: [id])

  remark          String?     @db.Text

  createdAt       DateTime    @default(now())

  @@index([ticketId])
  @@map("status_history")
}

// ============================================
// 预设区域
// ============================================

model PresetArea {
  id              String      @id @default(cuid())
  name            String
  code            String      @unique

  parentId        String?
  parent          PresetArea? @relation("AreaHierarchy", fields: [parentId], references: [id])
  children        PresetArea[] @relation("AreaHierarchy")

  sortOrder       Int?
  isActive        Boolean     @default(true)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@map("preset_areas")
}

// ============================================
// 通知记录
// ============================================

model Notification {
  id              String          @id @default(cuid())
  type            NotificationType

  ticketId        String
  ticket          Ticket          @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  userId          String
  user            User            @relation(fields: [userId], references: [id])

  title           String
  content         String          @db.Text

  wxMsgId         String?
  wxTemplateId    String?

  isRead          Boolean         @default(false)
  readAt          DateTime?

  sentAt          DateTime        @default(now())

  @@index([userId])
  @@index([ticketId])
  @@map("notifications")
}

enum NotificationType {
  TICKET_ASSIGNED
  TICKET_ACCEPTED
  TICKET_COMPLETED
  TICKET_OVERDUE
  TICKET_COMMENT
  TICKET_RATED
}

// ============================================
// 部门模型
// ============================================

model Department {
  id          String      @id @default(cuid())
  name        String
  code        String      @unique
  parentId    String?
  parent      Department? @relation("DeptHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DeptHierarchy")

  users       User[]

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@map("departments")
}
```

### 2.2 扩展现有模型

```prisma
// Category 扩展
model Category {
  // ... 现有字段 ...

  // 新增字段
  level     Int        @default(1)  // 1=一级分类, 2=二级分类
  assignType AssignType @default(MANUAL)

  // 新增关联
  tickets   Ticket[]

  @@index([level])
}

enum AssignType {
  MANUAL
  AUTO
}

// User 扩展
model User {
  // ... 现有字段 ...

  // 新增字段
  phone         String?     @unique
  wxOpenId      String?     @unique
  wxNickname    String?
  wxAvatarUrl   String?

  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  position      String?

  // 新增关联
  createdTickets    Ticket[]       @relation("TicketCreatedBy")
  assignedTickets   Ticket[]       @relation("TicketAssignedTo")
  uploadedFiles     Attachment[]
  comments          Comment[]
  statusChanges     StatusHistory[]
  notifications     Notification[]
}
```

---

## 三、模块架构设计

### 3.1 新建模块

```
apps/api/src/modules/
├── ticket/                    # 工单管理模块（核心）
│   ├── services/
│   │   ├── ticket.service.ts           # 主服务
│   │   ├── ticket-status.service.ts    # 状态机
│   │   ├── ticket-number.service.ts    # 编号生成
│   │   └── ticket-deadline.service.ts  # 截止时间
│   ├── dto/
│   │   ├── ticket.dto.ts
│   │   └── ticket-filter.dto.ts
│   ├── rest/ticket.controller.ts
│   ├── trpc/ticket.router.ts
│   └── module.ts
│
├── attachment/                # 附件管理模块
│   ├── services/
│   │   ├── attachment.service.ts
│   │   └── upload.service.ts
│   ├── rest/upload.controller.ts
│   ├── trpc/attachment.router.ts
│   └── module.ts
│
├── notification/              # 通知模块
│   ├── services/
│   │   ├── notification.service.ts
│   │   └── wechat.service.ts
│   ├── rest/notification.controller.ts
│   ├── trpc/notification.router.ts
│   └── module.ts
│
├── statistics/                # 数据统计模块
│   ├── services/
│   │   ├── ticket-stats.service.ts
│   │   └── performance-stats.service.ts
│   ├── rest/statistics.controller.ts
│   ├── trpc/statistics.router.ts
│   └── module.ts
│
├── preset-area/               # 预设区域管理
│   ├── services/preset-area.service.ts
│   ├── rest/preset-area.controller.ts
│   ├── trpc/preset-area.router.ts
│   └── module.ts
│
└── department/                # 部门管理
    ├── services/department.service.ts
    ├── rest/department.controller.ts
    ├── trpc/department.router.ts
    └── module.ts
```

### 3.2 共享服务层

```
apps/api/src/shared/services/
├── state-machine.service.ts       # 通用状态机
├── file-storage.service.ts        # 文件存储抽象
└── date-calculator.service.ts     # 日期计算工具
```

---

## 四、核心服务实现要点

### 4.1 状态机流转规则

```typescript
// apps/api/src/shared/services/state-machine.service.ts

export const TICKET_STATE_TRANSITIONS = {
  WAIT_ASSIGN: ['WAIT_ACCEPT', 'CLOSED'],
  WAIT_ACCEPT: ['PROCESSING', 'WAIT_ASSIGN', 'CLOSED'],
  PROCESSING: ['COMPLETED', 'WAIT_ASSIGN', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
};

export const STATE_ACTIONS = {
  WAIT_ASSIGN: { label: '待指派', color: 'orange', nextActions: ['assign', 'close'] },
  WAIT_ACCEPT: { label: '待接单', color: 'blue', nextActions: ['accept', 'reassign', 'close'] },
  PROCESSING: { label: '处理中', color: 'cyan', nextActions: ['complete', 'reassign', 'close'] },
  COMPLETED: { label: '待评价', color: 'lime', nextActions: ['rate', 'close'] },
  CLOSED: { label: '已关闭', color: 'gray', nextActions: [] },
};
```

### 4.2 工单编号生成

```typescript
// apps/api/src/modules/ticket/services/ticket-number.service.ts

async generateNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');

  const latestTicket = await this.prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: datePrefix } },
    orderBy: { ticketNumber: 'desc' },
  });

  let sequence = 1;
  if (latestTicket) {
    sequence = parseInt(latestTicket.ticketNumber.slice(-4)) + 1;
  }

  return `${datePrefix}${sequence.toString().padStart(4, '0')}`;
}
```

### 4.3 截止时间计算

```typescript
// apps/api/src/modules/ticket/services/ticket-deadline.service.ts

async calculateDeadline(priority: 'NORMAL' | 'URGENT'): Promise<Date> {
  const hours = priority === 'URGENT' ? 4 : 24;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}
```

---

## 五、权限系统设计

### 5.1 新增权限定义

```typescript
// infra/shared/src/index.ts

export const PERMISSIONS = {
  TICKET: {
    CREATE: 'ticket:create',
    READ: 'ticket:read',
    READ_ALL: 'ticket:read_all',
    UPDATE: 'ticket:update',
    DELETE: 'ticket:delete',
    ASSIGN: 'ticket:assign',
    ACCEPT: 'ticket:accept',
    PROCESS: 'ticket:process',
    COMPLETE: 'ticket:complete',
    CLOSE: 'ticket:close',
    RATE: 'ticket:rate',
  },
  ATTACHMENT: {
    UPLOAD: 'attachment:upload',
    DELETE: 'attachment:delete',
  },
  STATISTICS: {
    VIEW: 'statistics:view',
    EXPORT: 'statistics:export',
  },
};
```

### 5.2 角色权限配置

```typescript
const ROLES_CONFIG = {
  'normal_user': {
    name: '普通用户',
    permissions: ['ticket:create', 'ticket:read', 'ticket:rate', 'attachment:upload'],
  },
  'handler': {
    name: '处理人（师傅）',
    permissions: ['ticket:read', 'ticket:accept', 'ticket:process', 'ticket:complete'],
  },
  'dept_admin': {
    name: '部门管理员',
    permissions: ['ticket:read_all', 'ticket:assign', 'ticket:close', 'statistics:view'],
  },
  'super_admin': {
    name: '超级管理员',
    permissions: ['*'],
  },
};
```

---

## 六、文件上传方案

### 6.1 存储策略

```typescript
// apps/api/src/shared/services/file-storage.service.ts

// 支持多种存储后端
interface IFileStorage {
  upload(file: Express.Multer.File, path: string): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
}

// 实现：
// - LocalStorageStrategy (本地开发)
// - AliyunOssStrategy (阿里云OSS)
// - TencentCosStrategy (腾讯云COS)
```

### 6.2 上传限制

- 图片：最多9张，单张≤5MB，支持 JPG/PNG/GIF/WEBP
- 视频：1个，≤50MB，支持 MP4/MPEG/MOV

---

## 七、通知系统设计

### 7.1 通知类型

```typescript
enum NotificationType {
  TICKET_ASSIGNED,   // 工单已指派
  TICKET_ACCEPTED,   // 工单已接单
  TICKET_COMPLETED,  // 工单已完成
  TICKET_OVERDUE,    // 工单超时提醒
  TICKET_COMMENT,    // 新评论通知
  TICKET_RATED,      // 收到评价
}
```

### 7.2 微信订阅消息集成

```typescript
// apps/api/src/modules/notification/services/wechat.service.ts

async sendSubscribeMessage(params: {
  touser: string;        // openid
  templateId: string;
  page?: string;
  data: Record<string, { value: string }>;
}) {
  // 获取 access_token
  // 调用微信订阅消息 API
  // 返回发送结果
}
```

---

## 八、数据统计实现

### 8.1 统计维度

```typescript
// apps/api/src/modules/statistics/services/ticket-stats.service.ts

// 1. 分类统计（占比饼图）
async getCategoryStats(range: DateRange)

// 2. 趋势分析（折线图）
async getTrendStats(range: DateRange, interval: 'day' | 'week' | 'month')

// 3. 人效排名
async getHandlerPerformance(range: DateRange, limit: number)

// 4. 概览统计
async getOverview(range?: DateRange)

// 5. 超时预警
async getOverdueStats()
```

---

## 九、实施计划

### 9.1 实施阶段

```
Phase 1: 基础设施 (2天)
├── 1.1 扩展 Prisma Schema
│   ├── 添加新模型
│   ├── 扩展现有模型
│   └── 运行迁移
│
├── 1.2 共享服务层
│   ├── FileStorageService
│   ├── StateMachineService
│   └── TicketNumberService
│
└── 1.3 权限系统扩展
    ├── 添加新权限定义
    └── 更新角色配置

Phase 2: 核心功能 (3天)
├── 2.1 Ticket 模块
│   ├── TicketService
│   ├── TicketStatusService
│   ├── TicketController
│   └── ticket.router.ts
│
├── 2.2 Category 模块扩展
├── 2.3 User 模块扩展
└── 2.4 Attachment 模块

Phase 3: 通知与统计 (2天)
├── 3.1 Notification 模块
├── 3.2 Statistics 模块
└── 3.3 PresetArea 模块

Phase 4: 前端开发 (4天)
├── 4.1 工单列表页
├── 4.2 工单详情页
├── 4.3 工单创建页
├── 4.4 数据统计面板
└── 4.5 个人中心页

Phase 5: 测试与优化 (2天)
├── 5.1 单元测试
├── 5.2 集成测试
├── 5.3 性能优化
└── 5.4 文档完善
```

### 9.2 关键文件清单

| 文件 | 说明 |
|------|------|
| `infra/database/prisma/schema.prisma` | 数据模型定义 |
| `apps/api/src/modules/ticket/services/ticket-status.service.ts` | 状态机实现 |
| `apps/api/src/modules/ticket/services/ticket.service.ts` | 工单主服务 |
| `apps/api/src/trpc/app.router.ts` | tRPC 路由聚合 |
| `infra/shared/src/index.ts` | Zod Schemas |

---

## 十、环境配置

### 10.1 环境变量

```env
# 文件存储
FILE_STORAGE_PROVIDER=aliyun-oss
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=xxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxx
ALIYUN_OSS_BUCKET=feedback-hub

# 微信小程序
WX_MINI_APP_ID=wx...
WX_MINI_APP_SECRET=xxx
WX_TEMPLATE_ASSIGNED=xxx
WX_TEMPLATE_ACCEPTED=xxx
WX_TEMPLATE_COMPLETED=xxx
WX_TEMPLATE_OVERDUE=xxx

# 截止时间配置
DEADLINE_NORMAL_HOURS=24
DEADLINE_URGENT_HOURS=4
```

---

## 十一、验证方案

### 11.1 功能验证

1. **工单创建流程**
   - 用户创建工单 → 生成编号 → 计算截止时间
   - 上传附件 → 关联工单

2. **状态流转**
   - 待指派 → 待接单（管理员指派）
   - 待接单 → 处理中（处理人接单）
   - 处理中 → 待评价（处理人完成）
   - 待评价 → 已关闭（用户评价/关闭）

3. **通知触发**
   - 每次状态变更自动发送通知
   - 超时预警通知

4. **数据统计**
   - 实时更新统计数据
   - 报表导出

### 11.2 集成测试

```typescript
// 工单完整流程测试
describe('Ticket Workflow', () => {
  it('should complete full ticket lifecycle', async () => {
    // 1. 用户创建工单
    const ticket = await createTicket({
      title: '测试工单',
      priority: 'NORMAL',
    });

    expect(ticket.status).toBe('WAIT_ASSIGN');
    expect(ticket.ticketNumber).toMatch(/^\d{12}$/);

    // 2. 管理员指派
    await assignTicket(ticket.id, handlerId);
    expect(ticket.status).toBe('WAIT_ACCEPT');

    // 3. 处理人接单
    await acceptTicket(ticket.id, handlerId);
    expect(ticket.status).toBe('PROCESSING');

    // 4. 处理人完成
    await completeTicket(ticket.id, handlerId);
    expect(ticket.status).toBe('COMPLETED');

    // 5. 用户评价
    await rateTicket(ticket.id, userId, { rating: 5, feedback: '很好' });
    expect(ticket.status).toBe('CLOSED');
  });
});
```

---

## 附录：数据关系图

```
User (用户)
  ├── createdTickets (1:N) - 创建的工单
  ├── assignedTickets (1:N) - 分配给我的工单
  ├── uploadedFiles (1:N) - 上传的附件
  ├── comments (1:N) - 发表的评论
  ├── statusChanges (1:N) - 状态变更记录
  └── notifications (1:N) - 收到的通知

Category (分类)
  ├── parent (1:1) - 父分类
  ├── children (1:N) - 子分类
  └── tickets (1:N) - 该分类下的工单

Ticket (工单)
  ├── category (N:1) - 所属分类
  ├── createdBy (N:1) - 创建人
  ├── assignedTo (N:1) - 处理人
  ├── attachments (1:N) - 附件列表
  ├── comments (1:N) - 评论列表
  ├── statusHistory (1:N) - 状态历史
  └── notifications (1:N) - 通知记录

PresetArea (预设区域)
  ├── parent (1:1) - 父区域
  └── children (1:N) - 子区域
```

---

**计划版本：** V1.1
**最后更新：** 2025-01-20
**预计总工期：** 13 工作日

---

## 十二、前端实现方案

### 12.1 PC 管理端 (Refine + Arco Design)

```
apps/admin/src/modules/ticket/
├── pages/
│   ├── TicketListPage.tsx          # 工单列表（筛选、搜索、分页）
│   ├── TicketCreatePage.tsx        # 创建工单
│   ├── TicketEditPage.tsx          # 编辑工单
│   ├── TicketDetailPage.tsx        # 工单详情
│   └── TicketStatisticsPage.tsx    # 统计面板
└── components/
    ├── TicketForm.tsx              # 工单表单
    ├── TicketStatusBadge.tsx       # 状态徽章
    ├── TicketTimeline.tsx          # 状态流转时间线
    ├── CommentList.tsx             # 评论列表
    └── AttachmentGallery.tsx       # 附件画廊
```

### 12.2 工单列表页面设计

```typescript
// apps/admin/src/modules/ticket/pages/TicketListPage.tsx

export const TicketListPage: React.FC = () => {
  return (
    <List>
      {/* 筛选器 */}
      <Filter>
        <SelectInput source="status" label="状态" />
        <SelectInput source="priority" label="优先级" />
        <SelectInput source="categoryId" label="分类" />
        <DateInput source="createdAt" label="创建时间" />
        <TextInput source="ticketNumber" label="工单编号" />
      </Filter>

      {/* 数据表格 */}
      <Datagrid rowClick="show">
        <TextField source="ticketNumber" label="工单编号" />
        <TextField source="title" label="标题" />
        <TicketStatusBadge source="status" label="状态" />
        <PriorityBadge source="priority" label="优先级" />
        <TextField source="category.name" label="分类" />
        <TextField source="createdBy.username" label="创建人" />
        <TextField source="assignedTo.username" label="处理人" label="处理人" />
        <DateField source="deadlineAt" label="截止时间" showTime />
        <OverdueWarningField source="isOverdue" label="超时预警" />
        <EditButton />
        <ShowButton />
      </Datagrid>
    </List>
  );
};
```

### 12.3 工单详情页面设计

```typescript
// apps/admin/src/modules/ticket/pages/TicketDetailPage.tsx

export const TicketDetailPage: React.FC = () => {
  return (
    <Show>
      {/* 基本信息 */}
      <SimpleShowLayout>
        <TextField source="ticketNumber" label="工单编号" />
        <TextField source="title" label="标题" />
        <TextField source="description" label="描述" />
        <TicketStatusBadge source="status" label="状态" />
        <PriorityBadge source="priority" label="优先级" />
        <TextField source="category.name" label="分类" />
        <LocationField source="location" label="位置" />
        <DateField source="createdAt" label="创建时间" showTime />
        <DateField source="deadlineAt" label="截止时间" showTime />
      </SimpleShowLayout>

      {/* 处理人信息 */}
      <ReferenceField source="assignedId" reference="users" label="处理人">
        <TextField source="username" />
      </ReferenceField>

      {/* 附件画廊 */}
      <AttachmentGallery />

      {/* 状态流转时间线 */}
      <TicketTimeline />

      {/* 评论列表 */}
      <CommentList />

      {/* 操作按钮 */}
      <TicketActions />
    </Show>
  );
};
```

### 12.4 统计面板设计

```typescript
// apps/admin/src/modules/ticket/pages/TicketStatisticsPage.tsx

export const TicketStatisticsPage: React.FC = () => {
  const { data: overview } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => trpc.statistics.overview.query(),
  });

  const { data: categoryStats } = useQuery({
    queryKey: ['statistics', 'category'],
    queryFn: () => trpc.statistics.category.query(),
  });

  return (
    <div className="statistics-dashboard">
      {/* 概览卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <StatCard title="总工单数" value={overview?.total} />
        </Col>
        <Col span={6}>
          <StatCard title="待处理" value={overview?.byStatus.WAIT_ASSIGN} />
        </Col>
        <Col span={6}>
          <StatCard title="处理中" value={overview?.byStatus.PROCESSING} />
        </Col>
        <Col span={6}>
          <StatCard title="已超时" value={overview?.overdueCount} alert />
        </Col>
      </Row>

      {/* 分类占比饼图 */}
      <Card title="分类统计">
        <PieChart data={categoryStats} />
      </Card>

      {/* 趋势折线图 */}
      <Card title="工单趋势">
        <LineChart data={trendStats} />
      </Card>

      {/* 人效排名 */}
      <Card title="处理人排名">
        <Table dataSource={performanceStats} columns={columns} />
      </Card>
    </div>
  );
};
```

---

## 十三、小程序端实现方案（uniapp）

### 13.1 uniapp 项目结构

```
apps/miniprogram/
├── pages/
│   ├── index/                   # 首页（快捷入口）
│   │   └── index.vue
│   ├── ticket-list/             # 工单列表
│   │   └── list.vue
│   ├── ticket-create/           # 创建工单
│   │   └── create.vue
│   ├── ticket-detail/           # 工单详情
│   │   └── detail.vue
│   ├── my-tickets/              # 我的工单
│   │   └── my-tickets.vue
│   └── profile/                 # 个人中心
│       └── profile.vue
├── components/
│   ├── ticket-card/             # 工单卡片
│   │   └── ticket-card.vue
│   ├── status-badge/            # 状态徽章
│   │   └── status-badge.vue
│   ├── image-uploader/          # 图片上传器
│   │   └── image-uploader.vue
│   └── timeline/                # 时间线
│       └── timeline.vue
├── utils/
│   ├── api.ts                   # API 请求封装
│   ├── auth.ts                  # 微信登录
│   └── notification.ts          # 订阅消息
├── stores/
│   └── user.ts                  # 用户状态管理（Pinia）
├── static/                      # 静态资源
├── uni_modules/                 # uniapp 插件
├── App.vue                      # 应用入口
├── main.ts                      # 主入口
├── manifest.json                # 应用配置
├── pages.json                   # 页面配置
└── pages.config.ts              # 页面配置（TypeScript）
```

### 13.2 uniapp 配置文件

```json
// manifest.json
{
  "name": "后勤反馈系统",
  "appid": "wx...",
  "versionName": "1.0.0",
  "versionCode": "100",
  "mp-weixin": {
    "appid": "wx...",
    "setting": {
      "urlCheck": false,
      "es6": true,
      "postcss": true,
      "minified": true
    },
    "usingComponents": true,
    "permission": {
      "scope.userLocation": {
        "desc": "您的位置信息将用于工单定位"
      }
    }
  }
}
```

```json
// pages.json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "后勤反馈"
      }
    },
    {
      "path": "pages/ticket-list/list",
      "style": {
        "navigationBarTitleText": "工单列表"
      }
    },
    {
      "path": "pages/ticket-create/create",
      "style": {
        "navigationBarTitleText": "创建工单"
      }
    },
    {
      "path": "pages/ticket-detail/detail",
      "style": {
        "navigationBarTitleText": "工单详情"
      }
    },
    {
      "path": "pages/my-tickets/my-tickets",
      "style": {
        "navigationBarTitleText": "我的工单"
      }
    },
    {
      "path": "pages/profile/profile",
      "style": {
        "navigationBarTitleText": "个人中心"
      }
    }
  ],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/index/index",
        "iconPath": "static/tab-home.png",
        "selectedIconPath": "static/tab-home-active.png",
        "text": "首页"
      },
      {
        "pagePath": "pages/my-tickets/my-tickets",
        "iconPath": "static/tab-ticket.png",
        "selectedIconPath": "static/tab-ticket-active.png",
        "text": "我的工单"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "static/tab-profile.png",
        "selectedIconPath": "static/tab-profile-active.png",
        "text": "我的"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "后勤反馈",
    "navigationBarBackgroundColor": "#F8F8F8",
    "backgroundColor": "#F8F8F8"
  }
}
```

### 13.3 API 请求封装

```typescript
// utils/api.ts

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com/api/v1';

class ApiService {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
    uni.setStorageSync('token', token);
  }

  getToken(): string {
    if (!this.token) {
      this.token = uni.getStorageSync('token') || '';
    }
    return this.token;
  }

  request<T = any>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}${url}`,
        method,
        data,
        header: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
        },
        success: (res: any) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            uni.showToast({
              title: res.data.message || '请求失败',
              icon: 'none',
            });
            reject(res.data);
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络请求失败',
            icon: 'none',
          });
          reject(err);
        },
      });
    });
  }

  upload(filePath: string): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${BASE_URL}/attachment/upload/images`,
        filePath,
        name: 'files',
        header: {
          'Authorization': `Bearer ${this.getToken()}`,
        },
        success: (res: any) => {
          const data = JSON.parse(res.data);
          resolve(data);
        },
        fail: reject,
      });
    });
  }

  get<T = any>(url: string, data?: any) {
    return this.request<T>(url, 'GET', data);
  }

  post<T = any>(url: string, data?: any) {
    return this.request<T>(url, 'POST', data);
  }

  put<T = any>(url: string, data?: any) {
    return this.request<T>(url, 'PUT', data);
  }

  delete<T = any>(url: string, data?: any) {
    return this.request<T>(url, 'DELETE', data);
  }
}

export const api = new ApiService();
```

### 13.4 微信登录

```typescript
// utils/auth.ts

import { api } from './api';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    wxNickname?: string;
    wxAvatarUrl?: string;
  };
}

export async function login(): Promise<LoginResult> {
  return new Promise((resolve, reject) => {
    // 1. 获取微信 code
    uni.login({
      provider: 'weixin',
      success: (loginRes: any) => {
        const code = loginRes.code;

        // 2. 调用后端接口换取 token
        api.post<LoginResult>('/auth/wechat-login', { code })
          .then((result) => {
            // 3. 存储 token
            api.setToken(result.data.token);
            resolve(result.data);
          })
          .catch(reject);
      },
      fail: reject,
    });
  });
}

export async function getUserProfile() {
  return new Promise((resolve, reject) => {
    // 1. 获取用户信息授权
    uni.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes: any) => {
        const { userInfo } = profileRes;

        // 2. 更新用户信息
        api.put('/users/me', {
          wxNickname: userInfo.nickName,
          wxAvatarUrl: userInfo.avatarUrl,
        })
          .then(() => resolve(userInfo))
          .catch(reject);
      },
      fail: reject,
    });
  });
}

export function logout() {
  api.setToken('');
  uni.removeStorageSync('token');
  uni.reLaunch({ url: '/pages/index/index' });
}
```

### 13.5 创建工单页面

```vue
<!-- pages/ticket-create/create.vue -->
<template>
  <view class="create-page">
    <uni-forms ref="formRef" :model="form" :rules="rules">
      <!-- 标题 -->
      <uni-forms-item label="标题" name="title" required>
        <uni-easyinput v-model="form.title" placeholder="请输入工单标题" />
      </uni-forms-item>

      <!-- 分类 -->
      <uni-forms-item label="分类" name="categoryId" required>
        <uni-data-select
          v-model="form.categoryId"
          :localdata="categories"
          placeholder="请选择分类"
        />
      </uni-forms-item>

      <!-- 优先级 -->
      <uni-forms-item label="优先级" name="priority">
        <uni-data-select
          v-model="form.priority"
          :localdata="priorityOptions"
          placeholder="请选择优先级"
        />
      </uni-forms-item>

      <!-- 描述 -->
      <uni-forms-item label="描述" name="description">
        <uni-easyinput
          v-model="form.description"
          type="textarea"
          placeholder="请详细描述问题"
          :maxlength="500"
        />
      </uni-forms-item>

      <!-- 位置 -->
      <uni-forms-item label="位置" name="location">
        <uni-easyinput v-model="form.location" placeholder="请输入位置信息" />
      </uni-forms-item>

      <!-- 图片上传 -->
      <uni-forms-item label="图片" name="images">
        <image-uploader v-model="form.images" :maxCount="9" />
      </uni-forms-item>
    </uni-forms>

    <!-- 提交按钮 -->
    <view class="submit-btn">
      <button type="primary" @click="submit">提交工单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/utils/api';

interface Category {
  value: string;
  text: string;
}

const form = ref({
  title: '',
  description: '',
  categoryId: '',
  priority: 'NORMAL',
  location: '',
  images: [] as string[],
});

const categories = ref<Category[]>([]);
const priorityOptions = [
  { value: 'NORMAL', text: '普通' },
  { value: 'URGENT', text: '紧急' },
];

const rules = {
  title: {
    rules: [{ required: true, errorMessage: '请输入标题' }],
  },
  categoryId: {
    rules: [{ required: true, errorMessage: '请选择分类' }],
  },
};

// 加载分类
onMounted(() => {
  loadCategories();
});

async function loadCategories() {
  const res = await api.get<Category[]>('/categories?level=1');
  categories.value = res.data.map((cat) => ({
    value: cat.id,
    text: cat.name,
  }));
}

// 提交工单
async function submit() {
  uni.showLoading({ title: '提交中...' });

  try {
    await api.post('/tickets', form.value);

    uni.hideLoading();
    uni.showToast({ title: '提交成功' });

    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.hideLoading();
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  padding: 20rpx;
}

.submit-btn {
  margin-top: 40rpx;
}
</style>
```

### 13.6 图片上传组件

```vue
<!-- components/image-uploader/image-uploader.vue -->
<template>
  <view class="image-uploader">
    <view class="image-list">
      <!-- 已上传的图片 -->
      <view v-for="(url, index) in innerValue" :key="index" class="image-item">
        <image :src="url" mode="aspectFill" @click="preview(index)" />
        <view class="delete-btn" @click="remove(index)">
          <uni-icons type="clear" size="20" color="#fff" />
        </view>
      </view>

      <!-- 上传按钮 -->
      <view v-if="innerValue.length < maxCount" class="upload-btn" @click="chooseImage">
        <uni-icons type="camera" size="40" color="#999" />
        <text>{{ innerValue.length }}/{{ maxCount }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/utils/api';

interface Props {
  modelValue: string[];
  maxCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const innerValue = ref<string[]>(props.modelValue);

watch(() => props.modelValue, (val) => {
  innerValue.value = val;
});

watch(innerValue, (val) => {
  emit('update:modelValue', val);
});

// 选择图片
function chooseImage() {
  uni.chooseMedia({
    count: props.maxCount - innerValue.value.length,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImages(res.tempFiles.map((f: any) => f.tempFilePath));
    },
  });
}

// 上传图片
async function uploadImages(filePaths: string[]) {
  uni.showLoading({ title: '上传中...' });

  try {
    const uploadPromises = filePaths.map(path => api.upload(path));
    const results = await Promise.all(uploadPromises);

    innerValue.value.push(...results.map(r => r.url));

    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    uni.showToast({ title: '上传失败', icon: 'none' });
  }
}

// 删除图片
function remove(index: number) {
  innerValue.value.splice(index, 1);
}

// 预览图片
function preview(index: number) {
  uni.previewImage({
    urls: innerValue.value,
    current: index,
  });
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .image-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }

  .image-item {
    position: relative;
    width: 200rpx;
    height: 200rpx;

    image {
      width: 100%;
      height: 100%;
      border-radius: 8rpx;
    }

    .delete-btn {
      position: absolute;
      top: -10rpx;
      right: -10rpx;
      width: 40rpx;
      height: 40rpx;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .upload-btn {
    width: 200rpx;
    height: 200rpx;
    border: 2rpx dashed #ddd;
    border-radius: 8rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10rpx;

    text {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>
```

### 13.7 订阅消息

```typescript
// utils/notification.ts

export async function requestSubscribeMessage() {
  // 请求订阅消息权限
  return new Promise((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [
        import.meta.env.VITE_WX_TEMPLATE_ASSIGNED,
        import.meta.env.VITE_WX_TEMPLATE_ACCEPTED,
        import.meta.env.VITE_WX_TEMPLATE_COMPLETED,
        import.meta.env.VITE_WX_TEMPLATE_OVERDUE,
      ],
      success: (res) => {
        console.log('订阅消息授权结果:', res);
        resolve(res);
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err);
        resolve(err);
      },
    });
  });
}

// App.vue 中监听消息
export function onNotificationMessage(callback: (data: any) => void) {
  // 监听小程序消息推送
  uni.onAppMessage(callback);
}
```

### 13.8 环境变量配置

```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WX_TEMPLATE_ASSIGNED=xxx
VITE_WX_TEMPLATE_ACCEPTED=xxx
VITE_WX_TEMPLATE_COMPLETED=xxx
VITE_WX_TEMPLATE_OVERDUE=xxx

// .env.production
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_WX_TEMPLATE_ASSIGNED=xxx
VITE_WX_TEMPLATE_ACCEPTED=xxx
VITE_WX_TEMPLATE_COMPLETED=xxx
VITE_WX_TEMPLATE_OVERDUE=xxx
```

---

## 十四、数据库迁移策略

### 14.1 迁移步骤

```bash
# 1. 更新 Prisma Schema
cd infra/database
nano prisma/schema.prisma

# 2. 生成迁移文件
npx prisma migrate dev --name add_ticket_system

# 3. 生成 Prisma Client
npx prisma generate

# 4. 重启后端服务
cd ../../apps/api
pnpm dev

# 5. 验证迁移
# 使用 Prisma Studio 查看数据
cd ../infra/database
npx prisma studio
```

---

## 十五、安全性考虑

### 15.1 数据脱敏

```typescript
// apps/api/src/modules/ticket/services/ticket.service.ts

// 在返回数据前对敏感信息脱敏
private sanitizeTicketData(ticket: any, currentUser: any) {
  // 普通用户只能查看自己创建的工单
  if (currentUser.role === 'normal_user') {
    // 隐藏其他用户的手机号
    if (ticket.createdBy.id !== currentUser.id) {
      ticket.createdBy.phone = this.maskPhone(ticket.createdBy.phone);
    }
  }

  // 管理员可以看到所有信息
  return ticket;
}

private maskPhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}
```

### 15.2 权限校验

```typescript
// apps/api/src/modules/ticket/services/ticket.service.ts

async getOne(id: string, currentUser: any) {
  const ticket = await this.prisma.ticket.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedTo: true,
      category: true,
      attachments: true,
    },
  });

  if (!ticket) {
    throw new NotFoundException('工单不存在');
  }

  // 权限校验
  const canView =
    currentUser.role === 'super_admin' ||
    currentUser.role === 'dept_admin' ||
    ticket.createdById === currentUser.id ||
    ticket.assignedId === currentUser.id;

  if (!canView) {
    throw new ForbiddenException('无权查看此工单');
  }

  return this.sanitizeTicketData(ticket, currentUser);
}
```

### 15.3 防止越权操作

```typescript
// apps/api/src/modules/ticket/services/ticket.service.ts

async update(id: string, data: any, currentUser: any) {
  const ticket = await this.prisma.ticket.findUnique({
    where: { id },
  });

  // 只有创建者可以修改基本信息
  if (ticket.createdById !== currentUser.id) {
    throw new ForbiddenException('只有创建者可以修改工单');
  }

  // 只有管理员可以指派工单
  if (data.assignedId && currentUser.role !== 'dept_admin') {
    throw new ForbiddenException('只有管理员可以指派工单');
  }

  // 只有处理人可以修改处理状态
  if (data.status && ticket.assignedId !== currentUser.id) {
    throw new ForbiddenException('只有处理人可以修改状态');
  }

  return this.prisma.ticket.update({
    where: { id },
    data,
  });
}
```

---

## 十六、性能优化建议

### 16.1 数据库查询优化

```prisma
// schema.prisma - 添加复合索引
model Ticket {
  // ... 字段定义 ...

  @@index([status, priority])           // 按状态和优先级筛选
  @@index([createdById, status])        // 用户的工单列表
  @@index([assignedId, status])         // 处理人的工单列表
  @@index([deadlineAt, status])         // 超时预警查询
  @@index([createdAt(sort: Desc)])      // 时间排序
}
```

### 16.2 分页优化

```typescript
// apps/api/src/modules/ticket/services/ticket.service.ts

async getMany(params: { page: number; limit: number }) {
  const { page, limit } = params;

  const [total, data] = await Promise.all([
    this.prisma.ticket.count(),
    this.prisma.ticket.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
        category: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

---

## 十七、部署流程（Docker）

### 17.1 Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:16-alpine
    container_name: feedback-hub-postgres
    environment:
      POSTGRES_DB: feedback_hub
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - feedback-hub-network

  # 后端 API
  api:
    build:
      context: .
      dockerfile: docker/api/Dockerfile
    container_name: feedback-hub-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-postgres}@postgres:5432/feedback_hub
      JWT_SECRET: ${JWT_SECRET}
      WX_MINI_APP_ID: ${WX_MINI_APP_ID}
      WX_MINI_APP_SECRET: ${WX_MINI_APP_SECRET}
      FILE_STORAGE_PROVIDER: ${FILE_STORAGE_PROVIDER:-local}
      ALIYUN_OSS_REGION: ${ALIYUN_OSS_REGION}
      ALIYUN_OSS_ACCESS_KEY_ID: ${ALIYUN_OSS_ACCESS_KEY_ID}
      ALIYUN_OSS_ACCESS_KEY_SECRET: ${ALIYUN_OSS_ACCESS_KEY_SECRET}
      ALIYUN_OSS_BUCKET: ${ALIYUN_OSS_BUCKET}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - feedback-hub-network
    restart: unless-stopped

  # 前端管理端
  admin:
    build:
      context: .
      dockerfile: docker/admin/Dockerfile
    container_name: feedback-hub-admin
    ports:
      - "8080:80"
    depends_on:
      - api
    networks:
      - feedback-hub-network
    restart: unless-stopped

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: feedback-hub-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - admin
    networks:
      - feedback-hub-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  feedback-hub-network:
    driver: bridge
```

### 17.2 后端 Dockerfile

```dockerfile
# docker/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY infra/database/package.json ./infra/database/
COPY infra/shared/package.json ./infra/shared/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 生成 Prisma Client
WORKDIR /app/infra/database
RUN pnpm prisma generate

# 构建后端
WORKDIR /app/apps/api
RUN pnpm build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖和生产构建
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY infra/database/package.json ./infra/database/
COPY infra/shared/package.json ./infra/shared/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/infra/database/generated ./infra/database/generated
COPY --from=builder /app/infra/database/prisma ./infra/database/prisma

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
```

### 17.3 前端 Dockerfile

```dockerfile
# docker/admin/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY apps/admin/package.json ./apps/admin/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 构建前端
WORKDIR /app/apps/admin
RUN pnpm build

# Nginx 镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY docker/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 17.4 Nginx 配置

```nginx
# docker/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    upstream admin {
        server admin:80;
    }

    server {
        listen 80;
        server_name api.example.com;

        client_max_body_size 50M;

        location / {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    server {
        listen 80;
        server_name admin.example.com;

        location / {
            proxy_pass http://admin;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # HTTPS 配置（生产环境）
    # server {
    #     listen 443 ssl http2;
    #     server_name api.example.com;
    #
    #     ssl_certificate /etc/nginx/ssl/api.crt;
    #     ssl_certificate_key /etc/nginx/ssl/api.key;
    #
    #     location / {
    #         proxy_pass http://api;
    #         ...
    #     }
    # }
}
```

### 17.5 环境变量配置

```bash
# .env.production
# 数据库
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key

# 微信小程序
WX_MINI_APP_ID=wx...
WX_MINI_APP_SECRET=...
WX_TEMPLATE_ASSIGNED=...
WX_TEMPLATE_ACCEPTED=...
WX_TEMPLATE_COMPLETED=...
WX_TEMPLATE_OVERDUE=...

# 文件存储
FILE_STORAGE_PROVIDER=aliyun-oss
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=...
ALIYUN_OSS_ACCESS_KEY_SECRET=...
ALIYUN_OSS_BUCKET=feedback-hub
```

### 17.6 部署步骤

```bash
# 1. 克隆代码
git clone <repository-url>
cd feedbackHub

# 2. 配置环境变量
cp .env.example .env.production
nano .env.production

# 3. 构建并启动所有服务
docker-compose up -d --build

# 4. 运行数据库迁移
docker-compose exec api npx prisma migrate deploy

# 5. 初始化种子数据
docker-compose exec api npx prisma db seed

# 6. 查看日志
docker-compose logs -f

# 7. 查看服务状态
docker-compose ps
```

### 17.7 常用命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f api

# 进入容器
docker-compose exec api sh

# 更新代码后重新部署
git pull
docker-compose up -d --build

# 备份数据库
docker-compose exec postgres pg_dump -U postgres feedback_hub > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres feedback_hub < backup.sql
```

---

## 十八、测试策略

### 18.1 单元测试

```typescript
// apps/api/src/modules/ticket/services/ticket-number.service.spec.ts

describe('TicketNumberService', () => {
  let service: TicketNumberService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TicketNumberService, PrismaService],
    }).compile();

    service = module.get<TicketNumberService>(TicketNumberService);
  });

  it('should generate ticket number with correct format', async () => {
    const number = await service.generateNumber();
    expect(number).toMatch(/^\d{12}$/);
  });

  it('should increment sequence for same day', async () => {
    const num1 = await service.generateNumber();
    const num2 = await service.generateNumber();
    expect(parseInt(num2.slice(-4))).toBe(parseInt(num1.slice(-4)) + 1);
  });
});
```

### 18.2 集成测试

```typescript
// apps/api/src/modules/ticket/ticket.controller.e2e-spec.ts

describe('TicketController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/tickets (POST) should create ticket', async () => {
    const response = await request(app.getHttpServer())
      .post('/tickets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试工单',
        description: '这是一个测试工单',
        categoryId: categoryId,
        priority: 'NORMAL',
      })
      .expect(201);

    expect(response.body.ticketNumber).toBeDefined();
    expect(response.body.status).toBe('WAIT_ASSIGN');
  });
});
```

### 18.3 运行测试

```bash
# 单元测试
pnpm test

# 集成测试
pnpm test:e2e

# 测试覆盖率
pnpm test:cov
```

---

## 十九、监控与日志

### 19.1 日志配置

```typescript
// apps/api/src/main.ts

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
          }),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  }),
});
```

### 19.2 监控指标

```typescript
// apps/api/src/modules/health/health.controller.ts

@Controller('health')
export class HealthController {
  @Get()
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
    };
  }
}
```

---

## 二十、总结与建议

### 20.1 实施优先级

| 优先级 | 模块 | 说明 |
|--------|------|------|
| P0 | Ticket | 核心功能，必须优先实现 |
| P0 | Prisma Schema | 数据基础，最先完成 |
| P1 | Attachment | 工单必需功能 |
| P1 | Notification | 用户体验关键 |
| P2 | Statistics | 管理需求 |
| P2 | PresetArea | 可先用手动输入 |

### 20.2 风险提示

1. **状态流转**：确保事务完整性，避免状态不一致
2. **文件上传**：大文件上传可能导致超时，建议设置合理的超时时间
3. **微信通知**：订阅消息有发送次数限制，需要合理规划

### 20.3 扩展建议

1. **工单模板**：支持预设工单模板，快速创建
2. **批量操作**：支持批量指派、批量关闭
3. **工单转交**：支持处理人之间的工单转交
4. **移动端适配**：管理端需要支持移动端访问
5. **数据分析**：增加更丰富的数据分析维度

---

**计划版本：** V1.3 (优化版)
**最后更新：** 2025-01-20
**预计总工期：** 13 工作日
**技术栈：** NestJS + React + tRPC + Prisma + PostgreSQL + uniapp + Docker
**主要更新：**
- 小程序改为 uniapp 框架
- 部署方式改为 Docker Compose
- 精简测试策略（移除性能测试部分）
- 移除高并发相关处理
- 移除旧数据迁移相关内容
- 完整的前后端实现方案
