import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTestProductDto, UpdateTestProductDto } from './testproduct.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TestProductService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTestProductDto) {
    return this.prisma.testproduct.create({
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
    cursor?: Prisma.TestProductWhereUniqueInput;
    where?: Prisma.TestProductWhereInput;
    orderBy?: Prisma.TestProductOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.testproduct.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: number) {
    return this.prisma.testproduct.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateTestProductDto) {
    return this.prisma.testproduct.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: number) {
    return this.prisma.testproduct.delete({
      where: { id },
    });
  }
}
