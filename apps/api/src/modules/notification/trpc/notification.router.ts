import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  router,
  protectedProcedure,
  publicProcedure,
} from '../../../trpc/trpc';
import type { NotificationType } from '@opencode/database';

/**
 * Notification tRPC Router
 * 提供类型安全的通知管理 API
 */

// 输入 Schema 定义
const NotificationQueryInput = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  isRead: z.boolean().optional(),
  type: z.enum([
    'TICKET_ASSIGNED',
    'TICKET_ACCEPTED',
    'TICKET_COMPLETED',
    'TICKET_OVERDUE',
    'TICKET_COMMENT',
    'TICKET_RATED',
  ]).optional(),
});

const MarkManyReadInput = z.object({
  ids: z.array(z.string()),
});

export const notificationRouter = router({
  /**
   * 获取用户通知列表
   */
  getMany: protectedProcedure
    .input(NotificationQueryInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 20, ...filters } = input;

      const where: any = { userId: ctx.user!.id };
      if (filters.isRead !== undefined) {
        where.isRead = filters.isRead;
      }
      if (filters.type) {
        where.type = filters.type as NotificationType;
      }

      const [total, data] = await Promise.all([
        ctx.prisma.notification.count({ where }),
        ctx.prisma.notification.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { sentAt: 'desc' },
          include: {
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
   * 获取未读通知数量
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.notification.count({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
      });
      return { count };
    }),

  /**
   * 标记通知为已读
   */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 验证通知属于该用户
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通知不存在',
        });
      }

      if (notification.userId !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权操作此通知',
        });
      }

      return ctx.prisma.notification.update({
        where: { id: input.id },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  /**
   * 批量标记通知为已读
   */
  markManyAsRead: protectedProcedure
    .input(MarkManyReadInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.updateMany({
        where: {
          id: { in: input.ids },
          userId: ctx.user!.id,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  /**
   * 标记所有通知为已读
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return ctx.prisma.notification.updateMany({
        where: {
          userId: ctx.user!.id,
          isRead: false,
        },
        data: { isRead: true, readAt: new Date() },
      });
    }),

  /**
   * 删除通知
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 验证通知属于该用户
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '通知不存在',
        });
      }

      if (notification.userId !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权操作此通知',
        });
      }

      await ctx.prisma.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
