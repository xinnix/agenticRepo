import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTestTodoDto, UpdateTestTodoDto } from './testtodo.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestTodoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTestTodoDto) {
    return this.prisma.testtodo.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TestTodoWhereUniqueInput;
    where?: Prisma.TestTodoWhereInput;
    orderBy?: Prisma.TestTodoOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.testtodo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: number) {
    return this.prisma.testtodo.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateTestTodoDto) {
    return this.prisma.testtodo.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: number) {
    return this.prisma.testtodo.delete({
      where: { id },
    });
  }
}
