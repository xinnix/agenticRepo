import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';
import { NotificationService } from '../services/notification.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取用户通知列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: any,
  ) {
    return this.notificationService.getMany({
      userId: user.id,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      type: type as any,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  async getUnreadCount(@CurrentUser() user?: any) {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  async markAsRead(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Post('mark-many-read')
  @ApiOperation({ summary: '批量标记通知为已读' })
  async markManyAsRead(@Body() body: { ids: string[] }, @CurrentUser() user?: any) {
    return this.notificationService.markManyAsRead(body.ids, user.id);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: '标记所有通知为已读' })
  async markAllAsRead(@CurrentUser() user?: any) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  async remove(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.notificationService.delete(id, user.id);
  }
}
