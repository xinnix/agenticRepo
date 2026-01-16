import { router, publicProcedure } from "../../../shared/trpc/trpc";
import { z } from "zod";
import { TestSchema } from "@opencode/shared";
import { TRPCError } from "@trpc/server";

export const testRouter = router({
  getMany: publicProcedure
    .input(TestSchema.getManyInput)
    .query(async ({ ctx, input }) => {
      const { page = 1, limit = 10 } = input;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ctx.prisma.test.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        ctx.prisma.test.count(),
      ]);

      return { items, total, page, limit };
    }),

  getOne: publicProcedure
    .input(TestSchema.getOneInput)
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.test.findUnique({
        where: { id: input.id },
      });
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Test not found' });
      }
      return item;
    }),

  create: publicProcedure
    .input(TestSchema.createInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.test.create({
        data: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: publicProcedure
    .input(TestSchema.updateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.test.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
    }),

  deleteOne: publicProcedure
    .input(TestSchema.deleteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.test.delete({
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
