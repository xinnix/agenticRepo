import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { z } from 'zod';

// 🔥 使用 @opencode/shared 的类型和 schema
import { TodoSchema } from '@opencode/shared';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ✅ 创建todo
   */
  async create(
    input: z.infer<typeof TodoSchema.createInput>,
    userId: string,
  ) {
    const data = TodoSchema.createInput.parse(input);

    return this.prisma.todo.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        isCompleted: data.isCompleted ?? false,
        dueDate: data.dueDate,
        createdById: userId,
        updatedById: userId,
      },
    });
  }

  /**
   * 📋 获取todo列表
   */
  async findAll(
    input: z.infer<typeof TodoSchema.getManyInput>,
    userId: string,
  ) {
    const data = TodoSchema.getManyInput.parse(input);

    // 构建查询条件
    const where: any = {
      userId, // 只返回当前用户的todo
    };

    // 执行查询
    const [todos, total] = await Promise.all([
      this.prisma.todo.findMany({
        skip: data.page ? (data.page - 1) * data.limit : 0,
        take: data.limit || 10,
        where,
        orderBy: { id: 'desc' },
      }),
      this.prisma.todo.count({ where }),
    ]);

    return {
      data: todos,
      total,
      page: data.page || 1,
      pageSize: data.limit || 10,
      totalPages: Math.ceil(total / (data.limit || 10)),
    };
  }

  /**
   * 🔍 获取单个todo
   */
  async findOne(
    input: z.infer<typeof TodoSchema.getOneInput>,
    userId: string,
  ) {
    const data = TodoSchema.getOneInput.parse(input);

    const todo = await this.prisma.todo.findUnique({
      where: { id: data.id },
    });

    if (!todo) {
      throw new NotFoundException('Todo未找到');
    }

    // 检查权限
    if (todo.createdById !== userId) {
      throw new ForbiddenException('无权访问此todo');
    }

    return todo;
  }

  /**
   * ✏️ 更新todo
   */
  async update(
    input: z.infer<typeof TodoSchema.updateInput>,
    userId: string,
  ) {
    const data = TodoSchema.updateInput.parse(input);

    // 检查todo是否存在且属于当前用户
    const existingTodo = await this.prisma.todo.findUnique({
      where: { id: data.id },
    });

    if (!existingTodo) {
      throw new NotFoundException('Todo未找到');
    }

    if (existingTodo.createdById !== userId) {
      throw new ForbiddenException('无权修改此todo');
    }

    return this.prisma.todo.update({
      where: { id: data.id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        isCompleted: data.isCompleted,
        dueDate: data.dueDate,
        updatedById: userId,
      },
    });
  }

  /**
   * 🗑️ 删除todo
   */
  async remove(
    input: z.infer<typeof TodoSchema.deleteInput>,
    userId: string,
  ) {
    const data = TodoSchema.deleteInput.parse(input);

    // 检查todo是否存在且属于当前用户
    const existingTodo = await this.prisma.todo.findUnique({
      where: { id: data.id },
    });

    if (!existingTodo) {
      throw new NotFoundException('Todo未找到');
    }

    if (existingTodo.createdById !== userId) {
      throw new ForbiddenException('无权删除此todo');
    }

    await this.prisma.todo.delete({
      where: { id: data.id },
    });

    return { success: true };
  }
}
