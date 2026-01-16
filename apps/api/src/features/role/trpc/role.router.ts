// apps/api/src/trpc/role.router.ts
import { router, permissionProcedure, publicProcedure } from "../../../shared/trpc/trpc";
import { z } from "zod";

export const roleRouter = router({
  // 获取角色列表 - 公共访问（用于测试）
  getMany: publicProcedure
    .input(z.object({
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { page = 1, pageSize = 10, search } = input || {};
      const skip = (page - 1) * pageSize;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [roles, total] = await Promise.all([
        ctx.prisma.role.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { level: 'asc' },
          include: {
            _count: {
              select: {
                users: true,
                permissions: true,
              },
            },
          },
        }),
        ctx.prisma.role.count({ where }),
      ]);

      return {
        data: roles,
        total,
        page,
        pageSize,
      };
    }),

  // 获取单个角色 - requires role:read permission
  getOne: permissionProcedure('role', 'read')
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
            users: true,
            permissions: true,
          },
        },
      },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      return {
        ...role,
        permissions: role.permissions.map(rp => rp.permission),
      };
    }),

  // 创建角色 - requires role:create permission
  create: permissionProcedure('role', 'create')
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      level: z.number().int().default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if slug already exists
      const existing = await ctx.prisma.role.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new Error('Role slug already exists');
      }

      const role = await ctx.prisma.role.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          level: input.level,
        },
      });

      return role;
    }),

  // 更新角色 - requires role:update permission
  update: permissionProcedure('role', 'update')
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        level: z.number().int().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Check if role exists
      const existing = await ctx.prisma.role.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Role not found');
      }

      // System roles can only have name and description updated
      if (existing.isSystem && (data.level !== undefined)) {
        throw new Error('Cannot modify level of system role');
      }

      const role = await ctx.prisma.role.update({
        where: { id },
        data,
      });

      return role;
    }),

  // 删除角色 - requires role:delete permission
  deleteOne: permissionProcedure('role', 'delete')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if role exists
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: {
          users: true,
        },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // System roles cannot be deleted
      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      // Check if role is assigned to any users
      if (role.users.length > 0) {
        throw new Error('Cannot delete role that is assigned to users');
      }

      await ctx.prisma.role.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // 获取角色权限 - requires role:read permission
  getPermissions: permissionProcedure('role', 'read')
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rolePermissions = await ctx.prisma.rolePermission.findMany({
        where: { roleId: input.id },
        include: {
          permission: true,
        },
        orderBy: {
          permission: {
            resource: 'asc',
          },
        },
      });

      return rolePermissions.map(rp => rp.permission);
    }),

  // 获取拥有该角色的用户列表 - requires role:read permission
  getUsers: permissionProcedure('role', 'read')
    .input(z.object({
      id: z.string(),
      page: z.number().int().positive().optional(),
      pageSize: z.number().int().positive().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { id, page = 1, pageSize = 10 } = input;
      const skip = (page - 1) * pageSize;

      const [userRoles, total] = await Promise.all([
        ctx.prisma.userRole.findMany({
          where: { roleId: id },
          skip,
          take: pageSize,
          orderBy: { assignedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
              },
            },
          },
        }),
        ctx.prisma.userRole.count({ where: { roleId: id } }),
      ]);

      return {
        data: userRoles.map(ur => ({
          ...ur.user,
          assignedAt: ur.assignedAt,
        })),
        total,
        page,
        pageSize,
      };
    }),

  // 分配权限给角色 - requires role:update permission
  assignPermission: permissionProcedure('role', 'update')
    .input(z.object({
      roleId: z.string(),
      permissionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if permission exists
      const permission = await ctx.prisma.permission.findUnique({
        where: { id: input.permissionId },
      });

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Check if role already has this permission
      const existing = await ctx.prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: input.roleId,
            permissionId: input.permissionId,
          },
        },
      });

      if (existing) {
        throw new Error('Role already has this permission');
      }

      await ctx.prisma.rolePermission.create({
        data: {
          roleId: input.roleId,
          permissionId: input.permissionId,
        },
      });

      return { success: true };
    }),

  // 移除角色权限 - requires role:update permission
  removePermission: permissionProcedure('role', 'update')
    .input(z.object({
      roleId: z.string(),
      permissionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: {
            roleId: input.roleId,
            permissionId: input.permissionId,
          },
        },
      });

      return { success: true };
    }),

  // 批量更新角色权限 - requires role:update permission
  updatePermissions: permissionProcedure('role', 'update')
    .input(z.object({
      roleId: z.string(),
      permissionIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { roleId, permissionIds } = input;

      // Check if role exists
      const role = await ctx.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error('Role not found');
      }

      // Verify all permissions exist
      const permissions = await ctx.prisma.permission.findMany({
        where: { id: { in: permissionIds } },
      });

      if (permissions.length !== permissionIds.length) {
        throw new Error('One or more permissions not found');
      }

      // Delete all existing permissions for this role
      await ctx.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new permission associations
      if (permissionIds.length > 0) {
        await ctx.prisma.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId,
            permissionId,
          })),
        });
      }

      return { success: true };
    }),
});
