import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../../modules/auth/decorators/decorators';
import { HandlerApplicationSchema } from '@opencode/shared';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 小程序：提交办事员申请
   */
  @Post('submit-handler-application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '提交办事员申请' })
  @ApiResponse({
    status: 200,
    description: '申请提交成功',
  })
  async submitHandlerApplication(
    @Body() body: any,
    @CurrentUser() currentUser: any,
  ) {
    // 使用 Zod schema 验证
    const data = HandlerApplicationSchema.submitInput.parse(body);
    const { userId, realName, phone } = data;

    // 验证当前用户只能为自己提交申请
    if (currentUser.id !== userId) {
      return {
        success: false,
        message: '只能为自己提交申请',
      };
    }

    // 检查用户是否已经是办事员
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!existingUser) {
      return {
        success: false,
        message: '用户不存在',
      };
    }

    const isHandler = existingUser.roles.some(
      (ur) => ur.role.slug === 'handler',
    );

    if (isHandler) {
      return {
        success: false,
        message: '您已经是办事员，无需重复申请',
      };
    }

    // 检查是否已有待审核的申请
    if (existingUser.handlerStatus === 'pending') {
      return {
        success: false,
        message: '您已提交过申请，请耐心等待审核',
      };
    }

    // 更新用户信息并提交申请
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        realName: realName,
        phone: phone,
        handlerStatus: 'pending',
        handlerAppliedAt: new Date(),
      },
    });

    return {
      success: true,
      message: '申请提交成功，请等待审核',
    };
  }

  /**
   * 管理端：获取待审核的办事员申请列表
   */
  @Get('pending-handler-applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取待审核的办事员申请列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getPendingApplications(@CurrentUser() currentUser: any) {
    const applications = await this.prisma.user.findMany({
      where: {
        handlerStatus: 'pending',
        wxOpenId: { not: null },
      },
      select: {
        id: true,
        realName: true,
        phone: true,
        wxNickname: true,
        wxAvatarUrl: true,
        handlerAppliedAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        handlerAppliedAt: 'desc',
      },
    });

    return {
      success: true,
      data: applications.map((app) => ({
        ...app,
        roles: app.roles.map((r) => r.role),
      })),
    };
  }

  /**
   * 管理端：批准办事员申请并分配部门
   */
  @Post('approve-handler')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批准办事员申请并分配部门' })
  @ApiResponse({
    status: 200,
    description: '操作成功',
  })
  async approveHandler(@Body() body: any) {
    const data = HandlerApplicationSchema.approveInput.parse(body);
    const { userId, departmentId } = data;

    // 查找办事员角色
    const handlerRole = await this.prisma.role.findUnique({
      where: { slug: 'handler' },
    });

    if (!handlerRole) {
      return {
        success: false,
        message: '办事员角色不存在',
      };
    }

    // 检查用户是否已有办事员角色
    const existingUserRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: handlerRole.id,
        },
      },
    });

    // 使用事务确保数据一致性
    await this.prisma.$transaction(async (tx) => {
      // 如果用户还没有办事员角色，添加角色
      if (!existingUserRole) {
        await tx.userRole.create({
          data: {
            userId,
            roleId: handlerRole.id,
            assignedBy: null,
          },
        });
      }

      // 更新用户状态为已批准
      await tx.user.update({
        where: { id: userId },
        data: {
          handlerStatus: 'approved',
          departmentId: departmentId || null,
        },
      });
    });

    return {
      success: true,
      message: '已批准成为办事员',
    };
  }

  /**
   * 管理端：拒绝办事员申请
   */
  @Post('reject-handler')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '拒绝办事员申请' })
  @ApiResponse({
    status: 200,
    description: '操作成功',
  })
  async rejectHandler(@Body() body: any) {
    const data = HandlerApplicationSchema.rejectInput.parse(body);

    await this.prisma.user.update({
      where: { id: data.userId },
      data: {
        handlerStatus: 'rejected',
      },
    });

    return {
      success: true,
      message: '已拒绝申请',
    };
  }

  /**
   * 获取用户办事员申请状态
   */
  @Get('handler-application-status/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户办事员申请状态' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getHandlerApplicationStatus(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: any,
  ) {
    // 验证权限
    if (currentUser.id !== userId) {
      return {
        success: false,
        message: '无权查看他人申请状态',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        handlerStatus: true,
        handlerAppliedAt: true,
        realName: true,
        phone: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  }
}
