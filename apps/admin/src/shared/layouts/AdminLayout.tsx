import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Menu, Dropdown, Avatar, Space, Spin } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  FolderOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import type { MenuProps } from "antd";
import "./AdminLayout.css";

const { Header, Content, Sider } = Layout;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "仪表盘",
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "/todo",
      icon: <CheckSquareOutlined />,
      label: "待办事项",
      onClick: () => navigate("/todo"),
    },
        {
      key: "/categories",
      icon: <FolderOutlined />,
      label: "分类管理",
      onClick: () => navigate("/categories"),
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: "用户管理",
      onClick: () => navigate("/users"),
    },
    {
      key: "/roles",
      icon: <TeamOutlined />,
      label: "角色管理",
      onClick: () => navigate("/roles"),
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="admin-layout">
      <Sider theme="dark" className="admin-sider">
        <div className="admin-logo">
          Admin Panel
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={["/dashboard"]}
          items={menuItems}
          theme="dark"
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <div className="admin-header-title">管理系统</div>
          <Space>
            <span className="admin-username">{user?.username || '用户'}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                className="admin-avatar"
              />
            </Dropdown>
          </Space>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
