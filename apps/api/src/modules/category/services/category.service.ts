import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AssignType } from '@opencode/database';

// 递归树结构
export interface CategoryTree {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  sortOrder?: number;
  status: string;
  level: number;
  assignType: AssignType;
  deadlineDays?: number | null;
  createdAt: Date;
  updatedAt: Date;
  children: CategoryTree[];
}

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取分类列表（分页）
   */
  async getMany(params: {
    page?: number;
    limit?: number;
    status?: string;
    parentId?: string;
    level?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, parentId, level, search } = params;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    if (level !== undefined) {
      where.level = typeof level === 'string' ? parseInt(level) : level;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.category.count({ where }),
      this.prisma.category.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取分类详情
   */
  async getOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    return category;
  }

  /**
   * 获取分类树
   */
  async getTree(params: {
    status?: string;
    level?: number;
  }): Promise<CategoryTree[]> {
    const { status, level } = params;

    const where: any = {
      parentId: null, // 只获取根节点
    };

    if (status) {
      where.status = status;
    }

    if (level !== undefined) {
      where.level = typeof level === 'string' ? parseInt(level) : level;
    }

    const roots = await this.prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    // 递归构建树
    const buildTree = async (parentId: string | null): Promise<CategoryTree[]> => {
      const children = await this.prisma.category.findMany({
        where: {
          parentId,
          ...(status ? { status } : {}),
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      });

      const result: CategoryTree[] = [];
      for (const child of children) {
        const category = child as CategoryTree;
        category.children = await buildTree(category.id);
        result.push(category);
      }

      return result;
    };

    const tree: CategoryTree[] = [];
    for (const root of roots) {
      const category = root as CategoryTree;
      category.children = await buildTree(category.id);
      tree.push(category);
    }

    return tree;
  }

  /**
   * 创建分类
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    icon?: string;
    sortOrder?: number;
    status?: string;
    assignType?: AssignType;
    deadlineDays?: number | null;
  }) {
    // 计算层级
    let level = 1;
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (parent) {
        level = parent.level + 1;
      }
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        icon: data.icon,
        sortOrder: data.sortOrder,
        status: data.status,
        assignType: data.assignType,
        deadlineDays: data.deadlineDays,
        level,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  /**
   * 更新分类
   */
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      parentId?: string;
      icon?: string;
      sortOrder?: number;
      status?: string;
      assignType?: AssignType;
      deadlineDays?: number | null;
    },
  ) {
    // 检查是否存在
    await this.getOne(id);

    // 如果更新父级，重新计算层级
    let level = undefined;
    if (data.parentId !== undefined) {
      if (data.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: data.parentId },
        });
        if (parent) {
          level = parent.level + 1;
        }
      } else {
        level = 1;
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...data,
        level,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  /**
   * 删除分类
   */
  async delete(id: string) {
    // 检查是否有子分类
    const children = await this.prisma.category.count({
      where: { parentId: id },
    });

    if (children > 0) {
      throw new Error('该分类下有子分类，无法删除');
    }

    // 检查是否有关联的工单
    const tickets = await this.prisma.ticket.count({
      where: { categoryId: id },
    });

    if (tickets > 0) {
      throw new Error('该分类下有关联的工单，无法删除');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  /**
   * 批量删除分类
   */
  async deleteMany(ids: string[]) {
    // 检查是否有子分类或关联工单
    for (const id of ids) {
      const children = await this.prisma.category.count({
        where: { parentId: id },
      });

      if (children > 0) {
        throw new Error(`分类 ${id} 下有子分类，无法删除`);
      }

      const tickets = await this.prisma.ticket.count({
        where: { categoryId: id },
      });

      if (tickets > 0) {
        throw new Error(`分类 ${id} 下有关联的工单，无法删除`);
      }
    }

    return this.prisma.category.deleteMany({
      where: { id: { in: ids } },
    });
  }
}
