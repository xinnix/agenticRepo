import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TodoService } from '../services/todo.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../auth/decorators/decorators';
import { CreateTodoSchema, UpdateTodoSchema, TodoListQuerySchema } from '@opencode/shared';

@ApiTags('todo')
@Controller('todo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @ApiOperation({ summary: '创建todo' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
  })
  async create(
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const data = CreateTodoSchema.parse(body);
    // 将 userId 直接添加到数据中
    return this.todoService.create({ ...data, userId: user.id });
  }

  @Get()
  @ApiOperation({ summary: '获取todo列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async findAll(
    @Query() query: any,
    @CurrentUser() user: any,
  ) {
    const data = TodoListQuerySchema.parse(query);
    const pageSize = data.pageSize || 10;
    const page = data.page || 1;

    return this.todoService.list({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where: { userId: user.id },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个todo' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.todoService.getOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新todo' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    const data = UpdateTodoSchema.parse(body);
    return this.todoService.update(id, data, { userId: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除todo' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async remove(@Param('id') id: string) {
    return this.todoService.remove(id);
  }
}
