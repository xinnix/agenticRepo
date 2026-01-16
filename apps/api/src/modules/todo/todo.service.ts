import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './todo.dto';
import { Prisma } from '@opencode/database';

@Injectable()
export class TodoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTodoDto) {
    return this.prisma.todo.create({
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
    cursor?: Prisma.TodoWhereUniqueInput;
    where?: Prisma.TodoWhereInput;
    orderBy?: Prisma.TodoOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.todo.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async findOne(id: string) {
    return this.prisma.todo.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateTodoDto) {
    return this.prisma.todo.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async remove(id: string) {
    return this.prisma.todo.delete({
      where: { id },
    });
  }
}
