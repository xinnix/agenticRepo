import { router, publicProcedure } from "../../../trpc/trpc";
import { z } from "zod";
import { PresetAreaSchema } from "@opencode/shared";

/**
 * Area (PresetArea) tRPC Router
 *
 * Provides standard CRUD operations for preset areas.
 * Includes department information by default for display purposes.
 */
export const areaRouter = router({
  /**
   * 获取区域列表（包含部门信息）
   */
  getMany: publicProcedure
    .input(PresetAreaSchema.getManyInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10, ...filters } = input;

      const where: any = {};
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      if (filters.departmentId) {
        where.departmentId = filters.departmentId;
      }

      const [items, total] = await Promise.all([
        ctx.prisma.presetArea.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
        ctx.prisma.presetArea.count({ where }),
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
   * 获取单个区域（包含部门信息）
   */
  getOne: publicProcedure
    .input(PresetAreaSchema.getOneInput)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.presetArea.findUnique({
        where: { id: input.id },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    }),

  /**
   * 创建区域
   */
  create: publicProcedure
    .input(z.object({
      data: PresetAreaSchema.createInput,
      include: z.any().optional(),
      select: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data } = input;

      // 检查 code 是否已存在
      const existing = await ctx.prisma.presetArea.findFirst({
        where: {
          OR: [
            { code: data.code },
            { name: data.name },
          ],
        },
      });

      if (existing) {
        if (existing.code === data.code) {
          throw new Error("区域编码已存在");
        }
        if (existing.name === data.name) {
          throw new Error("区域名称已存在");
        }
      }

      // 检查 departmentId 是否有效
      if (data.departmentId) {
        const department = await ctx.prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new Error("指定的部门不存在");
        }
      }

      const area = await ctx.prisma.presetArea.create({
        data: {
          name: data.name,
          code: data.code,
          departmentId: data.departmentId,
          sortOrder: data.sortOrder,
          isActive: data.isActive ?? true,
        },
        // select 和 include 不能同时使用，优先使用 select
        ...(input.select ? { select: input.select } : {}),
        ...(input.include ? { include: input.include } : {
          // 默认包含 department 信息
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
      });

      return area;
    }),

  /**
   * 更新区域
   */
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: PresetAreaSchema.updateInput,
      include: z.any().optional(),
      select: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // 检查区域是否存在
      const existing = await ctx.prisma.presetArea.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("区域不存在");
      }

      // 检查 code 是否被其他区域占用
      if (data.code) {
        const duplicate = await ctx.prisma.presetArea.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              { code: data.code },
            ],
          },
        });

        if (duplicate) {
          throw new Error("区域编码已存在");
        }
      }

      // 检查 departmentId 是否有效
      if (data.departmentId !== null && data.departmentId !== undefined) {
        const department = await ctx.prisma.department.findUnique({
          where: { id: data.departmentId },
        });

        if (!department) {
          throw new Error("指定的部门不存在");
        }
      }

      const area = await ctx.prisma.presetArea.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          departmentId: data.departmentId,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
        },
        // select 和 include 不能同时使用，优先使用 select
        ...(input.select ? { select: input.select } : {}),
        ...(input.include ? { include: input.include } : {
          // 默认包含 department 信息
          include: {
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        }),
      });

      return area;
    }),

  /**
   * 删除区域
   */
  delete: publicProcedure
    .input(PresetAreaSchema.deleteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.presetArea.delete({
        where: { id: input.id },
      });
    }),

  /**
   * 生成小程序码
   */
  generateQrCode: publicProcedure
    .input(z.object({
      id: z.string(),
      forceRegenerate: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { wxacodeService } = ctx;
      return wxacodeService.generateAreaQrCode(input.id, input.forceRegenerate);
    }),

  /**
   * 批量生成小程序码
   */
  batchGenerateQrCodes: publicProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { wxacodeService } = ctx;
      return wxacodeService.batchGenerateQrCodes(input.ids);
    }),

  /**
   * 删除小程序码
   */
  deleteQrCode: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { wxacodeService } = ctx;
      return wxacodeService.deleteQrCode(input.id);
    }),

  /**
   * 通过 scene 查询区域（供小程序使用）
   */
  getByScene: publicProcedure
    .input(z.object({
      scene: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const { wxacodeService } = ctx;
      return wxacodeService.getAreaByScene(input.scene);
    }),
});
