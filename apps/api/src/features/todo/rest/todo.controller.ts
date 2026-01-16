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
import { z } from 'zod';
import { TodoService } from '../services/todo.service';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CurrentUser } from '../../auth/decorators/decorators';

// 🔥 直接使用 @opencode/shared 的 Zod schema
import { TodoSchema } from '@opencode/shared';

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
    @Body() body: typeof TodoSchema.createInput,
    @CurrentUser() user: any,
  ) {
    const data = TodoSchema.createInput.parse(body);
    return this.todoService.create(data, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取todo列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async findAll(
    @Query() query: typeof TodoSchema.getManyInput,
    @CurrentUser() user: any,
  ) {
    const data = TodoSchema.getManyInput.parse(query);
    return this.todoService.findAll(data, user.id);
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
    const data = TodoSchema.getOneInput.parse({ id });
    return this.todoService.findOne(data, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新todo' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
  })
  async update(
    @Param('id') id: string,
    @Body() body: typeof TodoSchema.updateInput,
    @CurrentUser() user: any,
  ) {
    const data = TodoSchema.updateInput.parse({ ...body, id });
    return this.todoService.update(data, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除todo' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const data = TodoSchema.deleteInput.parse({ id });
    return this.todoService.remove(data, user.id);
  }
}
