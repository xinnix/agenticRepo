import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TicketStateMachineService } from './ticket-state-machine.service';
import type { TicketStatus } from '@opencode/database';

@Injectable()
export class TicketStatusService {
  constructor(
    private prisma: PrismaService,
    private stateMachine: TicketStateMachineService,
  ) {}

  /**
   * 验证状态流转是否合法
   */
  canTransition(fromStatus: TicketStatus, toStatus: TicketStatus): boolean {
    return this.stateMachine.canTransition(fromStatus, toStatus);
  }

  /**
   * 执行状态流转
   */
  async transition(
    ticketId: string,
    toStatus: TicketStatus,
    userId: string,
    remark?: string,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new ForbiddenException('工单不存在');
    }

    // 验证流转合法性
    this.stateMachine.validateTransition(ticket.status, toStatus);

    // 使用事务更新状态并记录历史
    return this.prisma.$transaction(async (tx) => {
      // 更新工单状态
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: toStatus,
          ...(toStatus === 'COMPLETED' && { completedAt: new Date() }),
          ...(toStatus === 'CLOSED' && { closedAt: new Date() }),
        },
      });

      // 记录状态历史
      await tx.statusHistory.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus,
          userId,
          remark,
        },
      });

      return updated;
    });
  }

  /**
   * 获取工单可执行的操作
   */
  getAvailableActions(status: TicketStatus): string[] {
    return this.stateMachine.getAvailableActions(status);
  }

  /**
   * 获取状态显示信息
   */
  getStateInfo(status: TicketStatus) {
    return this.stateMachine.getStateInfo(status);
  }

  /**
   * 获取所有可用状态
   */
  getAllStates(): string[] {
    return this.stateMachine.getAllStates();
  }

  /**
   * 检查是否为终态
   */
  isFinalState(status: TicketStatus): boolean {
    return this.stateMachine.isFinalState(status);
  }

  /**
   * 接单（WAIT_ACCEPT -> PROCESSING）
   */
  async acceptTicket(ticketId: string, handlerId: string) {
    return this.transition(ticketId, 'PROCESSING', handlerId, '接受工单');
  }

  /**
   * 完成工单（PROCESSING -> COMPLETED）
   */
  async completeTicket(ticketId: string, handlerId: string) {
    return this.transition(ticketId, 'COMPLETED', handlerId, '工单完成');
  }

  /**
   * 关闭工单（可从多种状态执行）
   */
  async closeTicket(ticketId: string, userId: string, reason?: string) {
    return this.transition(ticketId, 'CLOSED', userId, reason || '工单关闭');
  }

  /**
   * 批量更新工单状态（管理员操作）
   */
  async batchUpdateStatus(
    ticketIds: string[],
    toStatus: TicketStatus,
    userId: string,
    reason?: string,
  ) {
    const results = [];
    const errors = [];

    for (const ticketId of ticketIds) {
      try {
        const result = await this.transition(ticketId, toStatus, userId, reason);
        results.push({ ticketId, success: true });
      } catch (error) {
        errors.push({ ticketId, error: (error as Error).message });
      }
    }

    return {
      total: ticketIds.length,
      success: results.length,
      failed: errors.length,
      errors,
    };
  }
}
