import { Module } from '@nestjs/common';
import { StatisticsController } from './rest/statistics.controller';
import { StatisticsService } from './services/statistics.service';

/**
 * Statistics 模块
 * 负责工单数据统计
 */
@Module({
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
