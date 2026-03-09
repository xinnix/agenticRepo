import type { AppRouter } from "../../types/api";
import { createTRPCProxyClient, httpLink } from "@trpc/client";

/**
 * Shared tRPC client configuration
 *
 * Environment Configuration:
 * - Development: Uses relative path `/trpc`, proxied by Vite to localhost:3000
 * - Production: Uses relative path `/trpc`, proxied by Nginx to api:3000
 * - See vite.config.ts (dev) and nginx.conf (prod) for proxy configuration
 *
 * This client is used by both dataProvider and authProvider
 */
export const createTrpcClient = () => {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpLink({
        url: import.meta.env.VITE_API_URL || "/trpc",
        headers: () => {
          const token = localStorage.getItem("accessToken");
          return {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
        },
      }),
    ],
  });
};

// Singleton instance for reuse
let clientInstance: ReturnType<typeof createTrpcClient> | null = null;

export const getTrpcClient = () => {
  if (!clientInstance) {
    clientInstance = createTrpcClient();
  }
  return clientInstance;
};
