import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsInt, IsDate } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ required: true, description: 'Todo标题' })
  @IsString()
  title: string;

  @ApiProperty({ required: false, description: 'Todo描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, default: false, description: '是否完成' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({ required: false, default: 1, description: '优先级 (1: 低, 2: 中, 3: 高)' })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({ required: false, description: '截止日期' })
  @IsOptional()
  @IsDate()
  dueDate?: Date;
}

export class UpdateTodoDto {
  @ApiProperty({ required: true, description: 'Todo ID' })
  @IsString()
  id: string;

  @ApiProperty({ required: false, description: 'Todo标题' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, description: 'Todo描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: '是否完成' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({ required: false, description: '优先级 (1: 低, 2: 中, 3: 高)' })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiProperty({ required: false, description: '截止日期' })
  @IsOptional()
  @IsDate()
  dueDate?: Date;
}
