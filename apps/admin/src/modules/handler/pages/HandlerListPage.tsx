import { useList, useUpdate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { Table, Button, Space, Tag, Card, Statistic, Row, Col, Input, Select, Avatar, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  WechatOutlined,
} from "@ant-design/icons";

interface Handler {
  id: string;
  username: string;
  realName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  wxNickname?: string;
  wxAvatarUrl?: string;
  position?: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  currentTicketCount: number;
  completedTicketCount: number;
}

export const HandlerListPage = () => {
  const navigate = useNavigate();
  const { mutate: update } = useUpdate();
  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { result, query } = useList<Handler>({
    resource: "user",
    pagination: {
      pageSize: 10,
    },
    meta: {
      method: "getHandlers",
    },
    filters: [
      ...(searchText ? [{ field: "search", operator: "contains" as const, value: searchText }] : []),
      ...(departmentFilter ? [{ field: "departmentId", operator: "eq" as const, value: departmentFilter }] : []),
      ...(activeFilter !== undefined ? [{ field: "isActive", operator: "eq" as const, value: activeFilter }] : []),
    ],
  });

  const handlers = result?.data || [];
  const total = result?.total || 0;

  // Handle toggle active status
  const handleToggleActive = (id: string, isActive: boolean) => {
    update(
      {
        resource: "user",
        id,
        values: { isActive },
      },
      {
        onSuccess: () => {
          message.success(isActive ? "已启用" : "已禁用");
          query.refetch();
        },
        onError: () => {
          message.error("操作失败");
        },
      }
    );
  };

  // Calculate statistics
  const totalActive = handlers.filter((h) => h.isActive).length;
  const totalCurrentTickets = handlers.reduce((sum, h) => sum + h.currentTicketCount, 0);
  const totalCompleted = handlers.reduce((sum, h) => sum + h.completedTicketCount, 0);

  const columns = [
    {
      title: "姓名",
      key: "name",
      render: (_: any, record: Handler) => (
        <Space>
          {record.wxAvatarUrl ? (
            <Avatar src={record.wxAvatarUrl} size="small" />
          ) : (
            <Avatar icon={<WechatOutlined />} size="small" />
          )}
          <span>
            {record.realName || record.wxNickname ||
              (record.firstName && record.lastName
                ? `${record.firstName} ${record.lastName}`
                : record.firstName || record.lastName || record.username)}
          </span>
        </Space>
      ),
    },
    {
      title: "手机号",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "-",
    },
    {
      title: "所属部门",
      dataIndex: ["department", "name"],
      key: "department",
      render: (val: string, record: Handler) => val || <Tag color="default">未分配</Tag>,
    },
    {
      title: "岗位",
      dataIndex: "position",
      key: "position",
      render: (position: string) => position || "-",
    },
    {
      title: "当前工单",
      key: "currentTicketCount",
      render: (_: any, record: Handler) => (
        <Tag
          icon={<ClockCircleOutlined />}
          color={record.currentTicketCount > 0 ? "processing" : "default"}
        >
          {record.currentTicketCount}
        </Tag>
      ),
      sorter: (a: Handler, b: Handler) => a.currentTicketCount - b.currentTicketCount,
    },
    {
      title: "完工工单",
      key: "completedTicketCount",
      render: (_: any, record: Handler) => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {record.completedTicketCount}
        </Tag>
      ),
      sorter: (a: Handler, b: Handler) => a.completedTicketCount - b.completedTicketCount,
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "启用" : "禁用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      render: (_: any, record: Handler) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(`/handlers/${record.id}`)}
          >
            查看详情
          </Button>
          {record.isActive ? (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleToggleActive(record.id, false)}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleToggleActive(record.id, true)}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <List>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 16px 0", fontSize: 24, fontWeight: "bold" }}>办事员管理</h1>
        </div>

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总办事员"
                value={total}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="启用中"
                value={totalActive}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="当前工单"
                value={totalCurrentTickets}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成工单"
                value={totalCompleted}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Space size="middle">
            <Input.Search
              placeholder="搜索姓名或用户名"
              allowClear
              style={{ width: 250 }}
              onSearch={setSearchText}
              enterButton
            />
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150 }}
              onChange={setActiveFilter}
            >
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
            <Button onClick={() => {
              setSearchText("");
              setDepartmentFilter(undefined);
              setActiveFilter(undefined);
            }}>
              重置筛选
            </Button>
          </Space>
        </Card>

        <Table
          columns={columns}
          rowKey="id"
          dataSource={handlers}
          loading={query.isLoading}
          pagination={{
            current: 1,
            pageSize: 10,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </List>
    </div>
  );
};
