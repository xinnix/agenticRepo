// packages/shared/src/index.ts
import { z } from "zod";

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// ============================================
// User & Role Types
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  permissions: string[]; // Format: "resource:action"
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: Date;
}

// ============================================
// Auth Response Types
// ============================================

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Permission Constants
// ============================================

export const PERMISSIONS = {
  TODO: {
    CREATE: 'todo:create',
    READ: 'todo:read',
    UPDATE: 'todo:update',
    DELETE: 'todo:delete',
  },
  USER: {
    CREATE: 'user:create',
    READ: 'user:read',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE_ROLES: 'user:manage_roles',
  },
  ROLE: {
    CREATE: 'role:create',
    READ: 'role:read',
    UPDATE: 'role:update',
    DELETE: 'role:delete',
  },
  SETTINGS: {
    READ: 'settings:read',
    UPDATE: 'settings:update',
  },
} as const;

export type PermissionString = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

// ============================================
// Role Constants
// ============================================

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type RoleSlug = typeof ROLES[keyof typeof ROLES];

// ============================================
// Todo Schemas (existing)
// ============================================

export const CreateTodoSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(3).default(1),
  dueDate: z.string().datetime().optional().nullable(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

// ============================================
// User Management Schemas
// ============================================

export const CreateUserSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符"),
  email: z.string().email("邮箱格式无效"),
  password: z.string().min(8, "密码至少8个字符"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const UserListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  roleSlug: z.string().optional(),
});

export const AssignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});

export const BatchAssignRolesSchema = z.object({
  userIds: z.array(z.string()),
  roleIds: z.array(z.string()),
});

export const ResetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(8, "密码至少8个字符"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UserListQueryInput = z.infer<typeof UserListQuerySchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type BatchAssignRolesInput = z.infer<typeof BatchAssignRolesSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ============================================
// Role Management Schemas
// ============================================

export const CreateRoleSchema = z.object({
  name: z.string().min(1, "角色名称不能为空"),
  slug: z.string().min(1, "角色标识不能为空"),
  description: z.string().optional(),
  level: z.number().int().default(100),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  level: z.number().int().optional(),
});

export const RoleListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
});

