// apps/admin/src/modules/user/pages/UserListPage.tsx
import { useState } from "react";
import { useList, useCreate, useUpdate, useDelete, useDeleteMany, useInvalidate } from "@refinedev/core";
import { List, DeleteButton } from "@refinedev/antd";
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
  Popconfirm,
  DatePicker,
  Checkbox,
  Card,
  Row,
  Col,
} from "antd";
import { PlusOutlined, SearchOutlined, UserOutlined, LockOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { UserForm } from "../components/UserForm";
import { RoleAssignmentModal } from "../components/RoleAssignmentModal";

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    level: number;
  }>;
}

export const UserListPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const { mutate: create } = useCreate();
  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();
  const { mutate: deleteMany } = useDeleteMany();
  const invalidate = useInvalidate();

  const { result, query } = useList<User>({
    resource: "user",
    pagination: {
      pageSize: 10,
    },
    filters: [
      ...(searchText ? [{ field: "search", operator: "contains", value: searchText }] as any : []),
      ...(isActiveFilter !== undefined ? [{ field: "isActive", operator: "eq", value: isActiveFilter }] as any : []),
      ...(roleFilter ? [{ field: "roleSlug", operator: "eq", value: roleFilter }] as any : []),
    ],
  });

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: User) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleToggleActive = async (record: User) => {
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

  const handleManageRoles = (record: User) => {
    setSelectedUser(record);
    setIsRoleModalVisible(true);
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请选择要删除的用户");
      return;
    }

    deleteMany(
      {
        resource: "user",
        ids: selectedRowKeys,
      },
      {
        onSuccess: () => {
          message.success(`成功删除 ${selectedRowKeys.length} 个用户`);
          setSelectedRowKeys([]);
          query.refetch();
        },
        onError: () => {
          message.error("批量删除失败");
        },
      }
    );
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (id: string) => <span style={{ fontSize: 12, color: "#999" }}>{id.slice(0, 8)}...</span>,
    },
    {
      title: "用户名",
      dataIndex: "username",
      width: 120,
    },
    {
      title: "邮箱",
      dataIndex: "email",
      width: 180,
    },
    {
      title: "姓名",
      dataIndex: "firstName",
      width: 100,
      render: (firstName: string, record: User) => {
        const fullName = [firstName, record.lastName].filter(Boolean).join(" ");
        return fullName || "-";
      },
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 150,
      render: (roles: User["roles"]) => (
        <Space size={4} wrap>
          {roles.map((role) => (
            <Tag key={role.id} color={role.level < 50 ? "red" : role.level < 100 ? "orange" : "default"}>
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
      render: (isActive: boolean, record: User) => (
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
      render: (date: Date) => (date ? new Date(date).toLocaleString("zh-CN") : "从未登录"),
    },
    {
      title: "操作",
      width: 220,
      render: (_: any, record: User) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" type="link" onClick={() => handleManageRoles(record)}>
            角色
          </Button>
          <Popconfirm
            title="确认重置密码？"
            description="将为用户生成随机密码"
            onConfirm={() => {
              // TODO: Implement reset password
              message.info("重置密码功能待实现");
            }}
          >
            <Button size="small" type="link" icon={<LockOutlined />}>
              重置密码
            </Button>
          </Popconfirm>
          <DeleteButton
            hideText
            recordItemId={record.id}
            resource="user"
            onSuccess={() => {
              message.success("删除成功");
              query.refetch();
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
      <List>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>用户管理</h1>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  新建用户
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Search and Filters */}
          <Space style={{ marginBottom: 16 }} wrap>
            <Input
              placeholder="搜索用户名或邮箱"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
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
              <Select.Option value="super_admin">超级管理员</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="editor">编辑</Select.Option>
              <Select.Option value="viewer">查看者</Select.Option>
            </Select>
          </Space>

          {/* Batch Actions */}
          {selectedRowKeys.length > 0 && (
            <Space style={{ marginBottom: 16 }}>
              <span>已选择 {selectedRowKeys.length} 项</span>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
              <Popconfirm
                title="确认批量删除？"
                description={`将删除 ${selectedRowKeys.length} 个用户`}
                onConfirm={handleBatchDelete}
              >
                <Button size="small" danger>
                  批量删除
                </Button>
              </Popconfirm>
              <Button
                size="small"
                onClick={() => {
                  // TODO: Implement batch assign roles
                  message.info("批量分配角色功能待实现");
                }}
              >
                批量分配角色
              </Button>
            </Space>
          )}

          <Table
            rowSelection={{
              selectedRowKeys,
              onChange: (selectedKeys) => setSelectedRowKeys(selectedKeys as string[]),
            }}
            columns={columns}
            rowKey="id"
            dataSource={(result as any)?.data || []}
            loading={query.isLoading}
            pagination={{
              current: 1,
              pageSize: 10,
              total: (result as any)?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />

          <Modal
            title={editingRecord ? "编辑用户" : "新建用户"}
            open={isModalVisible}
            onOk={handleSubmit}
            onCancel={() => setIsModalVisible(false)}
            okText="确定"
            cancelText="取消"
            width={600}
          >
            <UserForm form={form} isEdit={!!editingRecord} />
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
        </Card>
      </List>
    </div>
  );
};
