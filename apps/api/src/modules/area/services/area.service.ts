import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WxacodeService } from './wxacode.service';

@Injectable()
export class AreaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wxacodeService: WxacodeService,
  ) {}

  async getMany(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    departmentId?: string;
  }) {
    const { page = 1, limit = 100, ...filters } = params;

    const where: any = {};
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const [items, total] = await Promise.all([
      this.prisma.presetArea.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.presetArea.count({ where }),
    ]);

    return items;
  }

  async getOne(id: string) {
    return this.prisma.presetArea.findUnique({
      where: { id },
    });
  }

  async getByScene(scene: string) {
    return this.wxacodeService.getAreaByScene(scene);
  }
}
