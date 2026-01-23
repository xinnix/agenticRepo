// apps/admin/src/modules/user/pages/UserDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOne, useUpdate, useDelete } from "@refinedev/core";
import {
  Card,
  Descriptions,
  Button,
  Space,
  message,
  Tag,
  Modal,
  Form,
  Input,
  Popconfirm,
  List,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
  description?: string;
  isSystem: boolean;
  assignedAt: Date;
}

interface UserDetail {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [roleForm] = Form.useForm();

  const { data: result, isLoading, query } = useOne<UserDetail>({
    resource: "user",
    id: id || "",
  });

  const { mutate: update } = useUpdate();
  const { mutate: deleteOne } = useDelete();

  const user = result?.data;

  const handleToggleActive = () => {
    if (!user) return;

    update(
      {
        resource: "user",
        id: user.id,
        values: { isActive: !user.isActive },
        meta: {
          method: "toggleActive",
        },
      },
      {
        onSuccess: () => {
          message.success(user.isActive ? "用户已停用" : "用户已激活");
          query.refetch();
        },
        onError: () => {
          message.error("操作失败");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!user) return;

    deleteOne(
      {
        resource: "user",
        id: user.id,
      },
      {
        onSuccess: () => {
          message.success("删除成功");
          navigate("/users");
        },
        onError: (error: any) => {
          message.error(error.message || "删除失败");
        },
      }
    );
  };

  const handleResetPassword = async () => {
    try {
      const values = await passwordForm.validateFields();

      // TODO: Call reset password mutation
      message.info("重置密码功能待实现");
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error("Form validation error:", error);
    }
  };

  const handleRemoveRole = (roleId: string) => {
    if (!user) return;

    // TODO: Call remove role mutation
    message.info("移除角色功能待实现");
  };

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>用户不存在</div>;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px" }}>
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/users")}
            >
              返回
            </Button>
            <span>用户详情</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={user.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={handleToggleActive}
              danger={user.isActive}
            >
              {user.isActive ? "停用" : "激活"}
            </Button>
            <Button icon={<LockOutlined />} onClick={() => setIsPasswordModalVisible(true)}>
              重置密码
            </Button>
            <Button icon={<EditOutlined />} onClick={() => message.info("编辑功能待实现")}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除？"
              description="删除后无法恢复"
              onConfirm={handleDelete}
            >
              <Button icon={<DeleteOutlined />} danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名" labelStyle={{ width: 120 }}>
            <Space>
              <UserOutlined />
              {user.username}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            <Space>
              <MailOutlined />
              {user.email}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="姓名">{fullName || "-"}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={user.isActive ? "success" : "error"} icon={user.isActive ? <CheckCircleOutlined /> : <StopOutlined />}>
              {user.isActive ? "激活" : "停用"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最后登录">
            <Space>
              <ClockCircleOutlined />
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(user.createdAt).toLocaleString("zh-CN")}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱验证">
            {user.emailVerified ? (
              <Tag color="success">已验证</Tag>
            ) : (
              <Tag color="warning">未验证</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(user.updatedAt).toLocaleString("zh-CN")}
          </Descriptions.Item>
        </Descriptions>

        <Card
          title="用户角色"
          style={{ marginTop: 16 }}
          extra={
            <Button type="primary" size="small" onClick={() => message.info("分配角色功能待实现")}>
              分配角色
            </Button>
          }
        >
          <List
            dataSource={user.roles}
            renderItem={(role: any) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="remove"
                    title="确认移除角色？"
                    onConfirm={() => handleRemoveRole(role.id)}
                  >
                    <Button size="small" type="link" danger>
                      移除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <span>{role.name}</span>
                      <Tag color={role.level < 50 ? "red" : role.level < 100 ? "orange" : "default"}>
                        {role.slug}
                      </Tag>
                      {role.isSystem && <Tag color="blue">系统角色</Tag>}
                    </Space>
                  }
                  description={
                    <Space>
                      <span>层级: {role.level}</span>
                      {role.description && <span>| {role.description}</span>}
                      <span>| 分配于: {new Date(role.assignedAt).toLocaleDateString("zh-CN")}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Card>

      <Modal
        title="重置密码"
        open={isPasswordModalVisible}
        onOk={handleResetPassword}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: "请输入新密码" },
              { min: 8, message: "密码至少8个字符" },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "请确认密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
