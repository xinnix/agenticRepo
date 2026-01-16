import type { AppRouter } from "../../types/api";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";

// Create QueryClient for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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

console.log("dataProvider module loaded");

// Custom tRPC data provider for Refine
export const dataProvider = {
  getList: async ({ resource, pagination }: any) => {
    console.log("dataProvider.getList called:", { resource, pagination });
    const { page = 1, pageSize = 10 } = pagination || {};

    console.log("Calling tRPC:", `${resource}.getMany`);

    // Call the query procedure
    const result = await trpcClient[resource].getMany.query({
      page,
      limit: pageSize,
    });

    console.log("tRPC result:", result);

    // Handle different response formats from backend
    // todo router returns: { items, total, page, limit }
    // user/role routers return: { data, total, page, pageSize }
    const items = result.items || result.data || [];
    const total = result.total || 0;

    const finalResult = {
      data: items,
      total: total,
    };

    console.log("dataProvider returning:", finalResult);
    return finalResult;
  },

  getOne: async ({ resource, id }: any) => {
    const result = await trpcClient[resource].getOne.query({ id });
    return { data: result };
  },

  create: async ({ resource, variables, meta }: any) => {
    // Handle special cases like toggleActive
    if (meta?.method === "toggleActive") {
      const result = await trpcClient[resource].toggleActive.mutate({ id: variables.id || variables });
      return { data: result };
    }

    const result = await trpcClient[resource].create.mutate(variables);
    return { data: result };
  },

  update: async ({ resource, id, variables, meta }: any) => {
    // Handle special cases like toggleActive
    if (meta?.method === "toggleActive") {
      const result = await trpcClient[resource].toggleActive.mutate({ id });
      return { data: result };
    }

    // user/role routers expect { id, data } format
    if (resource === "user" || resource === "role") {
      const result = await trpcClient[resource].update.mutate({
        id,
        data: variables,
      });
      return { data: result };
    }

    // todo router expects { id, ...variables } format
    const result = await trpcClient[resource].update.mutate({
      id,
      ...variables,
    });
    return { data: result };
  },

  deleteOne: async ({ resource, id }: any) => {
    const result = await trpcClient[resource].deleteOne.mutate({ id });
    return { data: result };
  },

  deleteMany: async ({ resource, ids }: any) => {
    const result = await trpcClient[resource].deleteMany.mutate({ ids });
    return { data: result };
  },

  getApiUrl: () => "http://localhost:3000/trpc",
};
