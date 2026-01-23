import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';
import { TicketService } from '../services/ticket.service';
import { TicketStatusService } from '../services/ticket-status.service';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketController {
  constructor(
    private ticketService: TicketService,
    private statusService: TicketStatusService,
  ) {
    console.log('[TicketController] Constructor called');
    console.log('[TicketController] ticketService:', !!this.ticketService);
    console.log('[TicketController] statusService:', !!this.statusService);
  }

  @Post()
  @ApiOperation({ summary: '创建工单' })
  async create(@Body() data: any, @CurrentUser() user: any) {
    return this.ticketService.create({
      ...data,
      createdById: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: '获取工单列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('categoryId') categoryId?: string,
    @Query('createdById') createdById?: string,
    @Query('assignedId') assignedId?: string,
    @Query('isOverdue') isOverdue?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketService.getMany({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status: status as any,
      priority: priority as any,
      categoryId,
      createdById,
      assignedId: assignedId === 'null' ? null : assignedId,
      isOverdue: isOverdue === 'true' ? true : isOverdue === 'false' ? false : undefined,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工单详情' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.getOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新工单' })
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.update(id, data, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工单' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.delete(id, user);
  }

  @Post('delete-many')
  @ApiOperation({ summary: '批量删除工单' })
  async removeMany(@Body() body: { ids: string[] }, @CurrentUser() user: any) {
    return this.ticketService.deleteMany(body.ids, user);
  }

  // ============================================
  // 状态操作
  // ============================================

  @Post(':id/assign')
  @ApiOperation({ summary: '指派工单' })
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedId: string },
    @CurrentUser() user: any,
  ) {
    return this.ticketService.assign(id, body.assignedId, user);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: '接单' })
  async accept(@Param('id') id: string, @CurrentUser() user: any) {
    return this.statusService.acceptTicket(id, user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成工单' })
  async complete(
    @Param('id') id: string,
    @Body() body: { attachmentIds?: string[] },
    @CurrentUser() user: any,
  ) {
    return this.ticketService.complete(id, body.attachmentIds || [], user.id, user);
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭工单' })
  async close(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.statusService.closeTicket(id, user.id, body.reason);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: '评价工单' })
  async rate(
    @Param('id') id: string,
    @Body() body: { rating: number; feedback?: string },
    @CurrentUser() user: any,
  ) {
    return this.ticketService.rate(id, body.rating, user.id, body.feedback);
  }

  // ============================================
  // 状态相关查询
  // ============================================

  @Get('status/actions')
  @ApiOperation({ summary: '获取状态可执行的操作列表' })
  getStatusActions(@Query('status') status: string) {
    return this.statusService.getAvailableActions(status as any);
  }

  @Get('status/all')
  @ApiOperation({ summary: '获取所有可用状态' })
  getAllStatus() {
    return this.statusService.getAllStates();
  }

  // ============================================
  // 小程序专用端点
  // ============================================

  @Post(':id/start')
  @ApiOperation({ summary: '开始处理工单' })
  async start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.start(id, user);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: '获取工单评论列表' })
  async getComments(@Param('id') id: string) {
    return this.ticketService.getComments(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '添加工单评论' })
  async addComment(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: any,
  ) {
    return this.ticketService.addComment(id, body.content, user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取工单状态历史' })
  async getHistory(@Param('id') id: string) {
    return this.ticketService.getStatusHistory(id);
  }

  // ============================================
  // 批量操作
  // ============================================

  @Post('batch/status')
  @ApiOperation({ summary: '批量更新工单状态' })
  async batchUpdateStatus(
    @Body() body: {
      ticketIds: string[];
      status: string;
      reason?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.statusService.batchUpdateStatus(
      body.ticketIds,
      body.status as any,
      user.id,
      body.reason,
    );
  }
}
