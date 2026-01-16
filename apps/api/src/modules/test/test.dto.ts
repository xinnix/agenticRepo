import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum TestStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateTestDto {
  @ApiProperty({ required: true, description: '测试名称' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: '测试描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: TestStatusEnum.ACTIVE, description: '状态', enum: TestStatusEnum })
  @IsOptional()
  @IsEnum(TestStatusEnum)
  status?: TestStatusEnum;

  @ApiProperty({ required: false, default: 0, description: '排序顺序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateTestDto {
  @ApiProperty({ required: true, description: '测试 ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ required: false, description: '测试名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, description: '测试描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: '状态', enum: TestStatusEnum })
  @IsOptional()
  @IsEnum(TestStatusEnum)
  status?: TestStatusEnum;

  @ApiProperty({ required: false, description: '排序顺序' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
