import { PartialType } from '@nestjs/swagger';
import { CreateTodoSchema } from '@opencode/shared';
import { z } from 'zod';

// Infer types from Zod schemas
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const UpdateTodoSchema = CreateTodoSchema.partial();
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
