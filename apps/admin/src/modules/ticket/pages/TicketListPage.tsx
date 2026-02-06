import { useState, useMemo } from "react";
import { useList, useOne, useUpdate } from "@refinedev/core";
import { List } from "@refinedev/antd";
import { useTrpcQuery, useTrpcMutation } from "../../../shared/hooks/useTrpcQuery";
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
  Dropdown,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileImageOutlined,
  WarningOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

// 本地类型定义
type TicketStatus = "WAIT_ASSIGN" | "WAIT_ACCEPT" | "PROCESSING" | "COMPLETED" | "CLOSED";
type Priority = "NORMAL" | "URGENT";

// 状态标签配置（保留 WAIT_ACCEPT 以兼容旧数据）
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
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [closeForm] = Form.useForm();

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

  // 获取办事员列表
  const { data: handlersData, isLoading: handlersLoading } = useTrpcQuery(
    "user.getHandlers",
    { page: 1, pageSize: 1000 },
    { enabled: true }
  );

  // 优先级更新 mutation
  const { mutate: updatePriority } = useTrpcMutation(
    "ticket.updatePriority",
    {
      onSuccess: () => {
        message.success("优先级已更新");
        query.refetch();
      },
      onError: (error: any) => {
        message.error("更新优先级失败: " + (error.message || "未知错误"));
      },
    }
  );

  // 格式化办事员列表为 Select options
  const handlerOptions = useMemo(() => {
    const handlers = handlersData?.items || [];
    return handlers.map((handler: any) => ({
      label: `${handler.realName || handler.username}${handler.department ? ` - ${handler.department.name}` : ""}`,
      value: handler.id,
    }));
  }, [handlersData]);

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

  // 计算超时工单数量和临期工单数量
  const overdueCount = useMemo(() => {
    return result?.data?.filter((ticket: any) => {
      if (!ticket.deadlineAt) return false;
      if (ticket.status === 'COMPLETED' || ticket.status === 'CLOSED') return false;
      return new Date() > new Date(ticket.deadlineAt);
    }).length || 0;
  }, [result?.data]);

  const urgentCount = useMemo(() => {
    return result?.data?.filter((ticket: any) => {
      if (!ticket.deadlineAt) return false;
      if (ticket.status === 'COMPLETED' || ticket.status === 'CLOSED') return false;
      const hoursRemaining = (new Date(ticket.deadlineAt).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return hoursRemaining > 0 && hoursRemaining < 24;
    }).length || 0;
  }, [result?.data]);

  const normalCount = useMemo(() => {
    return (result?.total || 0) - overdueCount - urgentCount;
  }, [result?.total, overdueCount, urgentCount]);

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
      title: "分类",
      dataIndex: "category",
      width: 100,
      render: (category: any) => category?.name || "-",
    },
    {
      title: "位置",
      dataIndex: "presetArea",
      width: 150,
      ellipsis: true,
      render: (area: any, record: any) => {
        const locationText = area?.name || record.location;
        return locationText || "-";
      },
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
      render: (user: any, record: any) => {
        // 优先显示工单提交时填写的姓名，其次显示用户真实姓名，否则显示匿名
        const displayName = record.submitterName || user?.realName || user?.firstName || user?.lastName;
        return displayName ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {displayName}
          </Space>
        ) : (
          <span style={{ color: "#999" }}>匿名</span>
        );
      },
    },
    {
      title: "处理人",
      dataIndex: "assignedTo",
      width: 100,
      render: (user: any) => {
        // 显示处理人的真实姓名
        const displayName = user?.realName || user?.firstName || user?.lastName || user?.username;
        return displayName ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {displayName}
          </Space>
        ) : (
          <span style={{ color: "#999" }}>-</span>
        );
      },
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 120,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
    {
      title: "截止时间",
      dataIndex: "deadlineAt",
      width: 150,
      render: (deadlineAt: string | null, record: any) => {
        if (!deadlineAt) return '-';

        // 已完成或已关闭的工单不显示截止时间
        if (record.status === 'COMPLETED' || record.status === 'CLOSED') {
          return '-';
        }

        const now = new Date();
        const deadline = new Date(deadlineAt);
        const isOverdue = now > deadline;

        if (isOverdue) {
          return <Tag color="red">已超时</Tag>;
        }

        const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (hoursRemaining < 24) {
          return <Tag color="orange">剩余 {hoursRemaining} 小时</Tag>;
        } else {
          const daysRemaining = Math.floor(hoursRemaining / 24);
          return <Tag color="green">剩余 {daysRemaining} 天</Tag>;
        }
      }
    },
    {
      title: "操作",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: '查看详情',
                onClick: () => handleViewDetail(record),
              },
              {
                key: 'priority',
                label: '调整优先级',
                children: [
                  {
                    key: 'normal',
                    label: '普通优先级',
                    onClick: () => handleUpdatePriority(record.id, 'NORMAL'),
                  },
                  {
                    key: 'urgent',
                    label: '紧急优先级',
                    onClick: () => handleUpdatePriority(record.id, 'URGENT'),
                  },
                ],
              },
            ],
          }}
        >
          <Button type="link">操作</Button>
        </Dropdown>
      ),
    },
  ];

  // 更新优先级
  const handleUpdatePriority = (ticketId: string, priority: 'NORMAL' | 'URGENT') => {
    updatePriority({ id: ticketId, priority });
  };

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

  // 打开关闭工单弹窗
  const handleOpenCloseModal = () => {
    setCloseModalVisible(true);
  };

  // 关闭工单
  const handleClose = async () => {
    try {
      const values = await closeForm.validateFields();
      await update(
        {
          resource: "ticket",
          id: currentTicketId || "",
          meta: { method: "close" },
          values: { data: { reason: values.reason } },
        },
        {
          onSuccess: () => {
            message.success("工单已关闭");
            setCloseModalVisible(false);
            closeForm.resetFields();
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
          <Col span={6}>
            <Card>
              <Statistic
                title="总工单数"
                value={result?.total || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已逾期"
                value={overdueCount}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="24小时内到期"
                value={urgentCount}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="正常工单"
                value={normalCount}
                valueStyle={{ color: '#52c41a' }}
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
              {ticket.status === "PROCESSING" && (
                <Button type="primary" onClick={handleComplete}>
                  完成工单
                </Button>
              )}
              {ticket.status !== "CLOSED" && (
                <Button danger onClick={handleOpenCloseModal}>
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
              <Descriptions.Item label="分类">
                {ticket.category?.name}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={ticket.priority === "URGENT" ? "red" : "blue"}>
                  {ticket.priority === "URGENT" ? "紧急" : "普通"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="位置" span={2}>
                {ticket.presetArea?.name || ticket.location || "-"}
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
              {ticket.deadlineAt && ticket.status !== 'COMPLETED' && ticket.status !== 'CLOSED' && (
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
        {handlersLoading && <div style={{ marginBottom: 16, color: '#999' }}>加载办事员列表中...</div>}
        {!handlersLoading && handlerOptions.length === 0 && (
          <div style={{ marginBottom: 16, color: '#ff4d4f' }}>
            暂无可指派的办事员（办事员需要有微信 OpenID 和 handler 角色）
          </div>
        )}
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assignedId"
            label="选择处理人"
            rules={[{ required: true, message: "请选择处理人" }]}
          >
            <Select
              placeholder={handlersLoading ? "加载中..." : "请选择处理人"}
              showSearch
              disabled={handlersLoading || handlerOptions.length === 0}
              options={handlerOptions}
              filterOption={(input, option) =>
                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          {!handlersLoading && (
            <div style={{ fontSize: 12, color: '#999' }}>
              共 {handlerOptions.length} 位办事员可选
            </div>
          )}
        </Form>
      </Modal>

      {/* 关闭工单弹窗 */}
      <Modal
        title="关闭工单"
        open={closeModalVisible}
        onOk={handleClose}
        onCancel={() => {
          setCloseModalVisible(false);
          closeForm.resetFields();
        }}
        okText="确认关闭"
        cancelText="取消"
      >
        <Form form={closeForm} layout="vertical">
          <Form.Item name="reason" label="关闭原因">
            <Input.TextArea
              placeholder="请输入关闭原因（可选）"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
