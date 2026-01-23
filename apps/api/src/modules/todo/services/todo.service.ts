import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BaseService } from '../../../common/base.service';

/**
 * Todo Service - Generic CRUD implementation
 *
 * This service extends BaseService which provides all standard CRUD operations.
 * Override methods here for custom logic specific to todos.
 *
 * @example
 * ```typescript
 * // Override beforeCreate to add custom validation
 * protected async beforeCreate(data: any) {
 *   // Add custom logic here
 *   return data;
 * }
 * ```
 */
@Injectable()
export class TodoService extends BaseService<'Todo'> {
  constructor(prisma: PrismaService) {
    super(prisma, 'Todo');
  }

  // Override methods below for custom Todo-specific logic
  // Most CRUD operations are handled by BaseService

  // Example: Custom method to get completed todos
  // async getCompletedTodos(userId: string) {
  //   const result = await this.list({
  //     where: { createdById: userId, isCompleted: true },
  //     orderBy: { completedAt: 'desc' },
  //   });
  //   return result;
  // }
}
