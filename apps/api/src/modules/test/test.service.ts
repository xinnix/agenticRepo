import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTestDto, UpdateTestDto } from './test.dto';
import { Prisma } from '@opencode/database';

@Injectable()
export class TestService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTestDto) {
    return this.prisma.test.create({
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
    cursor?: Prisma.TestWhereUniqueInput;
    where?: Prisma.TestWhereInput;
    orderBy?: Prisma.TestOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.test.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: number) {
    return this.prisma.test.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateTestDto) {
    return this.prisma.test.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: number) {
    return this.prisma.test.delete({
      where: { id },
    });
  }
}
