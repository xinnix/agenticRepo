import type { AppRouter } from "../../types/api";
import { createTRPCProxyClient, httpLink, TRPCClientError } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import { message, Modal } from "antd";

// Create QueryClient for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Handle tRPC errors with global message notification
 */
function handleTRPCError(error: unknown) {
  if (error instanceof TRPCClientError) {
    const errorMessage = error.data?.message || error.message || "操作失败，请稍后重试";

    // Handle different error codes
    const errorShape = error.data;
    if (errorShape?.code) {
      switch (errorShape.code) {
        case "UNAUTHORIZED":
          // Show modal for unauthorized error with login redirect
          Modal.error({
            title: "未授权访问",
            content: "您的登录已过期，请重新登录后继续操作",
            okText: "前往登录",
            onOk: () => {
              window.location.href = "/login";
            },
            maskClosable: false,
            keyboard: false, // Disable ESC key to prevent accidental close
          });
          break;
        case "FORBIDDEN":
          message.error("没有权限执行此操作");
          break;
        case "NOT_FOUND":
          message.error("请求的资源不存在");
          break;
        case "CONFLICT":
          message.error(errorMessage);
          break;
        case "BAD_REQUEST":
          message.error(errorMessage);
          break;
        case "INTERNAL_SERVER_ERROR":
          message.error("服务器错误，请稍后重试");
          break;
        default:
          message.error(errorMessage);
      }
    } else {
      // Network error or other errors
      if (error.message.includes("ECONNREFUSED")) {
        message.error("无法连接到服务器，请检查网络连接");
      } else {
        message.error(errorMessage);
      }
    }
  } else if (error instanceof Error) {
    message.error(error.message || "操作失败，请稍后重试");
  } else {
    message.error("操作失败，请稍后重试");
  }
}

// Create a standalone tRPC client for data provider
// Use httpLink for single requests instead of batch
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpLink({
      url: "http://localhost:3000/trpc",
      headers: () => {
        const token = localStorage.getItem("accessToken");
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },
    }),
  ],
});

/**
 * Custom tRPC data provider for Refine
 *
 * This provider uses the unified CRUD router format from createCrudRouter.
 * All routers generated with createCrudRouter have consistent input/output formats:
 *
 * - getMany: { items, total, page, pageSize, totalPages }
 * - getOne: record (direct)
 * - create: input { data, include?, select? } -> record (direct)
 * - update: input { id, data, include?, select? } -> record (direct)
 * - delete: record (direct)
 * - deleteMany: { count }
 */
export const dataProvider = {
  /**
   * Get a paginated list of records
   */
  getList: async ({ resource, pagination, filters, sorters }: any) => {
    try {
      const { page = 1, pageSize = 10 } = pagination || {};

      // Build where clause from filters
      const where: any = {};
      if (filters?.length) {
        for (const filter of filters) {
          if (filter.field && filter.value !== undefined) {
            // Handle different filter operators
            if (filter.operator === "contains") {
              where[filter.field] = { contains: filter.value };
            } else if (filter.operator === "eq") {
              where[filter.field] = filter.value;
            } else {
              where[filter.field] = filter.value;
            }
          }
        }
      }

      // Build orderBy from sorters
      let orderBy: any = {};
      if (sorters?.length) {
        const sorter = sorters[0];
        orderBy = { [sorter.field]: sorter.order === "asc" ? "asc" : "desc" };
      }

      // Call the getMany procedure with unified format
      const result = await (trpcClient as any)[resource].getMany.query({
        page,
        limit: pageSize,
        where,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : undefined,
      });

      // Result format from createCrudRouter: { items, total, page, pageSize, totalPages }
      return {
        data: result.items || [],
        total: result.total || 0,
      };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Get a single record by ID
   */
  getOne: async ({ resource, id, meta }: any) => {
    try {
      const result = await (trpcClient as any)[resource].getOne.query({
        id,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Create a new record
   *
   * Input format for createCrudRouter: { data, include?, select? }
   */
  create: async ({ resource, variables, meta }: any) => {
    try {
      // Handle special procedures (non-CRUD)
      if (meta?.method) {
        const result = await (trpcClient as any)[resource][meta.method].mutate(variables);
        return { data: result };
      }

      // Standard create with new format
      const result = await (trpcClient as any)[resource].create.mutate({
        data: variables,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Update an existing record
   *
   * Input format for createCrudRouter: { id, data, include?, select? }
   */
  update: async ({ resource, id, variables, meta }: any) => {
    try {
      // Handle special procedures (non-CRUD)
      if (meta?.method) {
        const result = await (trpcClient as any)[resource][meta.method].mutate({ id, ...variables });
        return { data: result };
      }

      // Standard update with new format
      const result = await (trpcClient as any)[resource].update.mutate({
        id,
        data: variables,
        include: meta?.include,
        select: meta?.select,
      });

      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Delete a single record
   */
  deleteOne: async ({ resource, id }: any) => {
    try {
      const result = await (trpcClient as any)[resource].delete.mutate({ id });
      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Delete multiple records
   */
  deleteMany: async ({ resource, ids }: any) => {
    try {
      const result = await (trpcClient as any)[resource].deleteMany.mutate({ ids });
      return { data: result };
    } catch (error) {
      handleTRPCError(error);
      throw error;
    }
  },

  /**
   * Get the API URL
   */
  getApiUrl: () => "http://localhost:3000/trpc",
};
