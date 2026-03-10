import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Refine } from "@refinedev/core";
import { ConfigProvider, message } from "antd";
import zhCN from "antd/locale/zh_CN";
import { useState } from "react";

import { dataProvider } from "./shared/dataProvider";
import { authProvider } from "./shared/auth";
import { AuthProvider } from "./shared/auth";
import { LoginPage, SessionExpiredPage, NotFoundPage } from "./modules/auth";
import { AdminLayout } from "./shared/layouts";
import { DashboardPage } from "./modules/dashboard";
import { TodoListPage } from "./modules/todo";
import { RoleListPage, RoleDetailPage } from "./modules/role";
import { UserListPage, UserDetailPage } from "./modules/user";

// Create QueryClient outside component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [isReady, setIsReady] = useState(true);

  if (!isReady) {
    return null;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <AuthProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              options={{
                reactQuery: {
                  clientConfig: queryClient,
                },
                notification: {
                  success: (msg: unknown) => {
                    if (typeof msg === "string") {
                      message.success(msg);
                    }
                  },
                  error: (msg: unknown) => {
                    const errorMsg = typeof msg === "string" ? msg : "操作失败";
                    message.error(errorMsg);
                  },
                },
              }}
              resources={[
                {
                  name: "dashboard",
                  list: "/dashboard",
                },
                {
                  name: "todo",
                  list: "/todo",
                },
                {
                  name: "user",
                  list: "/users",
                },
                {
                  name: "role",
                  list: "/roles",
                },
              ]}
            >
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/unauthorized" element={<SessionExpiredPage />} />
                <Route path="/" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="todo" element={<TodoListPage />} />
                  <Route path="users" element={<UserListPage />} />
                  <Route path="users/:id" element={<UserDetailPage />} />
                  <Route path="roles" element={<RoleListPage />} />
                  <Route path="roles/:id" element={<RoleDetailPage />} />
                </Route>
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Refine>
          </AuthProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
