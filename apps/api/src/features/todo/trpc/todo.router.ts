import { router, publicProcedure } from "../../../shared/trpc/trpc";
import { TodoSchema } from "@opencode/shared";
import { TRPCError } from "@trpc/server";

export const todoRouter = router({
  getMany: publicProcedure
    .input(TodoSchema.getManyInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10 } = input;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ctx.prisma.todo.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        ctx.prisma.todo.count(),
      ]);

      return { items, total, page, limit };
    }),

  getOne: publicProcedure
    .input(TodoSchema.getOneInput)
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.todo.findUnique({
        where: { id: input.id },
      });

      if (!item) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Todo not found',
        });
      }

      return item;
    }),

  createOne: publicProcedure
    .input(TodoSchema.createInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.todo.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          isCompleted: input.isCompleted ?? false,
          dueDate: input.dueDate,
        },
      });
    }),

  updateOne: publicProcedure
    .input(TodoSchema.updateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.todo.update({
        where: { id },
        data,
      });
    }),

  deleteOne: publicProcedure
    .input(TodoSchema.deleteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.todo.delete({
        where: { id: input.id },
      });
    }),
});
