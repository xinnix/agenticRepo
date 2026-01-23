import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  router,
  protectedProcedure,
  publicProcedure,
  permissionProcedure,
} from '../../../trpc/trpc';
import type { AttachmentType } from '@opencode/database';

/**
 * Attachment tRPC Router
 * 提供类型安全的附件管理 API
 */

// 输入 Schema 定义
const AttachmentQueryInput = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  ticketId: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
});

const AttachmentCreateInput = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  ticketId: z.string().optional(),
});

export const attachmentRouter = router({
  /**
   * 获取附件列表
   */
  getMany: protectedProcedure
    .input(AttachmentQueryInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10, ...filters } = input;

      const where: any = {};
      if (filters.ticketId) {
        where.ticketId = filters.ticketId;
      }
      if (filters.type) {
        where.type = filters.type as AttachmentType;
      }

      const [total, data] = await Promise.all([
        ctx.prisma.attachment.count({ where }),
        ctx.prisma.attachment.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
            ticket: {
              select: {
                id: true,
                ticketNumber: true,
                title: true,
              },
            },
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
    }),

  /**
   * 获取单个附件
   */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const attachment = await ctx.prisma.attachment.findUnique({
        where: { id: input.id },
        include: {
          uploadedBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '附件不存在',
        });
      }

      return attachment;
    }),

  /**
   * 删除附件
   */
  delete: permissionProcedure('attachment', 'delete')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.prisma.attachment.findUnique({
        where: { id: input.id },
        include: { ticket: true },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '附件不存在',
        });
      }

      // 权限校验：只有上传者和工单创建者可以删除
      const isUploader = attachment.uploadedById === ctx.user?.id;
      const isTicketCreator = attachment.ticket?.createdById === ctx.user?.id;
      const isAdmin = ctx.user?.roles?.some((r: any) =>
        ['super_admin', 'dept_admin'].includes(r.slug),
      );

      if (!isUploader && !isTicketCreator && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权删除此附件',
        });
      }

      // TODO: 删除文件存储
      // await fileStorage.deleteFile(attachment.url);

      // 删除数据库记录
      await ctx.prisma.attachment.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
