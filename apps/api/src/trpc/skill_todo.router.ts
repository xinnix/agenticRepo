import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { SkillTodoSchema } from "@opencode/shared";
import { TRPCError } from "@trpc/server";

export const skilltodoRouter = router({
  getMany: publicProcedure
    .input(SkillTodoSchema.getManyInput.optional())
    .query(async ({ ctx, input }) => {
      const params = input || {};
      const { page = 1, limit = 10, ...filter } = params;
      const skip = (page - 1) * limit;

      const where = buildWhereClause(filter);

      const [items, total] = await Promise.all([
        ctx.prisma.skilltodo.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        ctx.prisma.skilltodo.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getOne: publicProcedure
    .input(SkillTodoSchema.getOneInput)
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.skilltodo.findUnique({
        where: { id: input.id },
      });
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'SkillTodo not found' });
      }
      return item;
    }),

  create: publicProcedure
    .input(SkillTodoSchema.createInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.skilltodo.create({
        data: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: publicProcedure
    .input(SkillTodoSchema.updateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.skilltodo.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
    }),

  deleteOne: publicProcedure
    .input(SkillTodoSchema.deleteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.skilltodo.delete({
        where: { id: input.id },
      });
    }),
});

function buildWhereClause(filter: any): any {
  if (!filter) return {};

  const where: any = {};
  Object.keys(filter).forEach(key => {
    if (filter[key] !== undefined && filter[key] !== null) {
      where[key] = { contains: filter[key], mode: 'insensitive' };
    }
  });

  return where;
}
