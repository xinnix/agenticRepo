import type { AuthProvider } from "@refinedev/core";
import { getTrpcClient } from "../trpc/trpcClient";

// Get shared tRPC client
const trpcClient = getTrpcClient();

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      // Use tRPC mutation - returns data directly
      const result = await (trpcClient as any).auth.adminLogin.mutate({
        email,
        password,
      });

      // Store auth data
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("user", JSON.stringify(result.user));

      return Promise.resolve({
        success: true,
      });
    } catch (error: any) {
      return Promise.resolve({
        success: false,
        error: {
          name: "Login Error",
          message: error.message || "Login failed",
        },
      });
    }
  },

  check: async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return Promise.resolve({
        authenticated: true,
      });
    }
    return Promise.resolve({
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    });
  },

  logout: async (_params: any) => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return Promise.resolve({
      success: true,
      redirectTo: "/login",
    });
  },

  onError: async (error: any) => {
    // Check tRPC error structure
    const trpcCode = error?.data?.code;
    const httpStatus = error?.data?.httpStatus;
    // Also check standard HTTP error structure
    const status = error?.status || error?.statusCode;

    if (trpcCode === "UNAUTHORIZED" || httpStatus === 401 || status === 401) {
      return Promise.resolve({
        logout: true,
        redirectTo: "/login",
      });
    }
    return Promise.resolve({});
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return Promise.resolve([]);
    }

    const user = JSON.parse(userStr);
    return Promise.resolve(user.permissions || []);
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      return Promise.reject();
    }

    const user = JSON.parse(userStr);
    return Promise.resolve({
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
    });
  },
};
