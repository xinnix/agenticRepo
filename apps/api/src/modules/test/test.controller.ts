import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestService } from './test.service';
import { CreateTestDto, UpdateTestDto } from './test.dto';

@ApiTags('test')
@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post()
  @ApiOperation({ summary: '创建test' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createTestDto: CreateTestDto) {
    return this.testService.create(createTestDto);
  }

  @Get()
  @ApiOperation({ summary: '获取test列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: any) {
    return this.testService.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: query.filter,
      orderBy: { id: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个test' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.testService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新test' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateTestDto: UpdateTestDto) {
    return this.testService.update(+id, updateTestDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除test' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.testService.remove(+id);
  }
}
