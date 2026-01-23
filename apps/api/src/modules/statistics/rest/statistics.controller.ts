import { Controller, Get, Post, Query, Param, UseGuards, Header, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { StatisticsService } from '../services/statistics.service';

@ApiTags('statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取概览统计' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getOverview({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('category')
  @ApiOperation({ summary: '获取分类统计' })
  async getCategoryStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getCategoryStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  @Get('trend')
  @ApiOperation({ summary: '获取趋势统计' })
  async getTrendStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.statisticsService.getTrendStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interval,
    });
  }

  // ============================================
  // 小程序兼容性路径 (别名)
  // ============================================

  @Get('tickets/overview')
  @ApiOperation({ summary: '获取概览统计 (小程序兼容路径)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getOverviewAlias(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getOverview({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('tickets/trend')
  @ApiOperation({ summary: '获取趋势统计 (小程序兼容路径)' })
  async getTrendAlias(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.statisticsService.getTrendStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interval,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: '获取分类统计 (小程序兼容路径)' })
  async getCategoriesAlias(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getCategoryStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });
  }

  // ============================================
  // 小程序新增端点
  // ============================================

  @Get('handlers/:handlerId')
  @ApiOperation({ summary: '获取处理人工作台统计' })
  async getHandlerStats(
    @Param('handlerId') handlerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getHandlerStats(handlerId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('users/:userId')
  @ApiOperation({ summary: '获取用户工单统计' })
  async getUserStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getUserStats(userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('performance')
  @ApiOperation({ summary: '获取处理人绩效统计' })
  async getPerformanceStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: string,
  ) {
    return this.statisticsService.getPerformanceStats({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('overdue')
  @ApiOperation({ summary: '获取超时工单统计' })
  async getOverdueStats() {
    return this.statisticsService.getOverdueStats();
  }
}
