import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  router,
  protectedProcedure,
  publicProcedure,
  permissionProcedure,
} from '../../../trpc/trpc';
import type { TicketStatus, Priority } from '@opencode/database';

/**
 * Ticket tRPC Router
 * 提供类型安全的工单管理 API
 */

// 输入 Schema 定义
const TicketQueryInput = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  status: z.string().optional(),
  priority: z.enum(['NORMAL', 'URGENT']).optional(),
  categoryId: z.string().optional(),
  createdById: z.string().optional(),
  assignedId: z.string().optional(),
  isOverdue: z.boolean().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const TicketCreateInput = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().optional(),
  categoryId: z.string(),
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
  locationType: z.enum(['MANUAL', 'PRESET']).default('MANUAL'),
  location: z.string().nullable().optional(),
  presetAreaId: z.string().nullable().optional(),
  attachmentIds: z.array(z.string()).optional(),
});

const TicketUpdateInput = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  priority: z.enum(['NORMAL', 'URGENT']).optional(),
  locationType: z.enum(['MANUAL', 'PRESET']).optional(),
  location: z.string().nullable().optional(),
  presetAreaId: z.string().nullable().optional(),
  status: z.string().optional(),
});

const TicketAssignInput = z.object({
  assignedId: z.string(),
});

const TicketCompleteInput = z.object({
  attachmentIds: z.array(z.string()).optional(),
  remark: z.string().optional(),
});

const TicketRateInput = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

const TicketCloseInput = z.object({
  reason: z.string().optional(),
});

const TicketCommentInput = z.object({
  content: z.string().optional(),
  attachmentIds: z.array(z.string()).optional(),
  attachmentUrls: z.array(z.string()).optional(),
});

const BatchStatusInput = z.object({
  ticketIds: z.array(z.string()),
  status: z.string(),
  reason: z.string().optional(),
});

