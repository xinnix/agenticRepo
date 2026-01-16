import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Layout, Menu, Dropdown, Avatar, Space } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import type { MenuProps } from "antd";

const { Header, Content, Sider } = Layout;

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="light">
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 18 }}>
          Admin Panel
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={["/dashboard"]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>管理系统</div>
          <Space>
            <span style={{ marginRight: 8 }}>{user?.username || '用户'}</span>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: "24px", padding: 24, background: "#fff", borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
