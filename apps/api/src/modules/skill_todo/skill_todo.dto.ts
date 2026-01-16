import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsDate, IsOptional, IsEnum } from 'class-validator';

export class CreateSkillTodoDto {


  @ApiProperty({ required: true,required: false,default: , description: '' })
  @IsString()@IsOptional()@IsString()
  ?: ;


}

export class UpdateSkillTodoDto {
  @ApiProperty()
  @IsNumber()
  id: number;





  @ApiProperty({ required: true,required: false,default: , description: '' })
  @IsOptional()
  ?: ;




}
