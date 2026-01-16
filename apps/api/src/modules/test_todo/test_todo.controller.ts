import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestTodoService } from './testtodo.service';
import { CreateTestTodoDto, UpdateTestTodoDto } from './testtodo.dto';

@ApiTags('test_todo')
@Controller('test_todo')
export class TestTodoController {
  constructor(private readonly testtodoService: TestTodoService) {}

  @Post()
  @ApiOperation({ summary: '创建test_todo' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createTestTodoDto: CreateTestTodoDto) {
    return this.testtodoService.create(createTestTodoDto);
  }

  @Get()
  @ApiOperation({ summary: '获取test_todo列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: any) {
    return this.testtodoService.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: query.filter,
      orderBy: { id: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个test_todo' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.testtodoService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新test_todo' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateTestTodoDto: UpdateTestTodoDto) {
    return this.testtodoService.update(+id, updateTestTodoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除test_todo' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.testtodoService.remove(+id);
  }
}
