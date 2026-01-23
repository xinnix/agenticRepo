import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { NotificationType } from '@opencode/database';

/**
 * Notification 服务
 * 处理工单通知的创建和发送
 */
@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建通知
   */
  async create(data: {
    type: NotificationType;
    userId: string;
    ticketId: string;
    title: string;
    content: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        ticketId: data.ticketId,
        title: data.title,
        content: data.content,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * 获取用户通知列表
   */
  async getMany(params: {
    userId: string;
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
  }) {
    const { page = 1, limit = 20, ...filters } = params;

    const where: any = { userId: filters.userId };
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const [total, data] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
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
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(id: string, userId: string) {
    // 验证通知属于该用户
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('通知不存在');
    }

    if (notification.userId !== userId) {
      throw new Error('无权操作此通知');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 批量标记通知为已读
   */
  async markManyAsRead(ids: string[], userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 删除通知
   */
  async delete(id: string, userId: string) {
    // 验证通知属于该用户
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('通知不存在');
    }

    if (notification.userId !== userId) {
      throw new Error('无权操作此通知');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true };
  }

  // ============================================
  // 工单事件通知
  // ============================================

  /**
   * 工单被指派通知
   */
  async notifyTicketAssigned(ticketId: string, assignedUserId: string, assignerId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        title: true,
        createdBy: { select: { username: true } },
      },
    });

    if (!ticket) return;

    return this.create({
      type: 'TICKET_ASSIGNED',
      userId: assignedUserId,
      ticketId,
      title: '工单已指派给您',
      content: `工单 ${ticket.ticketNumber} 已指派给您处理`,
    });
  }

  /**
   * 工单被接单通知
   */
  async notifyTicketAccepted(ticketId: string, handlerId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        title: true,
        createdById: true,
        assignedTo: { select: { username: true } },
      },
    });

    if (!ticket) return;

    return this.create({
      type: 'TICKET_ACCEPTED',
      userId: ticket.createdById,
      ticketId,
      title: '工单已被接受',
      content: `工单 ${ticket.ticketNumber} 已被处理人接受`,
    });
  }

  /**
   * 工单完成通知
   */
  async notifyTicketCompleted(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        title: true,
        createdById: true,
        assignedTo: { select: { username: true } },
      },
    });

    if (!ticket) return;

    return this.create({
      type: 'TICKET_COMPLETED',
      userId: ticket.createdById,
      ticketId,
      title: '工单已完成',
      content: `工单 ${ticket.ticketNumber} 已完成，请确认`,
    });
  }

  /**
   * 工单超时通知
   */
  async notifyTicketOverdue(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        title: true,
        assignedId: true,
        assignedTo: { select: { username: true } },
      },
    });

    if (!ticket || !ticket.assignedId) return;

    return this.create({
      type: 'TICKET_OVERDUE',
      userId: ticket.assignedId,
      ticketId,
      title: '工单已超时',
      content: `工单 ${ticket.ticketNumber} 已超过截止时间`,
    });
  }

  /**
   * 工单评论通知
   */
  async notifyTicketComment(ticketId: string, commenterId: string, commenterName: string, commentContent: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        createdById: true,
        assignedId: true,
      },
    });

    if (!ticket) return;

    const shortContent = commentContent.substring(0, 50);
    const message = `${commenterName} 评论了工单 ${ticket.ticketNumber}: ${shortContent}`;

    // 通知创建者（如果评论者不是创建者）
    if (ticket.createdById !== commenterId) {
      await this.create({
        type: 'TICKET_COMMENT',
        userId: ticket.createdById,
        ticketId,
        title: '收到新评论',
        content: message,
      });
    }

    // 通知处理人（如果评论者不是处理人且处理人不是创建者）
    if (
      ticket.assignedId &&
      ticket.assignedId !== commenterId &&
      ticket.assignedId !== ticket.createdById
    ) {
      await this.create({
        type: 'TICKET_COMMENT',
        userId: ticket.assignedId,
        ticketId,
        title: '收到新评论',
        content: message,
      });
    }
  }

  /**
   * 工单评价通知
   */
  async notifyTicketRated(ticketId: string, rating: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ticketNumber: true,
        assignedId: true,
        assignedTo: { select: { username: true } },
      },
    });

    if (!ticket || !ticket.assignedId) return;

    return this.create({
      type: 'TICKET_RATED',
      userId: ticket.assignedId,
      ticketId,
      title: '收到工单评价',
      content: `工单 ${ticket.ticketNumber} 收到 ${rating} 星评价`,
    });
  }

  /**
   * 工单创建通知 - 通知部门所有办事员
   * 当工单使用预设区域时，根据区域所属部门通知所有办事员
   */
  async notifyDepartmentHandlers(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        presetArea: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) return;

    // 只有使用预设区域的工单才通知部门
    const presetArea = ticket.presetArea as { departmentId: string | null } | null | undefined;
    if (ticket.locationType !== 'PRESET' || !presetArea?.departmentId) {
      return;
    }

    // 获取该部门下的所有办事员
    const handlers = await this.prisma.user.findMany({
      where: {
        departmentId: presetArea.departmentId,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });

    if (handlers.length === 0) {
      return;
    }

    // 为所有办事员创建通知
    const notifications = await Promise.all(
      handlers.map((handler) =>
        this.create({
          type: 'TICKET_ASSIGNED',
          userId: handler.id,
          ticketId,
          title: '新工单待处理',
          content: `您所在部门管辖的区域有新工单 ${ticket.ticketNumber}: ${ticket.title}`,
        }),
      ),
    );

    return notifications;
  }
}
