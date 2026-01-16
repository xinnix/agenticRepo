import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsDate, IsOptional, IsEnum } from 'class-validator';

export class CreateTestTodoDto {


  @ApiProperty({ required: true,required: false,default: , description: '' })
  @IsString()@IsOptional()@IsString()
  ?: ;


}

export class UpdateTestTodoDto {
  @ApiProperty()
  @IsNumber()
  id: number;





  @ApiProperty({ required: true,required: false,default: , description: '' })
  @IsOptional()
  ?: ;




}
