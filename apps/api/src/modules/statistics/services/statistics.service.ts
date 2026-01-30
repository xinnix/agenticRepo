import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { TicketStatus, Priority } from '@opencode/database';

/**
 * Statistics 服务
 * 提供工单数据统计功能
 */
@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取概览统计数据
   */
  async getOverview(params: { startDate?: Date; endDate?: Date } = {}) {
    const { startDate, endDate } = params;

    // 构建时间条件
    const timeFilter: any = {};
    if (startDate || endDate) {
      timeFilter.createdAt = {};
      if (startDate) {
        timeFilter.createdAt.gte = startDate;
      }
      if (endDate) {
        timeFilter.createdAt.lte = endDate;
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
      // 总工单数
      this.prisma.ticket.count({ where: timeFilter }),

      // 完成工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'COMPLETED' },
      }),

      // 关闭工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'CLOSED' },
      }),

      // 超时工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, isOverdue: true },
      }),

      // 平均评分
      this.prisma.ticket.aggregate({
        where: { ...timeFilter, rating: { not: null } },
        _avg: { rating: true },
      }),

      // 分类统计
      this.prisma.ticket.groupBy({
        by: ['categoryId'],
        where: timeFilter,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // 状态分布
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: timeFilter,
        _count: { id: true },
      }),
    ]);

    // 获取分类详情
    const categoryIds = categoryStats.map((s) => s.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryStatsWithNames = categoryStats.map((stat) => ({
      categoryId: stat.categoryId,
      categoryName: categories.find((c) => c.id === stat.categoryId)?.name || '未知',
      count: stat._count.id,
    }));

    // 计算完成率
    const completionRate = totalTickets > 0
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
  }

  /**
   * 获取分类统计
   */
  async getCategoryStats(params: {
    startDate: Date;
    endDate: Date;
  }) {
    const { startDate, endDate } = params;

    // 按分类统计工单
    const categoryStats = await this.prisma.ticket.groupBy({
      by: ['categoryId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      _avg: { rating: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // 获取分类详情
    const categoryIds = categoryStats.map((s) => s.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    return categoryStats.map((stat) => ({
      categoryId: stat.categoryId,
      categoryName: categories.find((c) => c.id === stat.categoryId)?.name || '未知',
      count: stat._count.id,
      avgRating: stat._avg.rating || 0,
    }));
  }

  /**
   * 获取趋势统计（按天/周/月）
   */
  async getTrendStats(params: {
    startDate: Date;
    endDate: Date;
    interval: 'day' | 'week' | 'month';
  }) {
    const { startDate, endDate, interval } = params;

    // 使用原生 SQL 进行时间分组统计
    const dateFormat = {
      day: 'YYYY-MM-DD',
      week: 'YYYY-"W"WW',
      month: 'YYYY-MM',
    }[interval];

    const tickets = await this.prisma.$queryRaw<Array<{
      date: string;
      count: bigint;
    }>>`
      SELECT
        TO_CHAR(${interval === 'day' ? "createdAt" : interval === 'week' ? "date_trunc('week', createdAt)" : "date_trunc('month', createdAt)"}, '${dateFormat}') as date,
        COUNT(*) as count
      FROM "tickets"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY date
      ORDER BY date
    `;

    return tickets.map((t) => ({
      date: t.date,
      count: Number(t.count),
    }));
  }

  /**
   * 获取处理人绩效统计
   */
  async getPerformanceStats(params: {
    startDate: Date;
    endDate: Date;
    limit?: number;
  }) {
    const { startDate, endDate, limit = 10 } = params;

    // 统计每个处理人的工单处理情况
    const handlers = await this.prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
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

    // 按处理人分组统计
    const handlerStats = new Map<string, {
      handlerId: string;
      handlerName: string;
      totalTickets: number;
      avgRating: number;
      avgCompletionTime: number; // 小时
    }>();

    for (const ticket of handlers) {
      const id = ticket.assignedId!;
      const name = [
        ticket.assignedTo.firstName,
        ticket.assignedTo.lastName,
        `(${ticket.assignedTo.username})`,
      ].filter(Boolean).join(' ');

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

    // 转为数组并排序
    return Array.from(handlerStats.values())
      .sort((a, b) => b.totalTickets - a.totalTickets)
      .slice(0, limit)
      .map((stat) => ({
        ...stat,
        avgRating: parseFloat(stat.avgRating.toFixed(2)),
        avgCompletionTime: parseFloat(stat.avgCompletionTime.toFixed(2)),
      }));
  }

  /**
   * 获取超时工单统计
   */
  async getOverdueStats() {
    const [
      totalOverdue,
      overdueByStatus,
      overdueByPriority,
      recentOverdue,
    ] = await Promise.all([
      // 总超时数
      this.prisma.ticket.count({
        where: { isOverdue: true },
      }),

      // 按状态统计超时
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { isOverdue: true },
        _count: { id: true },
      }),

      // 按优先级统计超时
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: { isOverdue: true },
        _count: { id: true },
      }),

      // 最近超时的工单
      this.prisma.ticket.findMany({
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
  }

  /**
   * 导出统计数据
   */
  async exportData(params: {
    startDate: Date;
    endDate: Date;
    format: 'excel' | 'csv';
  }) {
    const { startDate, endDate } = params;

    // 获取数据
    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        createdBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedTo: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 转换为导出格式
    const data = tickets.map((t) => ({
      工单编号: t.ticketNumber,
      标题: t.title,
      描述: t.description || '',
      状态: t.status,
      优先级: t.priority,
      分类: t.category.name,
      创建人: [t.createdBy.firstName, t.createdBy.lastName, `(${t.createdBy.username})`]
        .filter(Boolean)
        .join(' '),
      处理人: t.assignedTo
        ? [t.assignedTo.firstName, t.assignedTo.lastName, `(${t.assignedTo.username})`]
            .filter(Boolean)
            .join(' ')
        : '',
      创建时间: t.createdAt.toISOString(),
      截止时间: t.deadlineAt?.toISOString() || '',
      完成时间: t.completedAt?.toISOString() || '',
      关闭时间: t.closedAt?.toISOString() || '',
      评分: t.rating || '',
      反馈: t.feedback || '',
      超时: t.isOverdue ? '是' : '否',
    }));

    return {
      total: data.length,
      data,
      filename: `工单统计_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`,
    };
  }

  /**
   * 获取处理人工作台统计
   */
  async getHandlerStats(
    handlerId: string,
    params: { startDate?: Date; endDate?: Date } = {}
  ) {
    const { startDate, endDate } = params;

    // 构建时间条件
    const timeFilter: any = { assignedId: handlerId };
    if (startDate || endDate) {
      timeFilter.createdAt = {};
      if (startDate) {
        timeFilter.createdAt.gte = startDate;
      }
      if (endDate) {
        timeFilter.createdAt.lte = endDate;
      }
    }

    // 并行查询各项统计
    const [
      totalTickets,
      waitAcceptTickets,
      processingTickets,
      completedTickets,
      closedTickets,
      overdueTickets,
      todayCompletedTickets,
      avgRating,
      recentTickets,
      processingTicketsList,
    ] = await Promise.all([
      // 总工单数
      this.prisma.ticket.count({ where: timeFilter }),

      // 接单池工单数（等待处理）
      this.prisma.ticket.count({
        where: { status: 'WAIT_ASSIGN' },
      }),

      // 处理中工单数（待处理）
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'PROCESSING' },
      }),

      // 完成工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'COMPLETED' },
      }),

      // 关闭工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'CLOSED' },
      }),

      // 超时工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, isOverdue: true },
      }),

      // 今日完成工单数
      this.prisma.ticket.count({
        where: {
          ...timeFilter,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // 平均评分
      this.prisma.ticket.aggregate({
        where: { ...timeFilter, rating: { not: null } },
        _avg: { rating: true },
      }),

      // 最近工单
      this.prisma.ticket.findMany({
        where: timeFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
      }),

      // 处理中工单列表（用于 dashboard 显示）
      this.prisma.ticket.findMany({
        where: { ...timeFilter, status: 'PROCESSING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    // 获取处理人信息
    const handler = await this.prisma.user.findUnique({
      where: { id: handlerId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    // 返回小程序期望的格式
    return {
      // 接单池数量（待接单的工单）
      waitAcceptCount: waitAcceptTickets,
      // 处理中数量
      processingCount: processingTickets,
      // 已完成数量
      totalCompleted: completedTickets,
      // 今日完成
      todayCompleted: todayCompletedTickets,
      // 平均评分
      averageRating: avgRating._avg.rating || 0,
      // 处理中工单列表
      processingTickets: processingTicketsList,
    };
  }

  /**
   * 获取用户工单统计
   */
  async getUserStats(
    userId: string,
    params: { startDate?: Date; endDate?: Date } = {}
  ) {
    const { startDate, endDate } = params;

    // 构建时间条件
    const timeFilter: any = { createdById: userId };
    if (startDate || endDate) {
      timeFilter.createdAt = {};
      if (startDate) {
        timeFilter.createdAt.gte = startDate;
      }
      if (endDate) {
        timeFilter.createdAt.lte = endDate;
      }
    }

    // 并行查询各项统计
    const [
      totalTickets,
      waitAssignTickets,
      processingTickets,
      completedTickets,
      closedTickets,
      avgRating,
      recentTickets,
    ] = await Promise.all([
      // 总工单数
      this.prisma.ticket.count({ where: timeFilter }),

      // 等待处理工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'WAIT_ASSIGN' },
      }),

      // 处理中工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'PROCESSING' },
      }),

      // 完成工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'COMPLETED' },
      }),

      // 关闭工单数
      this.prisma.ticket.count({
        where: { ...timeFilter, status: 'CLOSED' },
      }),

      // 平均评分
      this.prisma.ticket.aggregate({
        where: { ...timeFilter, rating: { not: null } },
        _avg: { rating: true },
      }),

      // 最近工单
      this.prisma.ticket.findMany({
        where: timeFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          presetArea: { select: { id: true, name: true, code: true } },
          assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      user: user
        ? {
            id: user.id,
            name: [user.firstName, user.lastName, `(${user.username})`]
              .filter(Boolean)
              .join(' '),
          }
        : null,
      summary: {
        totalTickets,
        waitAssignTickets,
        processingTickets,
        completedTickets,
        closedTickets,
        avgRating: avgRating._avg.rating || 0,
        completionRate: totalTickets > 0
          ? (((completedTickets + closedTickets) / totalTickets) * 100).toFixed(2)
          : '0.00',
      },
      recentTickets,
    };
  }
}
