import { useState, useMemo } from "react";
import { useList, useOne, useUpdate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Card,
  Statistic,
  Row,
  Col,
  Modal,
  Descriptions,
  Avatar,
  Timeline,
  Form,
  message,
  Image,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileImageOutlined,
} from "@ant-design/icons";

// 本地类型定义
type TicketStatus = "WAIT_ASSIGN" | "WAIT_ACCEPT" | "PROCESSING" | "COMPLETED" | "CLOSED";
type Priority = "NORMAL" | "URGENT";

// 状态标签配置
const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon?: React.ReactNode }
> = {
  WAIT_ASSIGN: { color: "default", label: "待指派", icon: <ClockCircleOutlined /> },
  WAIT_ACCEPT: { color: "processing", label: "待接单", icon: <ClockCircleOutlined /> },
  PROCESSING: { color: "blue", label: "处理中", icon: <ClockCircleOutlined /> },
  COMPLETED: { color: "success", label: "已完成", icon: <CheckCircleOutlined /> },
  CLOSED: { color: "default", label: "已关闭", icon: <CloseOutlined /> },
};

// 优先级标签配置
const PRIORITY_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  NORMAL: { color: "blue", label: "普通" },
  URGENT: { color: "red", label: "紧急" },
};

export const TicketListPage = () => {
  // 筛选条件
  const [filters, setFilters] = useState<any>({});
  const [searchKeyword, setSearchKeyword] = useState("");

  // 详情弹窗状态
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignForm] = Form.useForm();

  // 获取工单列表
  const { result, query } = useList({
    resource: "ticket",
    pagination: {
      pageSize: 20,
    },
    queryOptions: {
      enabled: true,
    },
  });

  // 获取工单详情
  const { result: ticketDetail, query: detailQuery, isLoading: detailLoading } = useOne({
    resource: "ticket",
    id: currentTicketId || "",
    queryOptions: {
      enabled: !!currentTicketId,
    },
  });

  const { mutate: update } = useUpdate();

  const ticket = ticketDetail;

  // 使用 useMemo 计算状态统计
  const statusStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (result?.data) {
      result.data.forEach((ticket: any) => {
        stats[ticket.status] = (stats[ticket.status] || 0) + 1;
      });
    }
    return stats;
  }, [result?.data]);

  // 计算超时工单数量
  const overdueCount = useMemo(() => {
    return result?.data?.filter((t: any) => t.isOverdue).length || 0;
  }, [result?.data]);

  // 表格列配置
  const columns = [
    {
      title: "工单编号",
      dataIndex: "ticketNumber",
      width: 140,
      fixed: "left" as const,
      render: (val: string, record: any) => (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleViewDetail(record);
          }}
        >
          {val}
        </a>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      ellipsis: true,
      render: (val: string, record: any) => (
        <Space direction="vertical" size={0}>
          <span>{val}</span>
          {record.isOverdue && (
            <Tag color="red">
              已超时
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "分类",
      dataIndex: "category",
      width: 100,
      render: (category: any) => category?.name || "-",
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 80,
      render: (val: Priority) => {
        const config = PRIORITY_CONFIG[val];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (val: TicketStatus) => {
        const config = STATUS_CONFIG[val];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "创建人",
      dataIndex: "createdBy",
      width: 100,
      render: (user: any) => user?.username || "-",
    },
    {
      title: "处理人",
      dataIndex: "assignedTo",
      width: 100,
      render: (user: any) => user?.username || <span style={{ color: "#999" }}>-</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 120,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
    {
      title: "操作",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // 查看详情
  const handleViewDetail = (record: any) => {
    setCurrentTicketId(record.id);
    setDetailModalVisible(true);
  };

  // 关闭详情弹窗
  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setCurrentTicketId(null);
  };

  // 打开指派弹窗
  const handleOpenAssignModal = () => {
    setAssignModalVisible(true);
  };

  // 指派工单
  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      await update(
        {
          resource: "ticket",
          id: currentTicketId || "",
          meta: { method: "assign" },
          values: { data: { assignedId: values.assignedId } },
        },
        {
          onSuccess: () => {
            message.success("指派成功");
            setAssignModalVisible(false);
            assignForm.resetFields();
            detailQuery.refetch();
            query.refetch();
          },
          onError: (error: any) => {
            message.error("指派失败: " + (error.message || "未知错误"));
          },
        }
      );
    } catch (error) {
      console.error("指派失败:", error);
    }
  };

  // 接单
  const handleAccept = async () => {
    try {
      await update(
        {
          resource: "ticket",
          id: currentTicketId || "",
          meta: { method: "accept" },
        },
        {
          onSuccess: () => {
            message.success("接单成功");
            detailQuery.refetch();
            query.refetch();
          },
          onError: (error: any) => {
            message.error("接单失败: " + (error.message || "未知错误"));
          },
        }
      );
    } catch (error) {
      console.error("接单失败:", error);
    }
  };

  // 完成工单
  const handleComplete = async () => {
    try {
      await update(
        {
          resource: "ticket",
          id: currentTicketId || "",
          meta: { method: "complete" },
          values: { attachmentIds: [] },
        },
        {
          onSuccess: () => {
            message.success("工单已完成");
            detailQuery.refetch();
            query.refetch();
          },
          onError: (error: any) => {
            message.error("操作失败: " + (error.message || "未知错误"));
          },
        }
      );
    } catch (error) {
      console.error("操作失败:", error);
    }
  };

  // 关闭工单
  const handleClose = async () => {
    try {
      await update(
        {
          resource: "ticket",
          id: currentTicketId || "",
          meta: { method: "close" },
          values: { reason: "" },
        },
        {
          onSuccess: () => {
            message.success("工单已关闭");
            detailQuery.refetch();
            query.refetch();
          },
          onError: (error: any) => {
            message.error("操作失败: " + (error.message || "未知错误"));
          },
        }
      );
    } catch (error) {
      console.error("操作失败:", error);
    }
  };

  // 筛选处理
  const handleFilter = () => {
    console.log("筛选:", filters, searchKeyword);
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({});
    setSearchKeyword("");
  };

  // 快速状态筛选
  const handleStatusFilter = (status?: string) => {
    if (status) {
      setFilters({ status });
    } else {
      const { status, ...rest } = filters;
      setFilters(rest);
    }
  };

  // 获取可执行的操作
  const getAvailableActions = (status: TicketStatus) => {
    const actions: string[] = [];
    if (status === "WAIT_ACCEPT") actions.push("accept");
    if (status === "PROCESSING") actions.push("complete");
    if (status !== "CLOSED") actions.push("close");
    return actions;
  };

  return (
    <div style={{ padding: "24px" }}>
      <List>
        {/* 顶部操作栏 */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>
            工单管理
          </h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="总工单"
                value={result?.total || 0}
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="待处理"
                value={(statusStats.WAIT_ASSIGN || 0) + (statusStats.WAIT_ACCEPT || 0)}
                valueStyle={{ fontSize: 20, color: "#ff4d4f" }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="处理中"
                value={statusStats.PROCESSING || 0}
                valueStyle={{ fontSize: 20, color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="已完成"
                value={statusStats.COMPLETED || 0}
                valueStyle={{ fontSize: 20, color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="超时工单"
                value={overdueCount}
                valueStyle={{ fontSize: 20, color: "#faad14" }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic
                title="完成率"
                value={
                  result?.total
                    ? (
                        ((statusStats.COMPLETED || 0) / result.total) *
                        100
                      ).toFixed(1)
                    : "0"
                }
                suffix="%"
                valueStyle={{ fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选栏 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap size="middle">
            <Input
              placeholder="搜索工单编号或标题"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={handleFilter}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              value={filters.status}
              onChange={(val) => handleStatusFilter(val)}
              options={[
                { label: "待指派", value: "WAIT_ASSIGN" },
                { label: "待接单", value: "WAIT_ACCEPT" },
                { label: "处理中", value: "PROCESSING" },
                { label: "已完成", value: "COMPLETED" },
                { label: "已关闭", value: "CLOSED" },
              ]}
            />
            <Select
              placeholder="优先级"
              allowClear
              style={{ width: 100 }}
              value={filters.priority}
              onChange={(val) =>
                setFilters((prev: any) => ({ ...prev, priority: val }))
              }
              options={[
                { label: "普通", value: "NORMAL" },
                { label: "紧急", value: "URGENT" },
              ]}
            />
            <Button onClick={handleFilter}>查询</Button>
            <Button onClick={handleReset}>重置</Button>

            {/* 快速筛选按钮 */}
            <div style={{ marginLeft: "auto" }}>
              <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleStatusFilter(undefined)}
                >
                  全部
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleStatusFilter("WAIT_ASSIGN")}
                >
                  待指派
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleStatusFilter("PROCESSING")}
                >
                  处理中
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setFilters({ isOverdue: true })}
                >
                  已超时
                </Button>
              </Space>
            </div>
          </Space>
        </Card>

        {/* 表格 */}
        <Table
          columns={columns}
          rowKey="id"
          dataSource={result?.data || []}
          loading={query.isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            current: 1,
            pageSize: 20,
            total: result?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </List>

      {/* 工单详情弹窗 */}
      <Modal
        title={
          <Space>
            <span>工单详情</span>
            {ticket && (
              <Tag color={STATUS_CONFIG[ticket.status]?.color}>
                {STATUS_CONFIG[ticket.status]?.label}
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={handleCloseDetailModal}
        width={900}
        footer={
          ticket ? (
            <Space>
              <Button onClick={handleCloseDetailModal}>关闭</Button>
              {ticket.status === "WAIT_ASSIGN" && (
                <Button type="primary" onClick={handleOpenAssignModal}>
                  指派处理人
                </Button>
              )}
              {ticket.status === "WAIT_ACCEPT" && (
                <Button type="primary" onClick={handleAccept}>
                  接单
                </Button>
              )}
              {ticket.status === "PROCESSING" && (
                <Button type="primary" onClick={handleComplete}>
                  完成工单
                </Button>
              )}
              {ticket.status !== "CLOSED" && (
                <Button danger onClick={handleClose}>
                  关闭工单
                </Button>
              )}
            </Space>
          ) : null
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            加载中...
          </div>
        ) : ticket ? (
          <div>
            {/* 基本信息 */}
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工单编号" span={2}>
                {ticket.ticketNumber}
              </Descriptions.Item>
              <Descriptions.Item label="工单标题" span={2}>
                {ticket.title}
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {ticket.category?.name}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={ticket.priority === "URGENT" ? "red" : "blue"}>
                  {ticket.priority === "URGENT" ? "紧急" : "普通"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {ticket.createdBy?.username}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {ticket.assignedTo ? (
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    {ticket.assignedTo.username}
                  </Space>
                ) : (
                  <span style={{ color: "#999" }}>-</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {new Date(ticket.createdAt).toLocaleString("zh-CN")}
              </Descriptions.Item>
              {ticket.deadlineAt && (
                <Descriptions.Item label="截止时间" span={2}>
                  {new Date(ticket.deadlineAt).toLocaleString("zh-CN")}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 工单描述 */}
            {ticket.description && (
              <Card title="工单描述" size="small" style={{ marginBottom: 16 }}>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {ticket.description}
                </p>
              </Card>
            )}

            {/* 附件图片 */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <Card title="附件图片" size="small" style={{ marginBottom: 16 }}>
                <Image.PreviewGroup>
                  <Space wrap>
                    {ticket.attachments.map((attachment: any) => (
                      <div key={attachment.id}>
                        {attachment.type === "IMAGE" ? (
                          <Image
                            src={attachment.url}
                            alt={attachment.fileName}
                            width={100}
                            height={100}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Card
                              size="small"
                              hoverable
                              style={{ width: 100, textAlign: "center" }}
                            >
                              <FileImageOutlined style={{ fontSize: 32 }} />
                              <div style={{ fontSize: 12, marginTop: 4 }}>
                                视频
                              </div>
                            </Card>
                          </a>
                        )}
                      </div>
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </Card>
            )}

            {/* 评论 */}
            {ticket.comments && ticket.comments.length > 0 && (
              <Card title={`评论 (${ticket.comments.length})`} size="small">
                <Timeline
                  items={ticket.comments.map((comment: any) => ({
                    children: (
                      <div>
                        <Space>
                          <strong>{comment.user?.username}</strong>
                          <Tag color="blue">
                            {comment.commentType === "SYSTEM"
                              ? "系统"
                              : comment.commentType === "USER"
                              ? "用户"
                              : "处理人"}
                          </Tag>
                          <span style={{ color: "#999", fontSize: 12 }}>
                            {new Date(comment.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </Space>
                        <div style={{ marginTop: 8 }}>{comment.content}</div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            加载中...
          </div>
        )}
      </Modal>

      {/* 指派弹窗 */}
      <Modal
        title="指派工单"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => {
          setAssignModalVisible(false);
          assignForm.resetFields();
        }}
        okText="确认指派"
        cancelText="取消"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assignedId"
            label="选择处理人"
            rules={[{ required: true, message: "请选择处理人" }]}
          >
            <Select
              placeholder="请选择处理人"
              showSearch
              // TODO: 从后端获取处理人列表
              options={[
                { label: "handler1", value: "handler1-id" },
                { label: "handler2", value: "handler2-id" },
              ]}
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
