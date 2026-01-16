import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum CategoryStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateCategoryDto {
  @ApiProperty({ required: true, description: '分类名称' })
  @IsString()
  name: string;

  @ApiProperty({ required: true, description: '分类别名' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false, description: '分类描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: true, description: '父分类 ID' })
  @IsNumber()
  parentId: number;

  @ApiProperty({ required: false, default: 1, description: '分类层级' })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ required: false, default: 0, description: '排序顺序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false, description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false, description: '封面图' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ required: false, default: CategoryStatusEnum.ACTIVE, description: '状态', enum: CategoryStatusEnum })
  @IsOptional()
  @IsEnum(CategoryStatusEnum)
  status?: CategoryStatusEnum;

  @ApiProperty({ required: false, description: 'SEO 标题' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiProperty({ required: false, description: 'SEO 描述' })
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ required: true, description: '分类 ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ required: false, description: '分类名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: '分类别名' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ required: false, description: '分类描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: '父分类 ID' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ required: false, description: '分类层级' })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ required: false, description: '排序顺序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({ required: false, description: '图标' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ required: false, description: '封面图' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ required: false, description: '状态', enum: CategoryStatusEnum })
  @IsOptional()
  @IsEnum(CategoryStatusEnum)
  status?: CategoryStatusEnum;

  @ApiProperty({ required: false, description: 'SEO 标题' })
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiProperty({ required: false, description: 'SEO 描述' })
  @IsOptional()
  @IsString()
  seoDescription?: string;
}
