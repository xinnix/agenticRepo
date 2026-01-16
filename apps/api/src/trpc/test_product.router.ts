import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { TestProductSchema } from "@opencode/shared";
import { TRPCError } from "@trpc/server";

export const testproductRouter = router({
  getMany: publicProcedure
    .input(TestProductSchema.getManyInput.optional())
    .query(async ({ ctx, input }) => {
      const params = input || {};
      const { page = 1, limit = 10, ...filter } = params;
      const skip = (page - 1) * limit;

      const where = buildWhereClause(filter);

      const [items, total] = await Promise.all([
        ctx.prisma.testproduct.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        ctx.prisma.testproduct.count({ where }),
      ]);

      return { items, total, page, limit };
    }),

  getOne: publicProcedure
    .input(TestProductSchema.getOneInput)
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.testproduct.findUnique({
        where: { id: input.id },
      });
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'TestProduct not found' });
      }
      return item;
    }),

  create: publicProcedure
    .input(TestProductSchema.createInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.testproduct.create({
        data: {
          ...input,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }),

  update: publicProcedure
    .input(TestProductSchema.updateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.testproduct.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
    }),

  deleteOne: publicProcedure
    .input(TestProductSchema.deleteInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.testproduct.delete({
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
