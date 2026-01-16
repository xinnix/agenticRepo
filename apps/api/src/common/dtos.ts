import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  pageSize?: number = 10;

  @ApiProperty({ required: false })
  sortBy?: string;

  @ApiProperty({ required: false, default: 'asc' })
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;
}

export class ResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: T;

  @ApiProperty()
  timestamp: string;
}
