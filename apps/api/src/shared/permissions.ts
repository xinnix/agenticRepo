/**
 * 权限检查函数
 * 提供基于角色的访问控制和部门隔离
 */

import { PERMISSIONS, ROLES } from '@opencode/shared';
import type { User, Ticket } from '@opencode/database';

// Extended User type with roles and permissions loaded from database
export interface ExtendedUser extends User {
  roles: Array<{
    role: {
      slug: string;
      level: number;
      permissions?: Array<{
        permission: {
          resource: string;
          action: string;
        };
      }>;
    };
  }>;
  permissions?: string[];
}

// ============================================
// 角色检查函数
// ============================================

/**
 * 检查用户是否是超级管理员
 */
export function isSuperAdmin(user: ExtendedUser | null): boolean {
  if (!user) return false;
  return user.roles.some((r: any) => r.role.slug === ROLES.SUPER_ADMIN);
}

/**
 * 检查用户是否是部门管理员
 */
export function isDepartmentAdmin(user: ExtendedUser | null): boolean {
  if (!user) return false;
  return user.roles.some((r: any) => r.role.slug === ROLES.DEPARTMENT_ADMIN);
}

/**
 * 检查用户是否是办事员
 */
export function isHandler(user: ExtendedUser | null): boolean {
  if (!user) return false;
  return user.roles.some((r: any) => r.role.slug === ROLES.HANDLER);
}

/**
 * 检查用户是否是普通用户
 */
export function isNormalUser(user: ExtendedUser | null): boolean {
  if (!user) return false;
  return user.roles.some((r: any) => r.role.slug === ROLES.USER);
}

/**
 * 获取用户的最小角色 level（数字越小权限越高）
 */
export function getUserRoleLevel(user: ExtendedUser | null): number {
  if (!user || !user.roles || user.roles.length === 0) {
    return 999;
  }
  return Math.min(...user.roles.map((r: any) => r.role.level));
}

// ============================================
// 权限检查函数
// ============================================

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(user: ExtendedUser | null, permission: string): boolean {
  if (!user) return false;
  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) return true;
  return user.permissions?.includes(permission) || false;
}

/**
 * 检查用户是否有任一权限
 */
export function hasAnyPermission(user: ExtendedUser | null, permissions: string[]): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return permissions.some(p => user.permissions?.includes(p) || false);
}

/**
 * 检查用户是否有所有权限
 */
export function hasAllPermissions(user: ExtendedUser | null, permissions: string[]): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return permissions.every(p => user.permissions?.includes(p) || false);
}

// ============================================
// 部门访问控制
// ============================================

/**
 * 检查用户是否可以访问指定部门
 * - 超级管理员可以访问所有部门
 * - 部门管理员只能访问自己的部门
 * - 办事员和普通用户只能访问自己的部门
 */
export function canAccessDepartment(user: ExtendedUser | null, departmentId: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return user.departmentId === departmentId;
}

/**
 * 获取用户可以访问的部门 ID 列表
 * - 超级管理员返回 null（无限制）
 * - 其他角色返回自己的部门 ID
 */
export function getAccessibleDepartmentIds(user: ExtendedUser | null): string[] | null {
  if (!user) return [];
  if (isSuperAdmin(user)) return null; // null 表示无限制
  if (user.departmentId) return [user.departmentId];
  return [];
}

// ============================================
// 工单访问控制
// ============================================

/**
 * 检查用户是否可以访问指定工单
 * 规则：
 * - 超级管理员可以访问所有工单
 * - 部门管理员可以访问本部门所有工单
 * - 办事员可以访问分配给自己的工单和本部门工单
 * - 普通用户只能访问自己创建的工单
 */
export function canAccessTicket(user: ExtendedUser | null, ticket: Ticket): boolean {
  if (!user) return false;

  // 超级管理员可以访问所有工单
  if (isSuperAdmin(user)) return true;

  // 普通用户只能访问自己创建的工单
  if (isNormalUser(user)) {
    return ticket.createdById === user.id;
  }

  // 办事员可以访问分配给自己的工单
  if (isHandler(user)) {
    if (ticket.assignedId === user.id) return true;
    // 也可以访问本部门的工单（用于查看）
    // TODO: 需要查询时包含 createdBy 关联
    return false;
  }

  // 部门管理员可以访问本部门的工单
  if (isDepartmentAdmin(user)) {
    // TODO: 需要查询时包含 createdBy 关联
    return false;
  }

  return false;
}

/**
 * 获取工单查询过滤条件
 * 根据用户角色返回相应的 where 条件
 */
export function getTicketFilterForUser(user: ExtendedUser | null): Record<string, any> | null {
  if (!user) return { id: 'non-existent-id' }; // 返回空条件

  // 超级管理员无限制
  if (isSuperAdmin(user)) return null;

  // 普通用户只能看到自己创建的工单
  if (isNormalUser(user)) {
    return { createdById: user.id };
  }

  // 办事员可以看到分配给自己的工单
  if (isHandler(user)) {
    return {
      OR: [
        { assignedId: user.id },
        // 也可以看到本部门的工单
        ...(user.departmentId ? [{ createdBy: { departmentId: user.departmentId } }] : []),
      ],
    };
  }

  // 部门管理员可以看到本部门的工单
  if (isDepartmentAdmin(user) && user.departmentId) {
    return { createdBy: { departmentId: user.departmentId } };
  }

  // 默认返回空条件
  return { id: 'non-existent-id' };
}

// ============================================
// 用户管理访问控制
// ============================================

/**
 * 检查用户是否可以管理指定目标用户
 * - 超级管理员可以管理所有用户
 * - 部门管理员可以管理本部门用户
 */
export function canManageUser(user: ExtendedUser | null, targetUserId: string, targetUserDepartmentId: string | null): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (isDepartmentAdmin(user) && user.departmentId) {
    return user.departmentId === targetUserDepartmentId;
  }
  return false;
}

/**
 * 获取用户查询过滤条件
 */
export function getUserFilterForUser(user: ExtendedUser | null): Record<string, any> | null {
  if (!user) return { id: 'non-existent-id' };
  if (isSuperAdmin(user)) return null;
  if (isDepartmentAdmin(user) && user.departmentId) {
    return { departmentId: user.departmentId };
  }
  return { id: 'non-existent-id' };
}

// ============================================
// 统计访问控制
// ============================================

/**
 * 获取统计查询的部门过滤
 */
export function getStatisticsFilterForUser(user: ExtendedUser | null): { departmentId?: string } | null {
  if (!user) return { departmentId: 'non-existent-id' };
  if (isSuperAdmin(user)) return null;
  if (user.departmentId) return { departmentId: user.departmentId };
  return { departmentId: 'non-existent-id' };
}

// ============================================
// 导出权限常量
// ============================================

export { PERMISSIONS, ROLES };