export const ticketRouter = router({
  // ============================================
  // CRUD 操作
  // ============================================

  /**
   * 获取工单列表（分页）
   */
  getMany: protectedProcedure
    .input(TicketQueryInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10, ...filters } = input;

      // 构建查询条件
      const where: any = {};

      if (filters.status) {
        where.status = filters.status as TicketStatus;
      }
      if (filters.priority) {
        where.priority = filters.priority as Priority;
      }
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      if (filters.createdById) {
        where.createdById = filters.createdById;
      }
      if (filters.assignedId !== undefined) {
        where.assignedId = filters.assignedId || null;
      }
      if (filters.isOverdue !== undefined) {
        where.isOverdue = filters.isOverdue;
      }
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { ticketNumber: { contains: filters.search } },
        ];
      }
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.createdAt.lte = new Date(filters.endDate);
        }
      }

      // 查询总数和数据
      const [total, data] = await Promise.all([
        ctx.prisma.ticket.count({ where }),
        ctx.prisma.ticket.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                realName: true,
                firstName: true,
                lastName: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                username: true,
                realName: true,
                firstName: true,
                lastName: true,
              },
            },
            category: { select: { id: true, name: true } },
            presetArea: { select: { id: true, name: true, departmentId: true } },
            attachments: true,
          },
        }),
      ]);

      // Return format expected by dataProvider: { items, total, page, pageSize, totalPages }
      return {
        items: data,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * 获取单个工单详情
   */
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
        include: {
          createdBy: true,
          assignedTo: true,
          category: true,
          presetArea: { select: { id: true, name: true, departmentId: true } },
          attachments: { orderBy: { createdAt: 'asc' } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 权限校验
      const isSuperAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'super_admin');
      const isDeptAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'dept_admin');
      const isCreator = ticket.createdById === ctx.user?.id;
      const isAssignee = ticket.assignedId === ctx.user?.id;

      if (!isSuperAdmin && !isDeptAdmin && !isCreator && !isAssignee) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '无权查看此工单',
        });
      }

      return ticket;
    }),

  /**
   * 创建工单
   */
  create: permissionProcedure('ticket', 'create')
    .input(TicketCreateInput)
    .mutation(async ({ ctx, input }) => {
      // 生成工单编号
      const ticketNumber = await generateTicketNumber(ctx.prisma);

      // 计算截止时间
      const deadlineHours = input.priority === 'URGENT' ? 4 : 24;
      const deadlineAt = new Date();
      deadlineAt.setHours(deadlineAt.getHours() + deadlineHours);

      // 创建工单
      const ticket = await ctx.prisma.ticket.create({
        data: {
          ticketNumber,
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          priority: input.priority,
          locationType: input.locationType || 'MANUAL',
          location: input.location,
          presetAreaId: input.presetAreaId,
          createdById: ctx.user!.id,
          deadlineAt,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          category: { select: { id: true, name: true } },
          presetArea: {
            select: {
              id: true,
              name: true,
              departmentId: true,
            },
          },
          attachments: true,
        },
      });

      // 如果使用了预设区域，通知该区域所属部门的所有办事员
      if (ticket.locationType === 'PRESET' && ticket.presetArea?.departmentId) {
        // 获取该部门下的所有办事员
        const handlers = await ctx.prisma.user.findMany({
          where: {
            departmentId: ticket.presetArea.departmentId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        // 为所有办事员创建通知
        await Promise.all(
          handlers.map((handler) =>
            ctx.prisma.notification.create({
              data: {
                type: 'TICKET_ASSIGNED',
                userId: handler.id,
                ticketId: ticket.id,
                title: '新工单待处理',
                content: `您所在部门管辖的区域有新工单 ${ticket.ticketNumber}: ${ticket.title}`,
              },
            }),
          ),
        );
      }

      return ticket;
    }),

  /**
   * 更新工单
   */
  update: permissionProcedure('ticket', 'update')
    .input(z.object({
      id: z.string(),
      data: TicketUpdateInput,
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 权限校验
      const isSuperAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'super_admin');
      const isDeptAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'dept_admin');

      if (ticket.createdById !== ctx.user?.id && !isSuperAdmin && !isDeptAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有创建者可以修改工单',
        });
      }

      // 更新工单
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          ...input.data,
          ...(input.data.status === 'COMPLETED' && { completedAt: new Date() }),
          ...(input.data.status === 'CLOSED' && { closedAt: new Date() }),
        },
      });

      // 如果状态发生变化，记录历史
      if (input.data.status && input.data.status !== ticket.status) {
        await ctx.prisma.statusHistory.create({
          data: {
            ticketId: input.id,
            fromStatus: ticket.status,
            toStatus: input.data.status as TicketStatus,
            userId: ctx.user!.id,
          },
        });
      }

      return updated;
    }),

  /**
   * 删除工单
   */
  delete: permissionProcedure('ticket', 'delete')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 权限校验
      const isSuperAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'super_admin');
      const isDeptAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'dept_admin');

      if (ticket.createdById !== ctx.user?.id && !isSuperAdmin && !isDeptAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有创建者可以删除工单',
        });
      }

      // 只能删除特定状态的工单
      if (ticket.status !== 'WAIT_ASSIGN' && ticket.status !== 'CLOSED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只能删除待指派或已关闭的工单',
        });
      }

      await ctx.prisma.ticket.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * 批量删除工单
   */
  deleteMany: permissionProcedure('ticket', 'delete')
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const isSuperAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'super_admin');
      const isDeptAdmin = ctx.user?.roles?.some((r: any) => r.slug === 'dept_admin');

      if (!isSuperAdmin && !isDeptAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有管理员可以批量删除工单',
        });
      }

      const result = await ctx.prisma.ticket.deleteMany({
        where: {
          id: { in: input.ids },
          status: { in: ['WAIT_ASSIGN', 'CLOSED'] },
        },
      });

      return { count: result.count };
    }),

  // ============================================
  // 状态操作
  // ============================================

  /**
   * 指派工单
   */
  assign: permissionProcedure('ticket', 'assign')
    .input(z.object({
      id: z.string(),
      data: TicketAssignInput,
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 状态校验
      if (!canTransition(ticket.status, 'PROCESSING')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '当前状态不允许指派',
        });
      }

      // 更新工单
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          assignedId: input.data.assignedId,
          status: 'PROCESSING',
        },
      });

      // 记录状态历史
      await ctx.prisma.statusHistory.create({
        data: {
          ticketId: input.id,
          fromStatus: ticket.status,
          toStatus: 'PROCESSING',
          userId: ctx.user!.id,
          remark: '指派给处理人',
        },
      });

      return updated;
    }),

  /**
   * 接单
   */
  accept: permissionProcedure('ticket', 'accept')
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 状态校验：只有 WAIT_ASSIGN 和 PROCESSING 状态可以接单
      if (ticket.status !== 'WAIT_ASSIGN' && ticket.status !== 'PROCESSING') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '当前状态不允许接单',
        });
      }

      // 如果已经有处理人，检查是否为当前用户
      if (ticket.assignedId && ticket.assignedId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '该工单已被其他人接单',
        });
      }

      // 更新工单：设置处理人并更新状态为 PROCESSING
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          assignedId: ctx.user!.id,
          status: 'PROCESSING',
        },
      });

      // 记录状态历史
      await ctx.prisma.statusHistory.create({
        data: {
          ticketId: input.id,
          fromStatus: ticket.status,
          toStatus: 'PROCESSING',
          userId: ctx.user!.id,
          remark: ticket.status === 'WAIT_ASSIGN' ? '接受工单' : '继续处理工单',
        },
      });

      return updated;
    }),

  /**
   * 完成工单
   */
  complete: permissionProcedure('ticket', 'complete')
    .input(z.object({
      id: z.string(),
      data: TicketCompleteInput,
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 只有处理人可以完成工单
      if (ticket.assignedId !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有处理人可以完成工单',
        });
      }

      // 状态校验
      if (!canTransition(ticket.status, 'COMPLETED')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '当前状态不允许完成',
        });
      }

      // 更新工单
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 如果有处理说明或附件，创建处理人评论
      if (input.data.remark || (input.data.attachmentIds && input.data.attachmentIds.length > 0)) {
        // 验证附件是否存在
        let validAttachmentIds: string[] = [];
        if (input.data.attachmentIds && input.data.attachmentIds.length > 0) {
          const existingAttachments = await ctx.prisma.attachment.findMany({
            where: {
              id: { in: input.data.attachmentIds },
            },
            select: { id: true },
          });
          validAttachmentIds = existingAttachments.map(a => a.id);

          // 更新附件的工单关联
          if (validAttachmentIds.length > 0) {
            await ctx.prisma.attachment.updateMany({
              where: { id: { in: validAttachmentIds } },
              data: { ticketId: input.id },
            });
          }
        }

        // 创建评论
        await ctx.prisma.comment.create({
          data: {
            ticketId: input.id,
            userId: ctx.user!.id,
            content: input.data.remark || '工单已完成',
            commentType: 'HANDLER',
            // 关联附件（只关联存在的）
            ...(validAttachmentIds.length > 0 && {
              attachments: {
                connect: validAttachmentIds.map(id => ({ id })),
              },
            }),
          },
        });
      }

      // 记录状态历史
      await ctx.prisma.statusHistory.create({
        data: {
          ticketId: input.id,
          fromStatus: ticket.status,
          toStatus: 'COMPLETED',
          userId: ctx.user!.id,
          remark: input.data.remark || '工单完成',
        },
      });

      return updated;
    }),

  /**
   * 关闭工单
   */
  close: permissionProcedure('ticket', 'close')
    .input(z.object({
      id: z.string(),
      data: TicketCloseInput.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 状态校验
      if (!canTransition(ticket.status, 'CLOSED')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '当前状态不允许关闭',
        });
      }

      // 更新工单
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // 记录状态历史
      await ctx.prisma.statusHistory.create({
        data: {
          ticketId: input.id,
          fromStatus: ticket.status,
          toStatus: 'CLOSED',
          userId: ctx.user!.id,
          remark: input.data?.reason || '工单关闭',
        },
      });

      return updated;
    }),

  /**
   * 评价工单
   */
  rate: permissionProcedure('ticket', 'rate')
    .input(z.object({
      id: z.string(),
      data: TicketRateInput,
    }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.ticket.findUnique({
        where: { id: input.id },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '工单不存在',
        });
      }

      // 只有创建者可以评价
      if (ticket.createdById !== ctx.user?.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有创建者可以评价工单',
        });
      }

      // 状态校验
      if (!canTransition(ticket.status, 'CLOSED')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '当前状态不允许评价',
        });
      }

      // 更新工单
      const updated = await ctx.prisma.ticket.update({
        where: { id: input.id },
        data: {
          rating: input.data.rating,
          feedback: input.data.feedback,
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // 记录状态历史
      await ctx.prisma.statusHistory.create({
        data: {
          ticketId: input.id,
          fromStatus: ticket.status,
          toStatus: 'CLOSED',
          userId: ctx.user!.id,
          remark: `用户评价: ${input.data.rating}星`,
        },
      });

      return updated;
    }),

  // ============================================
  // 状态相关查询
  // ============================================

  /**
   * 获取状态可执行的操作列表
   */
  getAvailableActions: publicProcedure
    .input(z.object({ status: z.string() }))
    .query(({ input }) => {
      return getAvailableActionsForStatus(input.status as TicketStatus);
    }),

  /**
   * 获取所有可用状态
   */
  getAllStates: publicProcedure
    .query(() => {
      return ['WAIT_ASSIGN', 'PROCESSING', 'COMPLETED', 'CLOSED'];
    }),

  // ============================================
  // 批量操作
  // ============================================

  /**
   * 批量更新工单状态
   */
  batchUpdateStatus: permissionProcedure('ticket', 'update')
    .input(BatchStatusInput)
    .mutation(async ({ ctx, input }) => {
      const results = [];
      const errors = [];

      for (const ticketId of input.ticketIds) {
        try {
          const ticket = await ctx.prisma.ticket.findUnique({
            where: { id: ticketId },
          });

          if (!ticket) {
            errors.push({ ticketId, error: '工单不存在' });
            continue;
          }

          if (!canTransition(ticket.status, input.status as TicketStatus)) {
            errors.push({ ticketId, error: '状态流转不合法' });
            continue;
          }

          await ctx.prisma.ticket.update({
            where: { id: ticketId },
            data: {
              status: input.status as TicketStatus,
              ...(input.status === 'COMPLETED' && { completedAt: new Date() }),
              ...(input.status === 'CLOSED' && { closedAt: new Date() }),
            },
          });

          await ctx.prisma.statusHistory.create({
            data: {
              ticketId,
              fromStatus: ticket.status,
              toStatus: input.status as TicketStatus,
              userId: ctx.user!.id,
              remark: input.reason,
            },
          });

          results.push({ ticketId, success: true });
        } catch (error) {
          errors.push({ ticketId, error: (error as Error).message });
        }
      }

      return {
        total: input.ticketIds.length,
        success: results.length,
        failed: errors.length,
        errors,
      };
    }),
});

