import React, { useEffect, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Dropdown, Avatar, Space, Spin } from "antd";
import {
  DashboardOutlined,
  CheckSquareOutlined,
  UserOutlined,
  TeamOutlined,
  FolderOutlined,
  LogoutOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  BankOutlined,
  ToolOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  ControlOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import { useAuth } from "../auth/AuthContext";
import type { MenuProps } from "antd";
import "./AdminLayout.css";

const { Header, Content, Sider } = Layout;

// Define menu items outside component to prevent recreation
const createMenuItems = (navigate: (path: string) => void) => [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "仪表盘",
    onClick: () => navigate("/dashboard"),
  },
  {
    key: "/tickets",
    icon: <FileTextOutlined />,
    label: "工单管理",
    onClick: () => navigate("/tickets"),
  },
  {
    type: "divider",
  },
  {
    key: "organization",
    icon: <ApartmentOutlined />,
    label: "组织架构",
    children: [
      {
        key: "/departments",
        icon: <BankOutlined />,
        label: "部门管理",
        onClick: () => navigate("/departments"),
      },
      {
        key: "/handlers",
        icon: <ToolOutlined />,
        label: "办事员管理",
        onClick: () => navigate("/handlers"),
      },
    ],
  },
  {
    key: "basic-config",
    icon: <SettingOutlined />,
    label: "基础配置",
    children: [
      {
        key: "/areas",
        icon: <EnvironmentOutlined />,
        label: "地点管理",
        onClick: () => navigate("/areas"),
      },
      {
        key: "/categories",
        icon: <FolderOutlined />,
        label: "分类管理",
        onClick: () => navigate("/categories"),
      },
    ],
  },
  {
    type: "divider",
  },
  {
    key: "system",
    icon: <ControlOutlined />,
    label: "系统管理",
    children: [
      {
        key: "/wx-users",
        icon: <WechatOutlined />,
        label: "微信用户",
        onClick: () => navigate("/wx-users"),
      },
      {
        key: "/admin-users",
        icon: <UserOutlined />,
        label: "后台管理员",
        onClick: () => navigate("/admin-users"),
      },
      {
        key: "/roles",
        icon: <TeamOutlined />,
        label: "角色管理",
        onClick: () => navigate("/roles"),
      },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // All hooks must be called before any early returns
  // Memoize menu items to prevent recreation
  const menuItems = useMemo(() => createMenuItems(navigate), [navigate]);

  // Get current selected key based on location
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    // Check if any menu key matches the current path
    const findKey = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.key === path) return item.key;
        if (item.children) {
          const found = findKey(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findKey(menuItems) || "/dashboard";
  }, [location.pathname, menuItems]);

  // Get current open keys for submenus based on location
  const openKeys = useMemo(() => {
    const path = location.pathname;
    const findParent = (items: any[]): string[] => {
      for (const item of items) {
        if (item.children) {
          for (const child of item.children) {
            if (child.key === path) return [item.key];
            // Check nested children
            if (child.children) {
              const found = findParent([child]);
              if (found.length > 0) return [item.key, ...found];
            }
          }
        }
      }
      return [];
    };
    return findParent(menuItems);
  }, [location.pathname, menuItems]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle logout - must be before early returns
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  // User menu items - must be before early returns
  const userMenuItems: MenuProps['items'] = useMemo(() => [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ], [handleLogout]);

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

  return (
    <Layout className="admin-layout">
      <Sider theme="dark" className="admin-sider">
        <div className="admin-logo">
          Admin Panel
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={openKeys}
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
