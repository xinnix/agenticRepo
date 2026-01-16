import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateSkillTodoDto, UpdateSkillTodoDto } from './skilltodo.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SkillTodoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSkillTodoDto) {
    return this.prisma.skilltodo.create({
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
    cursor?: Prisma.SkillTodoWhereUniqueInput;
    where?: Prisma.SkillTodoWhereInput;
    orderBy?: Prisma.SkillTodoOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.skilltodo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: number) {
    return this.prisma.skilltodo.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateSkillTodoDto) {
    return this.prisma.skilltodo.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: number) {
    return this.prisma.skilltodo.delete({
      where: { id },
    });
  }
}
