import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Refine } from "@refinedev/core";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

import { dataProvider, queryClient } from "./shared/dataProvider";
import { authProvider } from "./shared/auth";
import { AuthProvider } from "./shared/auth";
import { LoginPage } from "./modules/auth";
import { AdminLayout } from "./shared/layouts";
import { DashboardPage } from "./modules/dashboard";
import { TodoListPage } from "./modules/todo";
import { UserListPage, UserDetailPage } from "./modules/user";
import { RoleListPage, RoleDetailPage } from "./modules/role";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <AuthProvider>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
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
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </Refine>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
