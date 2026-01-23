import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// ============================================
// 工单编号生成服务
// ============================================

@Injectable()
export class TicketNumberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成工单编号：YYYYMMDD + 4位自增
   * 例如：202501200001
   */
  async generateNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = this.formatDatePrefix(today);

    // 查询今天最大的序号
    const latestTicket = await this.prisma.ticket.findFirst({
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
  private formatDatePrefix(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 解析工单编号日期
   */
  parseDateFromNumber(ticketNumber: string): Date {
    const dateStr = ticketNumber.slice(0, 8);
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month, day);
  }

  /**
   * 验证工单编号格式
   */
  isValidTicketNumber(ticketNumber: string): boolean {
    // 格式：12位数字（YYYYMMDD + 4位序号）
    return /^\d{12}$/.test(ticketNumber);
  }
}
