import { IsString, IsOptional, IsInt, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { AssignType } from '@opencode/database';

// 使用字符串字面量类型代替枚举导入
type AssignTypeEnum = 'MANUAL' | 'AUTO' | 'ROUND_ROBIN';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '分类标识' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '父分类ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: '图标', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '分配类型', enum: ['MANUAL', 'AUTO', 'ROUND_ROBIN'], required: false })
  @IsOptional()
  @IsEnum(['MANUAL', 'AUTO', 'ROUND_ROBIN'])
  assignType?: AssignTypeEnum;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: '分类名称', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: '分类标识', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: '分类描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '父分类ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: '图标', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '分配类型', enum: ['MANUAL', 'AUTO', 'ROUND_ROBIN'], required: false })
  @IsOptional()
  @IsEnum(['MANUAL', 'AUTO', 'ROUND_ROBIN'])
  assignType?: AssignTypeEnum;
}

export class QueryCategoryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ description: '状态', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: '父分类ID', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: '层级', required: false })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
