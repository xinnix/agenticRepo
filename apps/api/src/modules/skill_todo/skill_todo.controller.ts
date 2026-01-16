import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkillTodoService } from './skilltodo.service';
import { CreateSkillTodoDto, UpdateSkillTodoDto } from './skilltodo.dto';

@ApiTags('skill_todo')
@Controller('skill_todo')
export class SkillTodoController {
  constructor(private readonly skilltodoService: SkillTodoService) {}

  @Post()
  @ApiOperation({ summary: '创建skill_todo' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createSkillTodoDto: CreateSkillTodoDto) {
    return this.skilltodoService.create(createSkillTodoDto);
  }

  @Get()
  @ApiOperation({ summary: '获取skill_todo列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: any) {
    return this.skilltodoService.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: query.filter,
      orderBy: { id: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个skill_todo' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.skilltodoService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新skill_todo' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateSkillTodoDto: UpdateSkillTodoDto) {
    return this.skilltodoService.update(+id, updateSkillTodoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除skill_todo' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.skilltodoService.remove(+id);
  }
}
