import { useState } from "react";
import { useList, useUpdate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import {
  Table,
  Button,
  Modal,
  Space,
  message,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Avatar,
  Select,
  Input,
  Descriptions,
  Form,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
  WechatOutlined,
} from "@ant-design/icons";

interface Role {
  id: string;
  name: string;
  slug: string;
  level: number;
}

interface WxUser {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;        // 新增：真实姓名
  wxNickname?: string;
  wxAvatarUrl?: string;
  wxOpenId: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles: Role[];
  department?: {
    id: string;
    name: string;
  };
  departmentId?: string;    // 新增：部门ID
  position?: string;
  handlerStatus?: string;   // 办事员申请状态：pending/approved/rejected
}

// 审核申请弹窗
interface AuditApplicationModalProps {
  open: boolean;
  user: WxUser | null;
  departments: DepartmentNode[];  // 新增：部门列表
  onCancel: () => void;
  onSuccess: () => void;
  onApprove: (user: WxUser, departmentId: string) => void;
  onReject: () => void;  // 新增：拒绝回调
}

interface DepartmentNode {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

const AuditApplicationModal = ({
  open,
  user,
  departments,
  onCancel,
  onSuccess,
  onApprove,
  onReject,
}: AuditApplicationModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 当弹窗打开时，重置表单
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      form.setFieldsValue({
        departmentId: user.departmentId || undefined,
      });
    } else {
      form.resetFields();
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await onReject();  // 调用传入的拒绝回调
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      if (!values.departmentId) {
        message.error("请选择部门");
        return;
      }
      setSubmitting(true);
      onApprove(user!, values.departmentId);
    } catch (error: any) {
      if (error?.errorFields) {
        // 表单验证失败，不调用 onApprove
        message.error("请填写所有必填项");
      } else {
        console.error("Form validation error:", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="审核办事员申请"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={550}
      afterOpenChange={handleOpenChange}
    >
      {user && (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          {/* 用户信息 */}
          <Card size="small">
            <Space>
              <Avatar size={48} src={user.wxAvatarUrl} icon={<WechatOutlined />} />
              <div>
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  {user.wxNickname || user.username}
                </div>
                <div style={{ color: "#999", fontSize: 12 }}>
                  {user.phone || user.email || "暂无联系方式"}
                </div>
              </div>
            </Space>
          </Card>

          {/* 申请信息 */}
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="真实姓名">
              {user.realName || <Tag color="default">未填写</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {user.phone || <Tag color="default">未填写</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="当前角色">
              {user.roles.length === 0 ? (
                <Tag color="default">普通用户</Tag>
              ) : (
                user.roles.map((role) => (
                  <Tag key={role.id} color={role.slug === "handler" ? "green" : "default"}>
                    {role.name}
                  </Tag>
                ))
              )}
            </Descriptions.Item>
            <Descriptions.Item label="所属部门">
              {user.department?.name || <Tag color="default">未分配</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="岗位">{user.position || "-"}</Descriptions.Item>
          </Descriptions>

          {/* 部门选择器 */}
          <Form form={form} layout="vertical">
            <Form.Item
              name="departmentId"
              label="分配部门"
              rules={[{ required: true, message: "请选择部门" }]}
            >
              <Select
                placeholder="请选择部门"
                options={departments.map((dept) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
                allowClear
              />
            </Form.Item>
          </Form>

          {/* 操作按钮 */}
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel} disabled={submitting}>
              取消
            </Button>
            <Button danger onClick={handleReject} loading={submitting}>
              拒绝申请
            </Button>
            <Button type="primary" onClick={handleApprove} loading={submitting}>
              批准申请
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
};

export const WxUserListPage = () => {
  const [isAuditModalVisible, setIsAuditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<WxUser | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [isHandlerFilter, setIsHandlerFilter] = useState<boolean | undefined>(undefined);

  const { mutate: update } = useUpdate();
  const { result, query } = useList<WxUser>({
    resource: "user",
    pagination: {
      pageSize: 10,
    },
    meta: {
      method: "getWxUsers",
    },
    filters: [
      ...(searchText ? [{ field: "search", operator: "contains" as const, value: searchText }] : []),
      ...(isActiveFilter !== undefined ? [{ field: "isActive", operator: "eq" as const, value: isActiveFilter }] : []),
    ],
  });

  // 获取部门列表
  const { result: departmentsResult } = useList<DepartmentNode>({
    resource: "department",
    pagination: { pageSize: 100 },
  });
  const departments = departmentsResult?.data || [];

  const users = result?.data || [];
  const total = result?.total || 0;

  // Calculate statistics
  const totalActive = users.filter((u) => u.isActive).length;
  const totalHandler = users.filter((u) => u.roles.some((r) => r.slug === "handler")).length;

  // Apply client-side filters
  let filteredUsers = users;
  if (isHandlerFilter !== undefined) {
    filteredUsers = users.filter((u) =>
      isHandlerFilter
        ? u.roles.some((r) => r.slug === "handler")
        : !u.roles.some((r) => r.slug === "handler")
    );
  }

  const handleToggleActive = async (record: WxUser) => {
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

  const handleAudit = (record: WxUser) => {
    setSelectedUser(record);
    setIsAuditModalVisible(true);
  };

  const handleApprove = (user: WxUser, departmentId: string) => {
    if (!departmentId) {
      message.error("请选择部门");
      return;
    }

    // 使用 tRPC 调用审批接口
    update(
      {
        resource: "user",
        id: user.id,
        values: { departmentId },
        meta: {
          method: "approveHandler",
        },
      },
      {
        onSuccess: () => {
          message.success("已批准成为办事员，并分配部门");
          setIsAuditModalVisible(false);
          setSelectedUser(null);
          query.refetch();
        },
        onError: () => {
          message.error("操作失败");
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedUser) return;

    update(
      {
        resource: "user",
        id: selectedUser.id,
        values: {},
        meta: {
          method: "rejectHandler",
        },
      },
      {
        onSuccess: () => {
          message.success("已拒绝申请");
          setIsAuditModalVisible(false);
          setSelectedUser(null);
          query.refetch();
        },
        onError: () => {
          message.error("操作失败");
        },
      }
    );
  };

  const columns = [
    {
      title: "用户",
      key: "user",
      width: 200,
      render: (_: any, record: WxUser) => (
        <Space>
          <Avatar
            size={40}
            src={record.wxAvatarUrl}
            icon={<WechatOutlined />}
          />
          <div>
            <div style={{ fontWeight: "bold" }}>
              {record.wxNickname || record.username}
            </div>
            <div style={{ fontSize: 12, color: "#999" }}>
              {record.phone || record.email || "-"}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "角色",
      dataIndex: "roles",
      width: 120,
      render: (roles: Role[]) => (
        <Space size={4} wrap>
          {roles.length === 0 ? (
            <Tag color="default">普通用户</Tag>
          ) : (
            roles.map((role) => (
              <Tag key={role.id} color={role.slug === "handler" ? "green" : "default"}>
                {role.name}
              </Tag>
            ))
          )}
        </Space>
      ),
    },
    {
      title: "部门/岗位",
      key: "department",
      width: 150,
      render: (_: any, record: WxUser) => (
        <Space direction="vertical" size={0}>
          <span>{record.department?.name || <Tag color="default">未分配</Tag>}</span>
          {record.position && <span style={{ fontSize: 12, color: "#999" }}>{record.position}</span>}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "isActive",
      width: 90,
      render: (isActive: boolean, record: WxUser) => (
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
      title: "注册时间",
      dataIndex: "createdAt",
      width: 160,
      render: (date: Date) => new Date(date).toLocaleString("zh-CN"),
    },
    {
      title: "最后登录",
      dataIndex: "lastLoginAt",
      width: 160,
      render: (date?: Date) => (date ? new Date(date).toLocaleString("zh-CN") : "从未登录"),
    },
    {
      title: "操作",
      width: 120,
      render: (_: any, record: WxUser) => {
        // 只有待审核的办事员申请才显示审核按钮
        if (record.handlerStatus !== 'pending') {
          return <span style={{ color: '#999', fontSize: 12 }}>-</span>;
        }
        return (
          <Button
            size="small"
            type="link"
            onClick={() => handleAudit(record)}
          >
            审核申请
          </Button>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: "bold" }}>
            <WechatOutlined /> 微信用户管理
          </h1>
          <p style={{ margin: 0, color: "#666" }}>
            管理通过微信注册的用户，审核办事员申请
          </p>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户"
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
                title="办事员"
                value={totalHandler}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="普通用户"
                value={total - totalHandler}
                valueStyle={{ color: "#8c8c8c" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space size="middle">
            <Input
              placeholder="搜索昵称、手机号"
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
              value={isHandlerFilter}
              onChange={setIsHandlerFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value={true}>办事员</Select.Option>
              <Select.Option value={false}>普通用户</Select.Option>
            </Select>
            <Button onClick={() => {
              setSearchText("");
              setIsActiveFilter(undefined);
              setIsHandlerFilter(undefined);
            }}>
              重置筛选
            </Button>
          </Space>
        </Card>

        <Table
          columns={columns}
          rowKey="id"
          dataSource={filteredUsers}
          loading={query.isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total: filteredUsers.length,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />

        <AuditApplicationModal
          open={isAuditModalVisible}
          user={selectedUser}
          departments={departments}
          onCancel={() => {
            setIsAuditModalVisible(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            query.refetch();
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </List>
    </div>
  );
};
