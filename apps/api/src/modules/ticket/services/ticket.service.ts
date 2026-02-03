import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TicketNumberService } from './ticket-number.service';
import { TicketDeadlineService } from './ticket-deadline.service';
import { TICKET_STATE_TRANSITIONS } from '../../../shared/services/state-machine.service';
import type { TicketStatus } from '@opencode/database';

@Injectable()
export class TicketService {
  constructor(
    private prisma: PrismaService,
    private numberService: TicketNumberService,
    private deadlineService: TicketDeadlineService,
  ) {
    console.log('[TicketService] Constructor called');
    console.log('[TicketService] prisma:', !!this.prisma);
    console.log('[TicketService] numberService:', !!this.numberService);
    console.log('[TicketService] deadlineService:', !!this.deadlineService);
  }

  /**
   * 创建工单
   * 兼容前端提交的数据格式（前端可能不传 title 和 priority）
   */
  async create(data: {
    title?: string;
    description?: string;
    categoryId: string;
    priority?: 'NORMAL' | 'URGENT';
    locationType?: 'MANUAL' | 'PRESET';
    location?: string | null;
    presetAreaId?: string | null;
    createdById: string;
    attachmentIds?: string[];
    attachmentUrls?: string[]; // 直接上传的OSS URLs
    // 前端额外字段（忽略）
    isAnonymous?: boolean;
    submitterName?: string;
    submitterPhone?: string;
  }) {
    // 生成工单编号
    const ticketNumber = await this.numberService.generateNumber();

    // 如果没有传 title，使用 description 的前20个字符作为 title
    const title = data.title || (data.description?.substring(0, 20) || '新工单');

    // 如果没有传 priority，默认为 NORMAL
    const priority: 'NORMAL' | 'URGENT' = data.priority || 'NORMAL';

    // 计算截止时间
    const deadlineAt = await this.deadlineService.calculateDeadline(priority);

    // 创建工单
    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description: data.description,
        categoryId: data.categoryId,
        priority,
        locationType: data.locationType || (data.presetAreaId ? 'PRESET' : 'MANUAL'),
        location: data.location,
        presetAreaId: data.presetAreaId,
        createdById: data.createdById,
        deadlineAt,
        submitterName: data.submitterName,
        submitterPhone: data.submitterPhone,
      },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    // 处理附件
    const attachments = [];

