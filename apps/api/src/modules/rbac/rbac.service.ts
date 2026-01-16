import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, roleSlug: string): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role: { slug: roleSlug },
      },
    });

    return !!userRole;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: string, roleSlugs: string[]): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { slug: { in: roleSlugs } },
      },
    });

    return userRoles.length > 0;
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      return false;
    }

    // Check all user's roles for the required permission
    for (const userRole of userWithPermissions.roles) {
      for (const rolePermission of userRole.role.permissions) {
        if (
          rolePermission.permission.resource === resource &&
          rolePermission.permission.action === action
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Collect unique permissions
    const permissionsMap = new Map<string, any>();

    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        const permission = rolePermission.permission;
        const key = `${permission.resource}:${permission.action}`;

        if (!permissionsMap.has(key)) {
          permissionsMap.set(key, {
            id: permission.id,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
          });
        }
      }
    }

    return Array.from(permissionsMap.values());
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
      orderBy: {
        role: { level: 'asc' },
      },
    });

    return userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      slug: ur.role.slug,
      level: ur.role.level,
      description: ur.role.description,
      isSystem: ur.role.isSystem,
      assignedAt: ur.assignedAt,
    }));
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string) {
    // Check if user already has this role
    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string) {
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    return { success: true };
  }
}
