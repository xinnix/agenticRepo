import { Module } from '@nestjs/common';
import { NotificationController } from './rest/notification.controller';
import { NotificationService } from './services/notification.service';

/**
 * Notification 模块
 * 负责工单通知的创建和管理
 */
@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