    // 1. 处理通过后端上传的附件ID
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await this.prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds } },
        data: { ticketId: ticket.id },
      });
      attachments.push(...await this.prisma.attachment.findMany({
        where: { id: { in: data.attachmentIds } }
      }));
    }

    // 2. 处理直接上传的OSS URLs
    if (data.attachmentUrls && data.attachmentUrls.length > 0) {
      for (const url of data.attachmentUrls) {
        const attachment = await this.prisma.attachment.create({
          data: {
            ticketId: ticket.id,
            url,
            fileName: this.extractFileNameFromUrl(url),
            fileSize: 0, // 客户端上传时未传递文件大小
            mimeType: this.getMimeTypeFromUrl(url),
            type: this.getFileTypeFromUrl(url),
            uploadedById: data.createdById,
          },
        });
        attachments.push(attachment);
      }
    }

    // 重新获取包含附件的工单
    const ticketWithAttachments = await this.prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
        category: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    return ticketWithAttachments;
  }

  /**
   * 获取工单列表
   */
  async getMany(params: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    priority?: 'NORMAL' | 'URGENT';
    categoryId?: string;
    createdById?: string;
    assignedId?: string;
    isOverdue?: boolean;
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 10, ...filters } = params;

    // 构建查询条件
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
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
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // 查询总数和数据
    const [total, items] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, username: true, firstName: true, lastName: true } },
          category: { select: { id: true, name: true } },
          presetArea: { select: { id: true, name: true, code: true } },
          attachments: true,
        },
      }),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个工单
   */
  async getOne(id: string, currentUser: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
        category: true,
        presetArea: { select: { id: true, name: true, code: true } },
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true, wxNickname: true, wxAvatarUrl: true, avatar: true } },
            attachments: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 权限校验
    this.canViewTicket(ticket, currentUser);

    return ticket;
  }

  /**
   * 更新工单
   */
  async update(
    id: string,
    data: any,
    currentUser: any,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 权限校验：只有创建者可以修改基本信息
    if (ticket.createdById !== currentUser.id && !this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有创建者可以修改工单');
    }

    // 状态流转校验
    if (data.status && data.status !== ticket.status) {
      this.validateTransition(ticket.status, data.status);
    }

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        // 状态变更时记录时间
        ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
        ...(data.status === 'CLOSED' && { closedAt: new Date() }),
      },
    });

    // 如果状态发生变化，记录历史
    if (data.status && data.status !== ticket.status) {
      await this.recordStatusHistory(id, ticket.status, data.status, currentUser.id);
    }

    return this.getOne(id, currentUser);
  }

  /**
   * 删除工单
   */
  async delete(id: string, currentUser: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 只有创建者和管理员可以删除
    if (ticket.createdById !== currentUser.id && !this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有创建者可以删除工单');
    }

    // 只能删除特定状态的工单
    if (ticket.status !== 'WAIT_ASSIGN' && ticket.status !== 'CLOSED') {
      throw new ForbiddenException('只能删除待指派或已关闭的工单');
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * 批量删除工单
   */
  async deleteMany(ids: string[], currentUser: any) {
    // 权限校验
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以批量删除工单');
    }

    const result = await this.prisma.ticket.deleteMany({
      where: {
        id: { in: ids },
        status: { in: ['WAIT_ASSIGN', 'CLOSED'] },
      },
    });

    return { count: result.count };
  }

  /**
   * 指派工单
   */
  async assign(id: string, assignedId: string, currentUser: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 只有管理员可以指派
    if (!this.isAdmin(currentUser)) {
      throw new ForbiddenException('只有管理员可以指派工单');
    }

    // 状态校验：从 WAIT_ASSIGN 直接转到 PROCESSING
    this.validateTransition(ticket.status, 'PROCESSING');

    // 更新工单 - 指派后直接进入处理中状态
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        assignedId,
        status: 'PROCESSING',
      },
    });

    // 记录状态历史
    await this.recordStatusHistory(id, ticket.status, 'PROCESSING', currentUser.id, '指派给处理人');

    return this.getOne(id, currentUser);
  }

  /**
   * 接单
   */
  async accept(id: string, handlerId: string, currentUser: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 只有被指派的处理人可以接单
    if (ticket.assignedId !== currentUser.id) {
      throw new ForbiddenException('只有被指派的处理人可以接单');
    }

    // 状态校验
    this.validateTransition(ticket.status, 'PROCESSING');

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'PROCESSING',
      },
    });

    // 记录状态历史
    await this.recordStatusHistory(id, ticket.status, 'PROCESSING', handlerId, '接受工单');

    return this.getOne(id, currentUser);
  }

  /**
   * 完成工单
   */
  async complete(
    id: string,
    attachmentIds: string[],
    remark?: string,
    currentUser?: any,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 如果传入了 currentUser，进行权限校验
    if (currentUser) {
      // 只有处理人可以完成工单
      if (ticket.assignedId !== currentUser.id) {
        throw new ForbiddenException('只有处理人可以完成工单');
      }
    }

    // 状态校验
    this.validateTransition(ticket.status, 'COMPLETED');

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // 如果有处理说明或附件，创建处理人评论
    if (remark || (attachmentIds && attachmentIds.length > 0)) {
      const handlerId = currentUser?.id || ticket.assignedId;

      // 验证附件是否存在
      let validAttachmentIds: string[] = [];
      if (attachmentIds && attachmentIds.length > 0) {
        const existingAttachments = await this.prisma.attachment.findMany({
          where: {
            id: { in: attachmentIds },
          },
          select: { id: true },
        });
        validAttachmentIds = existingAttachments.map(a => a.id);
      }

      // 创建评论，通过 connect 关联附件（不更新 ticketId，避免显示在工单相关图片中）
      await this.prisma.comment.create({
        data: {
          ticketId: id,
          userId: handlerId,
          content: remark || '工单已完成',
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
    await this.recordStatusHistory(
      id,
      ticket.status,
      'COMPLETED',
      currentUser?.id || ticket.assignedId,
      remark || '工单完成',
    );

    return this.getOne(id, currentUser);
  }

  /**
   * 关闭工单
   */
  async close(id: string, userId: string, reason?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 状态校验
    this.validateTransition(ticket.status, 'CLOSED');

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // 记录状态历史
    await this.recordStatusHistory(id, ticket.status, 'CLOSED', userId, reason || '工单关闭');

    return updated;
  }

  /**
   * 评价工单
   */
  async rate(id: string, rating: number, userId: string, feedback?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 只有创建者可以评价
    if (ticket.createdById !== userId) {
      throw new ForbiddenException('只有创建者可以评价工单');
    }

    // 状态校验
    this.validateTransition(ticket.status, 'CLOSED');

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        rating,
        feedback,
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    // 记录状态历史
    await this.recordStatusHistory(id, ticket.status, 'CLOSED', userId, `用户评价: ${rating}星`);

    return updated;
  }

  /**
   * 检查是否可以查看工单
   */
  private canViewTicket(ticket: any, currentUser: any): boolean {
    // 超级管理员可以看到所有工单
    if (this.isSuperAdmin(currentUser)) {
      return true;
    }

    // 部门管理员可以看到所有工单
    if (this.isDeptAdmin(currentUser)) {
      return true;
    }

    // 创建者可以看到自己的工单
    if (ticket.createdById === currentUser.id) {
      return true;
    }

    // 处理人可以看到指派给自己的工单
    if (ticket.assignedId === currentUser.id) {
      return true;
    }

    return false;
  }

  /**
   * 验证状态流转
   */
  private validateTransition(fromStatus: TicketStatus, toStatus: TicketStatus) {
    const allowedTransitions = TICKET_STATE_TRANSITIONS[fromStatus] || [];
    if (!allowedTransitions.includes(toStatus)) {
      throw new ForbiddenException(`不能从 ${fromStatus} 转换到 ${toStatus}`);
    }
  }

  /**
   * 记录状态历史
   */
  private async recordStatusHistory(
    ticketId: string,
    fromStatus: TicketStatus,
    toStatus: TicketStatus,
    userId: string,
    remark?: string,
  ) {
    await this.prisma.statusHistory.create({
      data: {
        ticketId,
        fromStatus,
        toStatus,
        userId,
        remark,
      },
    });
  }

  /**
   * 辅助方法：判断是否为管理员
   */
  private isAdmin(user: any): boolean {
    return user?.roles?.some((r: any) => ['super_admin', 'dept_admin'].includes(r.slug));
  }

  /**
   * 辅助方法：判断是否为超级管理员
   */
  private isSuperAdmin(user: any): boolean {
    return user?.roles?.some((r: any) => r.slug === 'super_admin');
  }

  /**
   * 开始处理工单 (WAIT_ASSIGN -> PROCESSING)
   */
  async start(id: string, currentUser: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 只有被指派的处理人可以开始处理
    if (ticket.assignedId !== currentUser.id) {
      throw new ForbiddenException('只有被指派的处理人可以开始处理工单');
    }

    // 状态校验
    this.validateTransition(ticket.status, 'PROCESSING');

    // 更新工单
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: 'PROCESSING',
      },
    });

    // 记录状态历史
    await this.recordStatusHistory(id, ticket.status, 'PROCESSING', currentUser.id, '开始处理');

    return this.getOne(id, currentUser);
  }

  /**
   * 获取工单评论列表
   */
  async getComments(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    const comments = await this.prisma.comment.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return comments;
  }

  /**
   * 添加工单评论/处理记录
   */
  async addComment(
    id: string,
    data: {
      content?: string;
      attachmentIds?: string[];
      attachmentUrls?: string[];
    },
    currentUser: any
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    // 确定评论类型
    let commentType: 'USER' | 'HANDLER' | 'SYSTEM' = 'USER';
    if (ticket.assignedId === currentUser.id) {
      commentType = 'HANDLER';
    } else if (ticket.createdById === currentUser.id) {
      commentType = 'USER';
    }

    // 创建评论
    const comment = await this.prisma.comment.create({
      data: {
        ticketId: id,
        userId: currentUser.id,
        content: data.content,
        commentType,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // 处理附件 - 通过 ID 关联
    if (data.attachmentIds && data.attachmentIds.length > 0) {
      await this.prisma.attachment.updateMany({
        where: { id: { in: data.attachmentIds } },
        data: { commentId: comment.id, ticketId: id },
      });
    }

    // 处理附件 - 通过 URL 创建
    if (data.attachmentUrls && data.attachmentUrls.length > 0) {
      for (const url of data.attachmentUrls) {
        await this.prisma.attachment.create({
          data: {
            commentId: comment.id,
            ticketId: id,
            url,
            fileName: this.extractFileNameFromUrl(url),
            fileSize: 0,
            mimeType: this.getMimeTypeFromUrl(url),
            type: this.getFileTypeFromUrl(url),
            uploadedById: currentUser.id,
          },
        });
      }
    }

    // 返回包含附件的评论
    return this.prisma.comment.findUnique({
      where: { id: comment.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        attachments: true,
      },
    });
  }

  /**
   * 获取工单状态历史
   */
  async getStatusHistory(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('工单不存在');
    }

    const history = await this.prisma.statusHistory.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
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
    });

    return history;
  }

  /**
   * 辅助方法：判断是否为部门管理员
   */
  private isDeptAdmin(user: any): boolean {
    return user?.roles?.some((r: any) => r.slug === 'dept_admin');
  }

  /**
   * 从URL中提取文件名
   */
  private extractFileNameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  /**
   * 从URL获取MIME类型
   */
  private getMimeTypeFromUrl(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * 从URL获取文件类型
   */
  private getFileTypeFromUrl(url: string): 'IMAGE' | 'VIDEO' {
    const ext = url.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'mov', 'avi', 'mkv'];
    return videoExts.includes(ext || '') ? 'VIDEO' : 'IMAGE';
  }
}
