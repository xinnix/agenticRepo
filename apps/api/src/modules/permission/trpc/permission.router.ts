import { router, publicProcedure } from "../../../trpc/trpc";
import { z } from "zod";

/**
 * Permission tRPC Router
 *
 * Provides read-only operations for permissions.
 * Permissions are managed by the system and assigned to roles.
 */
export const permissionRouter = router({
  /**
   * 获取所有权限列表
   */
  getMany: publicProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(100),
      resource: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 100, resource } = input;

      const where: any = {};
      if (resource) {
        where.resource = resource;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.permission.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [
            { resource: 'asc' },
            { action: 'asc' },
          ],
        }),
        ctx.prisma.permission.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * 获取单个权限
   */
  getOne: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.permission.findUnique({
        where: { id: input.id },
      });
    }),

  /**
   * 按资源分组获取权限
   */
  getByResource: publicProcedure
    .query(async ({ ctx }) => {
      const permissions = await ctx.prisma.permission.findMany({
        orderBy: [
          { resource: 'asc' },
          { action: 'asc' },
        ],
      });

      // 按资源分组
      const grouped = permissions.reduce((acc: any, permission) => {
        if (!acc[permission.resource]) {
          acc[permission.resource] = [];
        }
        acc[permission.resource].push(permission);
        return acc;
      }, {});

      return grouped;
    }),
});
