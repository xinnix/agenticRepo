import { z } from 'zod';
import {
  router,
  protectedProcedure,
  publicProcedure,
  permissionProcedure,
} from '../../../trpc/trpc';

/**
 * Statistics tRPC Router
 * 提供类型安全的统计数据 API
 */

// 输入 Schema 定义
const DateRangeInput = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const TrendStatsInput = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  interval: z.enum(['day', 'week', 'month']).default('day'),
});

const PerformanceStatsInput = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  limit: z.number().optional().default(10),
});

export const statisticsRouter = router({
  /**
   * 获取概览统计
   */
  getOverview: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      // 构建时间条件
      const timeFilter: any = {};
      if (startDate || endDate) {
        timeFilter.createdAt = {};
        if (startDate) {
          timeFilter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          timeFilter.createdAt.lte = new Date(endDate);
        }
      }

      // 并行查询各项统计
      const [
        totalTickets,
        completedTickets,
        closedTickets,
        overdueTickets,
        avgRating,
        categoryStats,
        statusDistribution,
      ] = await Promise.all([
        ctx.prisma.ticket.count({ where: timeFilter }),
        ctx.prisma.ticket.count({
          where: { ...timeFilter, status: 'COMPLETED' },
        }),
        ctx.prisma.ticket.count({
          where: { ...timeFilter, status: 'CLOSED' },
        }),
        ctx.prisma.ticket.count({
          where: { ...timeFilter, isOverdue: true },
        }),
        ctx.prisma.ticket.aggregate({
          where: { ...timeFilter, rating: { not: null } },
          _avg: { rating: true },
        }),
        ctx.prisma.ticket.groupBy({
          by: ['categoryId'],
          where: timeFilter,
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        }),
        ctx.prisma.ticket.groupBy({
          by: ['status'],
          where: timeFilter,
          _count: { id: true },
        }),
      ]);

      // 获取分类详情
      const categoryIds = categoryStats.map((s) => s.categoryId);
      const categories = await ctx.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      const categoryStatsWithNames = categoryStats.map((stat) => ({
        categoryId: stat.categoryId,
        categoryName:
          categories.find((c) => c.id === stat.categoryId)?.name || '未知',
        count: stat._count.id,
      }));

      // 计算完成率
      const completionRate =
        totalTickets > 0
          ? ((completedTickets + closedTickets) / totalTickets) * 100
          : 0;

      return {
        summary: {
          totalTickets,
          completedTickets,
          closedTickets,
          overdueTickets,
          avgRating: avgRating._avg.rating || 0,
          completionRate: parseFloat(completionRate.toFixed(2)),
        },
        categoryStats: categoryStatsWithNames,
        statusDistribution: statusDistribution.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
      };
    }),

  /**
   * 获取分类统计
   */
  getCategoryStats: permissionProcedure('statistics', 'view')
    .input(DateRangeInput)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate } = input;

      const categoryStats = await ctx.prisma.ticket.groupBy({
        by: ['categoryId'],
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        _count: { id: true },
        _avg: { rating: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const categoryIds = categoryStats.map((s) => s.categoryId);
      const categories = await ctx.prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true },
      });

      return categoryStats.map((stat) => ({
        categoryId: stat.categoryId,
        categoryName:
          categories.find((c) => c.id === stat.categoryId)?.name || '未知',
        count: stat._count.id,
        avgRating: stat._avg.rating || 0,
      }));
    }),

  /**
   * 获取趋势统计
   */
  getTrendStats: permissionProcedure('statistics', 'view')
    .input(TrendStatsInput)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, interval } = input;

      // 简化的趋势统计（按天分组）
      const dateFormat =
        interval === 'day'
          ? 'YYYY-MM-DD'
          : interval === 'week'
          ? 'YYYY-"W"WW'
          : 'YYYY-MM';

      const tickets = await ctx.prisma.$queryRaw<
        Array<{ date: string; count: bigint }>
      >`
        SELECT
          TO_CHAR("createdAt", '${dateFormat}') as date,
          COUNT(*) as count
        FROM "tickets"
        WHERE "createdAt" >= ${new Date(startDate)}
          AND "createdAt" <= ${new Date(endDate)}
        GROUP BY date
        ORDER BY date
      `;

      return tickets.map((t) => ({
        date: t.date,
        count: Number(t.count),
      }));
    }),

  /**
   * 获取处理人绩效统计
   */
  getPerformanceStats: permissionProcedure('statistics', 'view')
    .input(PerformanceStatsInput)
    .query(async ({ ctx, input }) => {
      const { startDate, endDate, limit = 10 } = input;

      const handlers = await ctx.prisma.ticket.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          assignedId: { not: null },
          status: { in: ['COMPLETED', 'CLOSED'] },
        },
        select: {
          assignedId: true,
          assignedTo: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          rating: true,
          completedAt: true,
          createdAt: true,
        },
      });

      const handlerStats = new Map<
        string,
        {
          handlerId: string;
          handlerName: string;
          totalTickets: number;
          avgRating: number;
          avgCompletionTime: number;
        }
      >();

      for (const ticket of handlers) {
        const id = ticket.assignedId!;
        const name = [
          ticket.assignedTo.firstName,
          ticket.assignedTo.lastName,
          `(${ticket.assignedTo.username})`,
        ]
          .filter(Boolean)
          .join(' ');

        if (!handlerStats.has(id)) {
          handlerStats.set(id, {
            handlerId: id,
            handlerName: name,
            totalTickets: 0,
            avgRating: 0,
            avgCompletionTime: 0,
          });
        }

        const stat = handlerStats.get(id)!;
        stat.totalTickets++;

        if (ticket.rating) {
          stat.avgRating =
            (stat.avgRating * (stat.totalTickets - 1) + ticket.rating) /
            stat.totalTickets;
        }

        if (ticket.completedAt) {
          const hours =
            (ticket.completedAt.getTime() - ticket.createdAt.getTime()) /
            (1000 * 60 * 60);
          stat.avgCompletionTime =
            (stat.avgCompletionTime * (stat.totalTickets - 1) + hours) /
            stat.totalTickets;
        }
      }

      return Array.from(handlerStats.values())
        .sort((a, b) => b.totalTickets - a.totalTickets)
        .slice(0, limit)
        .map((stat) => ({
          ...stat,
          avgRating: parseFloat(stat.avgRating.toFixed(2)),
          avgCompletionTime: parseFloat(stat.avgCompletionTime.toFixed(2)),
        }));
    }),

  /**
   * 获取超时工单统计
   */
  getOverdueStats: permissionProcedure('statistics', 'view')
    .query(async ({ ctx }) => {
      const [
        totalOverdue,
        overdueByStatus,
        overdueByPriority,
        recentOverdue,
      ] = await Promise.all([
        ctx.prisma.ticket.count({
          where: { isOverdue: true },
        }),
        ctx.prisma.ticket.groupBy({
          by: ['status'],
          where: { isOverdue: true },
          _count: { id: true },
        }),
        ctx.prisma.ticket.groupBy({
          by: ['priority'],
          where: { isOverdue: true },
          _count: { id: true },
        }),
        ctx.prisma.ticket.findMany({
          where: { isOverdue: true },
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            deadlineAt: true,
            assignedTo: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { deadlineAt: 'asc' },
          take: 10,
        }),
      ]);

      return {
        totalOverdue,
        overdueByStatus: overdueByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        overdueByPriority: overdueByPriority.map((s) => ({
          priority: s.priority,
          count: s._count.id,
        })),
        recentOverdue: recentOverdue.map((t) => ({
          ...t,
          assignedTo: t.assignedTo
            ? {
                id: t.assignedTo.id,
                name: [
                  t.assignedTo.firstName,
                  t.assignedTo.lastName,
                  `(${t.assignedTo.username})`,
                ]
                  .filter(Boolean)
                  .join(' '),
              }
            : null,
        })),
      };
    }),
});
