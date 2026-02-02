import { Module } from '@nestjs/common';
import { AreaController } from './rest/area.controller';
import { AreaService } from './services/area.service';
import { WxacodeService } from './services/wxacode.service';
import { FileStorageService } from '../../shared/services/file-storage.service';

@Module({
  controllers: [AreaController],
  providers: [AreaService, WxacodeService, FileStorageService],
  exports: [AreaService, WxacodeService],
})
export class AreaModule {}
