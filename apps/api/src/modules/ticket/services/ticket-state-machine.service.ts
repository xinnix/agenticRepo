import { Injectable } from '@nestjs/common';
import { StateMachineService, TICKET_STATE_TRANSITIONS, STATE_ACTIONS } from '../../../shared/services/state-machine.service';
import type { TicketStatus } from '@opencode/database';

/**
 * Ticket 专用状态机服务
 * 避免泛型注入问题
 */
@Injectable()
export class TicketStateMachineService {
  private stateMachine = new StateMachineService<TicketStatus>();

  canTransition(fromStatus: TicketStatus, toStatus: TicketStatus): boolean {
    return this.stateMachine.canTransition(fromStatus, toStatus);
  }

  getAvailableActions(status: TicketStatus): string[] {
    return this.stateMachine.getAvailableActions(status);
  }

  getStateInfo(status: TicketStatus) {
    return this.stateMachine.getStateInfo(status);
  }

  validateTransition(fromStatus: TicketStatus, toStatus: TicketStatus): void {
    this.stateMachine.validateTransition(fromStatus, toStatus);
  }

  getAllStates(): string[] {
    return this.stateMachine.getAllStates();
  }

  getInitialState(): string {
    return this.stateMachine.getInitialState();
  }

  isFinalState(status: TicketStatus): boolean {
    return this.stateMachine.isFinalState(status);
  }
}
