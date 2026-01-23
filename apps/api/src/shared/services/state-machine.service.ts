import { Injectable } from '@nestjs/common';

// ============================================
// 工单状态流转常量
// ============================================

export const TICKET_STATE_TRANSITIONS: Record<string, string[]> = {
  WAIT_ASSIGN: ['WAIT_ACCEPT', 'CLOSED'],
  WAIT_ACCEPT: ['PROCESSING', 'WAIT_ASSIGN', 'CLOSED'],
  PROCESSING: ['COMPLETED', 'WAIT_ASSIGN', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
};

export const STATE_ACTIONS: Record<string, { label: string; color: string; nextActions: string[] }> = {
  WAIT_ASSIGN: {
    label: '待指派',
    color: 'orange',
    nextActions: ['assign', 'close'],
  },
  WAIT_ACCEPT: {
    label: '待接单',
    color: 'blue',
    nextActions: ['accept', 'reassign', 'close'],
  },
  PROCESSING: {
    label: '处理中',
    color: 'cyan',
    nextActions: ['complete', 'reassign', 'close'],
  },
  COMPLETED: {
    label: '待评价',
    color: 'lime',
    nextActions: ['rate', 'close'],
  },
  CLOSED: {
    label: '已关闭',
    color: 'gray',
    nextActions: [],
  },
};

// ============================================
// 状态机服务
// ============================================

@Injectable()
export class StateMachineService<TStatus = string> {
  /**
   * 验证状态流转是否合法
   */
  canTransition(fromStatus: TStatus, toStatus: TStatus): boolean {
    const transitions = TICKET_STATE_TRANSITIONS[String(fromStatus)];
    if (!transitions) return false;
    return transitions.includes(String(toStatus) as never);
  }

  /**
   * 获取状态可执行的操作列表
   */
  getAvailableActions(status: TStatus): string[] {
    return STATE_ACTIONS[String(status)]?.nextActions || [];
  }

  /**
   * 获取状态显示信息
   */
  getStateInfo(status: TStatus) {
    return STATE_ACTIONS[String(status)] || { label: String(status), color: 'gray', nextActions: [] };
  }

  /**
   * 验证状态流转，如果不合法则抛出异常
   */
  validateTransition(fromStatus: TStatus, toStatus: TStatus, errorPrefix = '状态流转'): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new Error(`${errorPrefix}失败: 不能从 ${fromStatus} 转换到 ${toStatus}`);
    }
  }

  /**
   * 获取所有可用的状态
   */
  getAllStates(): string[] {
    return Object.keys(TICKET_STATE_TRANSITIONS);
  }

  /**
   * 获取初始状态
   */
  getInitialState(): string {
    return 'WAIT_ASSIGN';
  }

  /**
   * 获取终态列表
   */
  getFinalStates(): string[] {
    return Object.entries(TICKET_STATE_TRANSITIONS)
      .filter(([_, nextStates]) => nextStates.length === 0)
      .map(([state]) => state);
  }

  /**
   * 判断是否为终态
   */
  isFinalState(status: TStatus): boolean {
    return this.getFinalStates().includes(String(status));
  }
}
