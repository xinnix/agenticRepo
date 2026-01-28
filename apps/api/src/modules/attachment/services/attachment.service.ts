import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileStorageService } from '../../../shared/services/file-storage.service';
import type { AttachmentType } from '@opencode/database';

/**
 * Attachment 服务
 * 处理工单附件的上传、删除和查询
 */
@Injectable()
export class AttachmentService {
  constructor(
    private prisma: PrismaService,
    private fileStorage: FileStorageService,
  ) {}

  /**
   * 创建附件记录（文件上传后调用）
   */
  async create(data: {
    type: AttachmentType;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    ticketId?: string;
    uploadedById: string;
  }) {
    const attachment = await this.prisma.attachment.create({
      data: {
        type: data.type,
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        ticketId: data.ticketId,
        uploadedById: data.uploadedById,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 如果是 OSS URL，根据配置决定是否生成预览签名 URL
    // 如果 OSS bucket 是公共读的，不需要签名 URL
    if (attachment.url.includes('.aliyuncs.com')) {
      const useSignedUrl = process.env.OSS_USE_SIGNED_URL === 'true';

      if (useSignedUrl) {
        try {
          const previewUrl = await this.fileStorage.getPreviewUrl(attachment.url);
          // 更新记录的 url 为签名 URL
          return this.prisma.attachment.update({
            where: { id: attachment.id },
            data: { url: previewUrl },
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });
        } catch (error) {
          console.error('生成预览 URL 失败:', error);
          // 如果失败，返回原始 URL
          return attachment;
        }
      } else {
        // 不使用签名 URL，直接返回原始 URL
        console.log('[Attachment] OSS bucket 是公共读，不生成签名 URL');
        return attachment;
      }
    }

    return attachment;
  }

  /**
   * 获取附件列表
   */
  async getMany(params: {
    page?: number;
    limit?: number;
    ticketId?: string;
    type?: AttachmentType;
  }) {
    const { page = 1, limit = 10, ...filters } = params;

    const where: any = {};
    if (filters.ticketId) {
      where.ticketId = filters.ticketId;
    }
    if (filters.type) {
      where.type = filters.type;
    }

    const [total, data] = await Promise.all([
      this.prisma.attachment.count({ where }),
      this.prisma.attachment.findMany({
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
  }

  /**
   * 获取单个附件
   */
  async getOne(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
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
      throw new NotFoundException('附件不存在');
    }

    return attachment;
  }

  /**
   * 删除附件
   */
  async delete(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: { ticket: true },
    });

    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }

    // 权限校验：只有上传者和工单创建者可以删除
    const isUploader = attachment.uploadedById === userId;
    const isTicketCreator = attachment.ticket?.createdById === userId;
    const isAdmin = await this.isAdmin(userId);

    if (!isUploader && !isTicketCreator && !isAdmin) {
      throw new ForbiddenException('无权删除此附件');
    }

    // 删除文件
    try {
      await this.fileStorage.delete(attachment.url);
    } catch (error) {
      // 记录错误但继续删除数据库记录
      console.error('删除文件失败:', error);
    }

    // 删除数据库记录
    await this.prisma.attachment.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * 关联附件到工单
   */
  async associateToTicket(attachmentId: string, ticketId: string) {
    return this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { ticketId },
    });
  }

  /**
   * 批量关联附件到工单
   */
  async batchAssociateToTicket(attachmentIds: string[], ticketId: string) {
    return this.prisma.attachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { ticketId },
    });
  }

  /**
   * 检查用户是否为管理员
   */
  private async isAdmin(userId: string): Promise<boolean> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    });

    return userRoles.some((ur) =>
      ['super_admin', 'dept_admin'].includes(ur.role.slug),
    );
  }
}
