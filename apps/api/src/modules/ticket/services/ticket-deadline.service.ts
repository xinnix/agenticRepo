import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ============================================
// 工单截止时间计算服务
// ============================================

@Injectable()
export class TicketDeadlineService {
  private deadlines: Record<string, number>;

  constructor(@Optional() private config?: ConfigService) {
    // 从配置读取或使用默认值
    this.deadlines = {
      NORMAL: this.config ? parseInt(this.config.get<string>('DEADLINE_NORMAL_HOURS') || '24', 10) : 24, // 普通工单24小时
      URGENT: this.config ? parseInt(this.config.get<string>('DEADLINE_URGENT_HOURS') || '4', 10) : 4,  // 紧急工单4小时
    };
  }

  /**
   * 根据优先级计算截止时间
   */
  async calculateDeadline(priority: 'NORMAL' | 'URGENT'): Promise<Date> {
    const hours = this.deadlines[priority] || 24;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  /**
   * 检查工单是否超时
   */
  isOverdue(deadlineAt: Date): boolean {
    return new Date() > deadlineAt;
  }

  /**
   * 检查是否即将超时（30分钟内）
   */
  isNearlyOverdue(deadlineAt: Date): boolean {
    const thirtyMinutesLater = new Date();
    thirtyMinutesLater.setMinutes(thirtyMinutesLater.getMinutes() + 30);
    return deadlineAt <= thirtyMinutesLater && deadlineAt > new Date();
  }

  /**
   * 获取截止时间的小时数
   */
  getDeadlineHours(priority: 'NORMAL' | 'URGENT'): number {
    return this.deadlines[priority] || 24;
  }
}
