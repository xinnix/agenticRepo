import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TicketController } from './rest/ticket.controller';
import { TicketService } from './services/ticket.service';
import { TicketStatusService } from './services/ticket-status.service';
import { TicketNumberService } from './services/ticket-number.service';
import { TicketDeadlineService } from './services/ticket-deadline.service';
import { TicketStateMachineService } from './services/ticket-state-machine.service';

/**
 * Ticket 模块
 * 负责工单管理的核心功能
 * PrismaService 由全局 PrismaModule 提供
 */
@Module({
  imports: [ConfigModule],
  controllers: [TicketController],
  providers: [
    TicketService,
    TicketStatusService,
    TicketNumberService,
    TicketDeadlineService,
    TicketStateMachineService,
  ],
  exports: [
    TicketService,
    TicketStatusService,
  ],
})
export class TicketModule {}
