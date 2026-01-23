import { Module } from '@nestjs/common';
import { AttachmentController } from './rest/attachment.controller';
import { AttachmentService } from './services/attachment.service';
import { FileStorageService } from '../../shared/services/file-storage.service';

/**
 * Attachment 模块
 * 负责工单附件的上传和管理
 */
@Module({
  controllers: [AttachmentController],
  providers: [AttachmentService, FileStorageService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
