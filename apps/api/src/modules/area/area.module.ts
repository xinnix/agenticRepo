import { Module } from '@nestjs/common';
import { AreaController } from './rest/area.controller';
import { AreaService } from './services/area.service';

@Module({
  controllers: [AreaController],
  providers: [AreaService],
  exports: [AreaService],
})
export class AreaModule {}
