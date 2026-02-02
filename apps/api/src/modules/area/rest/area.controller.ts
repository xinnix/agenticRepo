import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AreaService } from '../services/area.service';

@ApiTags('areas')
@Controller('areas')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Get()
  @ApiOperation({ summary: '获取区域列表' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.areaService.getMany({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      departmentId,
    });
  }

  @Get('by-scene')
  @ApiOperation({ summary: '通过小程序码 scene 查询区域' })
  async findByScene(@Query('scene') scene: string) {
    return this.areaService.getByScene(scene);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取区域详情' })
  async findOne(@Param('id') id: string) {
    return this.areaService.getOne(id);
  }
}