export const UpdateRolePermissionsSchema = z.object({
  roleId: z.string(),
  permissionIds: z.array(z.string()),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type RoleListQueryInput = z.infer<typeof RoleListQuerySchema>;
export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>;

// ============================================
// tRPC Router Export
// ============================================

// 导出 tRPC 的 AppRouter 类型，用于前端类型安全
// 注意：AppRouter 实际定义在 apps/api/src/trpc/app.router.ts
// 由于 monorepo 的结构，前端需要从 @opencode/api 包导入 AppRouter 类型
// 这里提供一个类型占位符，实际使用时需要重新导出

// export type { AppRouter } from "@opencode/api";


// Product Schemas
export const ProductSchema = {
  createInput: z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    costPrice: z.number().optional(),
    sku: z.string(),
    barcode: z.string().optional(),
    categoryId: z.number(),
    brand: z.string().optional(),
    stock: z.number(),
    minStock: z.number(),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    images: z.string().optional(),
    status: z.enum(["active","inactive","discontinued"]),
    featured: z.boolean(),
  }),
  updateInput: z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    costPrice: z.number().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    categoryId: z.number().optional(),
    brand: z.string().optional(),
    stock: z.number().optional(),
    minStock: z.number().optional(),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    images: z.string().optional(),
    status: z.enum(["active","inactive","discontinued"]).optional(),
    featured: z.boolean().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// Blog Schemas
export const BlogSchema = {
  createInput: z.object({
    title: z.string(),
    content: z.string(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.string().optional(),
    status: z.enum(["draft","published","archived"]),
    authorId: z.number(),
    viewCount: z.number(),
    publishedAt: z.date().optional(),
  }),
  updateInput: z.object({
    id: z.number(),
    title: z.string().optional(),
    content: z.string().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.string().optional(),
    status: z.enum(["draft","published","archived"]).optional(),
    authorId: z.number().optional(),
    viewCount: z.number().optional(),
    publishedAt: z.date().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// Article Schemas
export const ArticleSchema = {
  createInput: z.object({
    title: z.string(),
    content: z.string(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.string().optional(),
    status: z.enum(["draft","published","archived"]),
    authorId: z.number(),
    viewCount: z.number(),
    publishedAt: z.date().optional(),
  }),
  updateInput: z.object({
    id: z.number(),
    title: z.string().optional(),
    content: z.string().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    categoryId: z.number().optional(),
    tags: z.string().optional(),
    status: z.enum(["draft","published","archived"]).optional(),
    authorId: z.number().optional(),
    viewCount: z.number().optional(),
    publishedAt: z.date().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// Test Schemas
export const TestSchema = {
  createInput: z.object({
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    sortOrder: z.number(),
  }),
  updateInput: z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    sortOrder: z.number().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// Todo Schemas
export const TodoSchema = {
  createInput: z.object({
    title: z.string(),
    description: z.string().optional(),
    isCompleted: z.boolean().default(false),
    priority: z.number().default(2),
    dueDate: z.date().optional(),
  }),
  updateInput: z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    isCompleted: z.boolean().optional(),
    priority: z.number().optional(),
    dueDate: z.date().optional(),
  }),
  getOneInput: z.object({ id: z.string() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.string() }),
};

// User Schemas (for createCrudRouter)
export const UserSchema = {
  createInput: CreateUserSchema,
  updateInput: UpdateUserSchema,
};

// Role Schemas (for createCrudRouter)
export const RoleSchema = {
  createInput: CreateRoleSchema,
  updateInput: UpdateRoleSchema,
};

// TestTodo Schemas
export const TestTodoSchema = {
  createInput: z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["pending","in_progress","completed","cancelled"]),
    priority: z.number().refine(val => [1,2,3].includes(val)),
    dueDate: z.date().optional(),
    assigneeId: z.number().optional(),
    projectId: z.number().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
  }),
  updateInput: z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["pending","in_progress","completed","cancelled"]).optional(),
    priority: z.number().refine(val => [1,2,3].includes(val)).optional(),
    dueDate: z.date().optional(),
    assigneeId: z.number().optional(),
    projectId: z.number().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// TestProduct Schemas
export const TestProductSchema = {
  createInput: z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    costPrice: z.number().optional(),
    sku: z.string(),
    barcode: z.string().optional(),
    categoryId: z.number(),
    brand: z.string().optional(),
    stock: z.number(),
    minStock: z.number(),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    images: z.string().optional(),
    status: z.enum(["active","inactive","discontinued"]),
    featured: z.boolean(),
  }),
  updateInput: z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    costPrice: z.number().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    categoryId: z.number().optional(),
    brand: z.string().optional(),
    stock: z.number().optional(),
    minStock: z.number().optional(),
    weight: z.number().optional(),
    dimensions: z.string().optional(),
    images: z.string().optional(),
    status: z.enum(["active","inactive","discontinued"]).optional(),
    featured: z.boolean().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// SkillTodo Schemas
export const SkillTodoSchema = {
  createInput: z.object({
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["pending","in_progress","completed","cancelled"]),
    priority: z.number().refine(val => [1,2,3].includes(val)),
    dueDate: z.date().optional(),
    assigneeId: z.number().optional(),
    projectId: z.number().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
  }),
  updateInput: z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(["pending","in_progress","completed","cancelled"]).optional(),
    priority: z.number().refine(val => [1,2,3].includes(val)).optional(),
    dueDate: z.date().optional(),
    assigneeId: z.number().optional(),
    projectId: z.number().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
  }),
  getOneInput: z.object({ id: z.number() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.number() }),
};

// ============================================

// ============================================
// Category Schemas
// ============================================

export const CategorySchema = {
  createInput: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    parentId: z.string().optional(),
    icon: z.string().optional(),
    sortOrder: z.number().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  }),

  // updateInput is the data part only (id is handled by tRPC helper wrapper)
  updateInput: z.object({
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
    sortOrder: z.number().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  }),

  getOneInput: z.object({ id: z.string() }),
  getManyInput: z.object({
    page: z.number().optional().default(1),
    limit: z.number().optional().default(10),
  }),
  deleteInput: z.object({ id: z.string() }),
};
