import { createCrudRouter } from '../../../trpc/trpc.helper';
import { CategorySchema } from '@opencode/shared';

export const categoryRouter = createCrudRouter(
  'Category',
  {
    create: CategorySchema.createInput,
    update: CategorySchema.updateInput,
    getMany: CategorySchema.getManyInput,
    getOne: CategorySchema.getOneInput,
  }
);
