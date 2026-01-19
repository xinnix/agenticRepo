import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Refine } from "@refinedev/core";
import { ConfigProvider, message } from "antd";
import zhCN from "antd/locale/zh_CN";

import { dataProvider, queryClient } from "./shared/dataProvider";
import { authProvider } from "./shared/auth";
import { AuthProvider } from "./shared/auth";
import { LoginPage, NotFoundPage } from "./modules/auth";
import { AdminLayout } from "./shared/layouts";
import { DashboardPage } from "./modules/dashboard";
import { TodoListPage } from "./modules/todo";
import { UserListPage, UserDetailPage } from "./modules/user";
import { RoleListPage, RoleDetailPage } from "./modules/role";
import { CategoryListPage } from "./modules/category";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            options={{
              reactQuery: {
                config: {
                  queries: {
                    retry: 1,
                    refetchOnWindowFocus: false,
                  },
                },
              },
              notification: {
                success: (msg) => {
                  if (typeof msg === "string") {
                    message.success(msg);
                  }
                },
                error: (msg) => {
                  const errorMsg = typeof msg === "string" ? msg : "操作失败";
                  message.error(errorMsg);
                },
              },
            }}
            resources={[
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
                                        {
                name: "category",
                list: "/categories",
              },
]}
          >
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="todo" element={<TodoListPage />} />
                  <Route path="users" element={<UserListPage />} />
                  <Route path="users/:id" element={<UserDetailPage />} />
                  <Route path="roles" element={<RoleListPage />} />
                  <Route path="roles/:id" element={<RoleDetailPage />} />
                                  <Route path="categories" element={<CategoryListPage />} />
</Route>
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </Refine>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
