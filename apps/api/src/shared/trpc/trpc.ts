import { initTRPC } from '@trpc/server';
import { PrismaService } from '../../prisma.service';

// 全局变量存储 PrismaService 实例
let prismaService: PrismaService;

// 设置 PrismaService 实例的函数（由 main.ts 调用）
export const setPrismaService = (service: PrismaService) => {
  prismaService = service;
};

// 定义上下文类型
export type Context = {
  prisma: PrismaService;
};

// 创建上下文的工厂函数
export const createTRPCContext = async ({ req, res }: any): Promise<Context> => {
  return {
    prisma: prismaService,
  };
};

// 初始化 tRPC with context
const t = initTRPC.context<Context>().create();

// 导出路由器创建器和一些中间件
export const router = t.router;
export const publicProcedure = t.procedure;

// 导出中间件
export const protectedProcedure = t.procedure;

// RBAC 过程 - 暂时返回 publicProcedure，后续可扩展权限检查
export const roleProcedure = (role?: string) => publicProcedure;
export const permissionProcedure = (resource?: string, action?: string) => publicProcedure;
