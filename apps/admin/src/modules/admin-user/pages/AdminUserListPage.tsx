import { useState } from "react";
import { useList, useUpdate, useDelete, useCreate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { RoleAssignmentModal } from "../../user/components/RoleAssignmentModal";

interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  assignedAt?: Date;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles: Role[];
}

export const AdminUserListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AdminUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();
  const { mutate: create } = useCreate();
  const { result, query } = useList<AdminUser>({
    resource: "user",
    pagination: {
      pageSize: 10,
    },
    meta: {
      method: "getAdminUsers",
    },
    filters: [
      ...(searchText ? [{ field: "search", operator: "contains" as const, value: searchText }] : []),
      ...(isActiveFilter !== undefined ? [{ field: "isActive", operator: "eq" as const, value: isActiveFilter }] : []),
      ...(roleFilter ? [{ field: "roleSlug", operator: "eq" as const, value: roleFilter }] : []),
    ],
  });

  const users = result?.data || [];
  const total = result?.total || 0;

  // Calculate statistics
  const totalActive = users.filter((u) => u.isActive).length;
  const totalSuperAdmin = users.filter((u) => u.roles.some((r) => r.slug === "super_admin")).length;
  const totalAdmin = users.filter((u) => u.roles.some((r) => r.slug === "admin")).length;

  const handleToggleActive = async (record: AdminUser) => {
    update(
      {
        resource: "user",
        id: record.id,
        values: { isActive: !record.isActive },
        meta: {
          method: "toggleActive",
        },
      },
      {
        onSuccess: () => {
          message.success(record.isActive ? "用户已停用" : "用户已激活");
          query.refetch();
        },
        onError: () => {
          message.error("操作失败");
        },
      }
    );
  };

  const handleManageRoles = (record: AdminUser) => {
    setSelectedUser(record);
    setIsRoleModalVisible(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: AdminUser) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        update(
          {
            resource: "user",
            id: editingRecord.id,
            values: values,
          },
          {
            onSuccess: () => {
              message.success("更新成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: (error: any) => {
              message.error("更新失败");
            },
          }
        );
      } else {
        create(
          {
            resource: "user",
            values: values,
            meta: {
              method: "createAdminUser",
            },
          },
          {
            onSuccess: () => {
              message.success("创建成功");
              setIsModalVisible(false);
              query.refetch();
            },
            onError: (error: any) => {
              message.error("创建失败");
            },
          }
        );
      }
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  const handleDelete = (id: string) => {
    deleteOne(
      {
        resource: "user",
        id: id,
      },
      {
        onSuccess: () => {
          message.success("删除成功");
          query.refetch();
        },
        onError: () => {
          message.error("删除失败");
        },
      }
    );
  };

  const columns = [
    {
      title: "用户",
      key: "user",
      width: 200,
      render: (_: any, record: AdminUser) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: "bold" }}>{record.username}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "姓名",
      key: "name",
      width: 120,
      render: (_: any, record: AdminUser) => {
        const fullName = [record.firstName, record.lastName].filter(Boolean).join(" ");
        return fullName || "-";
      },
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 180,
      render: (roles: Role[]) => (
        <Space size={4} wrap>
          {roles.map((role) => (
            <Tag
              key={role.id}
              color={
                role.slug === "super_admin"
                  ? "red"
                  : role.slug === "admin"
                  ? "orange"
                  : "default"
              }
            >
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      width: 90,
      render: (isActive: boolean, record: AdminUser) => (
        <Button
          size="small"
          type="text"
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
          style={{ color: isActive ? "#52c41a" : "#ff4d4f" }}
          onClick={() => handleToggleActive(record)}
        >
          {isActive ? "激活" : "停用"}
        </Button>
      ),
    },
    {
      title: "最后登录",
      dataIndex: "lastLoginAt",
      width: 160,
      render: (date?: Date) => (date ? new Date(date).toLocaleString("zh-CN") : "从未登录"),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 160,
      render: (date: Date) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 240,
      render: (_: any, record: AdminUser) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => handleManageRoles(record)}>
            角色
          </Button>
          <Popconfirm
            title="确认删除？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" type="link" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: "bold" }}>
            <UserOutlined /> 后台管理员管理
          </h1>
          <p style={{ margin: 0, color: "#666" }}>
            管理通过后台登录的管理员，包括总管理员和部门管理员
          </p>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总管理员"
                value={total}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="激活中"
                value={totalActive}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总管理员"
                value={totalSuperAdmin}
                valueStyle={{ color: "#f5222d" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="部门管理员"
                value={totalAdmin}
                valueStyle={{ color: "#fa8c16" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Header with actions */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size="middle">
                <Input
                  placeholder="搜索用户名或邮箱"
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ width: 250 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                  placeholder="筛选状态"
                  value={isActiveFilter}
                  onChange={setIsActiveFilter}
                  style={{ width: 120 }}
                  allowClear
                >
                  <Select.Option value={true}>激活</Select.Option>
                  <Select.Option value={false}>停用</Select.Option>
                </Select>
                <Select
                  placeholder="筛选角色"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  style={{ width: 150 }}
                  allowClear
                >
                  <Select.Option value="super_admin">总管理员</Select.Option>
                  <Select.Option value="admin">部门管理员</Select.Option>
                </Select>
                <Button
                  onClick={() => {
                    setSearchText("");
                    setIsActiveFilter(undefined);
                    setRoleFilter(undefined);
                  }}
                >
                  重置筛选
                </Button>
              </Space>
            </Col>
            <Col>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新建管理员
              </Button>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          rowKey="id"
          dataSource={users}
          loading={query.isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />

        {/* Create/Edit Modal */}
        <Modal
          title={editingRecord ? "编辑管理员" : "新建管理员"}
          open={isModalVisible}
          onOk={handleSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText="确定"
          cancelText="取消"
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: "请输入用户名" },
                { min: 3, message: "用户名至少3个字符" },
              ]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: "请输入邮箱" },
                { type: "email", message: "请输入有效的邮箱地址" },
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            {!editingRecord && (
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: "请输入密码" },
                  { min: 8, message: "密码至少8个字符" },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            )}
            <Form.Item name="firstName" label="名">
              <Input placeholder="请输入名" />
            </Form.Item>
            <Form.Item name="lastName" label="姓">
              <Input placeholder="请输入姓" />
            </Form.Item>
          </Form>
        </Modal>

        <RoleAssignmentModal
          open={isRoleModalVisible}
          user={selectedUser}
          onCancel={() => {
            setIsRoleModalVisible(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            query.refetch();
          }}
        />
      </List>
    </div>
  );
};
