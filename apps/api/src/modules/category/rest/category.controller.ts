import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';
import { CategoryService } from '../services/category.service';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  async create(@Body() data: any) {
    return this.categoryService.create(data);
  }

  @Get()
  @ApiOperation({ summary: '获取分类列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('parentId') parentId?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
  ) {
    return this.categoryService.getMany({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
      parentId,
      level: level ? parseInt(level) : undefined,
      search,
    });
  }

  @Get('tree')
  @ApiOperation({ summary: '获取分类树' })
  async getTree(
    @Query('status') status?: string,
    @Query('level') level?: string,
  ) {
    return this.categoryService.getTree({
      status,
      level: level ? parseInt(level) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分类详情' })
  async findOne(@Param('id') id: string) {
    return this.categoryService.getOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.categoryService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  async remove(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  @Post('delete-many')
  @ApiOperation({ summary: '批量删除分类' })
  async removeMany(@Body() body: { ids: string[] }) {
    return this.categoryService.deleteMany(body.ids);
  }
}
