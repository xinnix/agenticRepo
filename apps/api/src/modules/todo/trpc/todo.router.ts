import {
  CreateTodoSchema,
  UpdateTodoSchema,
  TodoListQuerySchema
} from '@opencode/shared';
import { createCrudRouter } from '../../../trpc/trpc.helper';
import { z } from 'zod';

/**
 * Todo tRPC Router
 *
 * This router is auto-generated using createCrudRouter factory function.
 * All standard CRUD operations (getMany, getOne, createOne, updateOne, deleteOne, deleteMany)
 * are automatically provided.
 *
 * To add custom procedures, use createCrudRouterWithCustom instead.
 */
export const todoRouter = createCrudRouter(
  'Todo',  // Prisma model name (capitalized)
  {
    create: CreateTodoSchema,
    update: UpdateTodoSchema,
    getMany: TodoListQuerySchema,
  },
  {
    // Require authentication for mutations
    protectedCreate: true,
    protectedUpdate: true,
    protectedDelete: true,
    protectedDeleteMany: true,
  }
);
