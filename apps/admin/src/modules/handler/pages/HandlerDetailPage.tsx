import { useOne, useList } from "@refinedev/core";
import { ShowButton } from "@refinedev/antd";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tag,
  Table,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Typography,
  Progress,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

interface HandlerDetail {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  wxNickname?: string;
  position?: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
  lastLoginAt?: string;
  stats: {
    WAIT_ASSIGN: number;
    WAIT_ACCEPT: number;
    PROCESSING: number;
    COMPLETED: number;
    CLOSED: number;
  };
  recentCompleted: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    rating: number | null;
    closedAt: string;
  }>;
  activeTickets: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export const HandlerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: handlerData, isLoading } = useOne<HandlerDetail>({
    resource: "user",
    id: id!,
    meta: {
      method: "getHandlerDetail",
    },
  });

  const handler = handlerData?.data;

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!handler) {
    return <div>办事员不存在</div>;
  }

  const totalTickets = Object.values(handler.stats).reduce((sum, count) => sum + count, 0);
  const completionRate = totalTickets > 0
    ? Math.round(((handler.stats.COMPLETED + handler.stats.CLOSED) / totalTickets) * 100)
    : 0;

  const activeTicketColumns = [
    {
      title: "工单号",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          WAIT_ACCEPT: { text: "待接单", color: "warning" },
          PROCESSING: { text: "处理中", color: "processing" },
        };
        const info = statusMap[status] || { text: status, color: "default" };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => {
        const color = priority === "URGENT" ? "error" : "default";
        return <Tag color={color}>{priority === "URGENT" ? "紧急" : "普通"}</Tag>;
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  const recentCompletedColumns = [
    {
      title: "工单号",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
    },
    {
      title: "评分",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number | null) => {
        if (!rating) return <Tag>未评分</Tag>;
        return (
          <Space>
            <StarOutlined style={{ color: "#faad14" }} />
            <span>{rating}/5</span>
          </Space>
        );
      },
    },
    {
      title: "完成时间",
      dataIndex: "closedAt",
      key: "closedAt",
      render: (date: string) => new Date(date).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Title level={2} style={{ marginBottom: 24 }}>
        {handler.firstName && handler.lastName
          ? `${handler.firstName} ${handler.lastName}`
          : handler.firstName || handler.lastName || handler.username}
      </Title>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总工单"
              value={totalTickets}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待接单"
              value={handler.stats.WAIT_ACCEPT}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="处理中"
              value={handler.stats.PROCESSING}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={handler.stats.CLOSED}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="完工率"
              value={completionRate}
              suffix="%"
              valueStyle={{
                color: completionRate >= 80 ? "#52c41a" : completionRate >= 50 ? "#faad14" : "#ff4d4f",
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Progress
              type="circle"
              percent={completionRate}
              size={80}
            />
          </Card>
        </Col>
      </Row>

      {/* Basic Information */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="用户名">{handler.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{handler.email}</Descriptions.Item>
          <Descriptions.Item label="手机号">{handler.phone || "-"}</Descriptions.Item>
          <Descriptions.Item label="微信昵称">{handler.wxNickname || "-"}</Descriptions.Item>
          <Descriptions.Item label="岗位">{handler.position || "-"}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={handler.isActive ? "success" : "default"}>
              {handler.isActive ? "启用" : "禁用"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="所属部门">
            {handler.department ? (
              <Tag color="blue">{handler.department.name}</Tag>
            ) : (
              <Tag>未分配</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(handler.createdAt).toLocaleString("zh-CN")}
          </Descriptions.Item>
          <Descriptions.Item label="最后登录" span={2}>
            {handler.lastLoginAt
              ? new Date(handler.lastLoginAt).toLocaleString("zh-CN")
              : "从未登录"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Active Tickets */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>当前工单 ({handler.activeTickets.length})</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={activeTicketColumns}
          dataSource={handler.activeTickets}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Recently Completed */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <span>最近完成 ({handler.recentCompleted.length})</span>
          </Space>
        }
      >
        <Table
          columns={recentCompletedColumns}
          dataSource={handler.recentCompleted}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};
