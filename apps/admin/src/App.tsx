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
import { WxUserListPage } from "./modules/wx-user";
import { AdminUserListPage } from "./modules/admin-user";
import { RoleListPage, RoleDetailPage } from "./modules/role";
import { CategoryListPage } from "./modules/category";
import { TicketListPage, TicketDetailPage } from "./modules/ticket";
import { DepartmentListPage } from "./modules/department";
import { AreaListPage } from "./modules/area";
import { HandlerListPage, HandlerDetailPage } from "./modules/handler";

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
                  client: queryClient,
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
                  name: "wx-user",
                  list: "/wx-users",
                },
                {
                  name: "admin-user",
                  list: "/admin-users",
                },
                {
                  name: "role",
                  list: "/roles",
                },
                {
                  name: "category",
                  list: "/categories",
                },
                {
                  name: "ticket",
                  list: "/tickets",
                },
                {
                  name: "department",
                  list: "/departments",
                },
                {
                  name: "area",
                  list: "/areas",
                },
                {
                  name: "handler",
                  list: "/handlers",
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
                  <Route path="wx-users" element={<WxUserListPage />} />
                  <Route path="admin-users" element={<AdminUserListPage />} />
                  <Route path="roles" element={<RoleListPage />} />
                  <Route path="roles/:id" element={<RoleDetailPage />} />
                  <Route path="categories" element={<CategoryListPage />} />
                  <Route path="tickets" element={<TicketListPage />} />
                  <Route path="tickets/:id" element={<TicketDetailPage />} />
                  <Route path="departments" element={<DepartmentListPage />} />
                  <Route path="areas" element={<AreaListPage />} />
                  <Route path="handlers" element={<HandlerListPage />} />
                  <Route path="handlers/:id" element={<HandlerDetailPage />} />
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
