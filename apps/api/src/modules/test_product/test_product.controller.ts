import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestProductService } from './testproduct.service';
import { CreateTestProductDto, UpdateTestProductDto } from './testproduct.dto';

@ApiTags('test_product')
@Controller('test_product')
export class TestProductController {
  constructor(private readonly testproductService: TestProductService) {}

  @Post()
  @ApiOperation({ summary: '创建test_product' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() createTestProductDto: CreateTestProductDto) {
    return this.testproductService.create(createTestProductDto);
  }

  @Get()
  @ApiOperation({ summary: '获取test_product列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: any) {
    return this.testproductService.findAll({
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      where: query.filter,
      orderBy: { id: 'desc' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个test_product' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findOne(@Param('id') id: string) {
    return this.testproductService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新test_product' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(@Param('id') id: string, @Body() updateTestProductDto: UpdateTestProductDto) {
    return this.testproductService.update(+id, updateTestProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除test_product' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id') id: string) {
    return this.testproductService.remove(+id);
  }
}