// ============================================
// 辅助函数
// ============================================

/**
 * 状态流转规则
 */
const TICKET_STATE_TRANSITIONS = {
  WAIT_ASSIGN: ['PROCESSING', 'CLOSED'], // 可以直接进入处理中或关闭
  PROCESSING: ['COMPLETED', 'WAIT_ASSIGN', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
} as const;

/**
 * 检查状态流转是否合法
 */
function canTransition(fromStatus: TicketStatus, toStatus: TicketStatus): boolean {
  const allowedTransitions = TICKET_STATE_TRANSITIONS[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

/**
 * 获取状态可执行的操作
 */
function getAvailableActionsForStatus(status: TicketStatus): string[] {
  const actions = {
    WAIT_ASSIGN: ['assign', 'accept', 'close'],
    PROCESSING: ['complete', 'reassign', 'close'],
    COMPLETED: ['close'],
    CLOSED: [],
  };

  return (actions[status as keyof typeof actions] as string[]) || [];
}

/**
 * 生成工单编号：YYYYMMDD + 4位自增
 */
async function generateTicketNumber(prisma: any): Promise<string> {
  const today = new Date();
  const datePrefix = formatDatePrefix(today);

  // 查询今天最大的序号
  const latestTicket = await prisma.ticket.findFirst({
    where: {
      ticketNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      ticketNumber: 'desc',
    },
    select: {
      ticketNumber: true,
    },
  });

  let sequence = 1;
  if (latestTicket) {
    const currentSequence = parseInt(latestTicket.ticketNumber.slice(-4));
    if (!isNaN(currentSequence)) {
      sequence = currentSequence + 1;
    }
  }

  return `${datePrefix}${sequence.toString().padStart(4, '0')}`;
}

/**
 * 生成日期前缀：YYYYMMDD
 */
function formatDatePrefix(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}${month}${day}`;
}
