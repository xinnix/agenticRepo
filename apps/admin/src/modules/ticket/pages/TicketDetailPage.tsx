import { useState, useMemo } from "react";
import { useOne, useUpdate } from "@refinedev/core";
import {
  Button,
  Space,
  Tag,
  Descriptions,
  Card,
  Tabs,
  Table,
  Form,
  Input,
  Modal,
  message,
  Rate,
  Avatar,
  Timeline,
  Statistic,
  Row,
  Col,
  Divider,
  Select,
} from "antd";
import { useTrpcQuery } from "../../../shared/hooks/useTrpcQuery";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  StarFilled,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";

// 本地类型定义（保留 WAIT_ACCEPT 以兼容旧数据）
type TicketStatus = "WAIT_ASSIGN" | "WAIT_ACCEPT" | "PROCESSING" | "COMPLETED" | "CLOSED";

const { TextArea } = Input;

// 状态标签配置
const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  WAIT_ASSIGN: { color: "default", label: "待指派", icon: <ClockCircleOutlined /> },
  WAIT_ACCEPT: { color: "processing", label: "待接单", icon: <ClockCircleOutlined /> },
  PROCESSING: { color: "blue", label: "处理中", icon: <ClockCircleOutlined /> },
  COMPLETED: { color: "success", label: "已完成", icon: <CheckCircleOutlined /> },
  CLOSED: { color: "default", label: "已关闭", icon: <CloseOutlined /> },
};

export const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { result, query } = useOne({
    resource: "ticket",
    id,
    queryOptions: {
      enabled: !!id,
    },
  });
  const { mutate: update } = useUpdate();

  // 获取办事员列表
  const { data: handlersData, isLoading: handlersLoading } = useTrpcQuery(
    "user.getHandlers",
    { page: 1, pageSize: 1000 },
    { enabled: true }
  );

  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const ticket = result?.data;

  // 格式化办事员列表为 Select options
  const handlerOptions = useMemo(() => {
    const handlers = handlersData?.items || [];
    return handlers.map((handler: any) => ({
      label: `${handler.realName || handler.username}${handler.department ? ` - ${handler.department.name}` : ""}`,
      value: handler.id,
    }));
  }, [handlersData]);

  // 状态历史表格列
  const statusHistoryColumns = [
    {
      title: "时间",
      dataIndex: "createdAt",
      width: 180,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
    {
      title: "操作人",
      dataIndex: "user",
      width: 100,
      render: (user: any) => user?.username || "-",
    },
    {
      title: "状态变更",
      render: (_: any, record: any) => (
        <Space>
          <Tag>{STATUS_CONFIG[record.fromStatus]?.label}</Tag>
          <span style={{ color: "#999" }}>-&gt;</span>
          <Tag>{STATUS_CONFIG[record.toStatus]?.label}</Tag>
        </Space>
      ),
    },
    {
      title: "备注",
      dataIndex: "remark",
      ellipsis: true,
      render: (val: string) => val || "-",
    },
  ];

  // 附件表格列
  const attachmentColumns = [
    {
      title: "文件名",
      dataIndex: "fileName",
      render: (val: string, record: any) => (
        <a
          href={record.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {val}
        </a>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 80,
      render: (val: string) => (val === "IMAGE" ? "图片" : "视频"),
    },
    {
      title: "大小",
      dataIndex: "fileSize",
      width: 100,
      render: (val: number) => {
        const kb = val / 1024;
        if (kb < 1024) return `${kb.toFixed(2)} KB`;
        return `${(kb / 1024).toFixed(2)} MB`;
      },
    },
    {
      title: "上传时间",
      dataIndex: "createdAt",
      width: 120,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
  ];

  // 评论列表
  const comments = ticket?.comments || [];
  const statusHistory = ticket?.statusHistory || [];
  const attachments = ticket?.attachments || [];

  // 状态操作
  const handleAction = async (action: string) => {
    try {
      switch (action) {
        case "complete":
          await update(
            {
              resource: "ticket",
              id,
              meta: { method: "complete" },
              values: { attachmentIds: [] },
            },
            {
              onSuccess: () => {
                message.success("工单已完成");
                query.refetch();
              },
            }
          );
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("操作失败:", error);
    }
  };

  // 提交评分
  const handleRate = async () => {
    try {
      const values = await form.validateFields();
      await update(
        {
          resource: "ticket",
          id,
          meta: { method: "rate" },
          values: { ...values, userId: "current" },
        },
        {
          onSuccess: () => {
            message.success("评价成功");
            setRateModalVisible(false);
            form.resetFields();
            query.refetch();
          },
        }
      );
    } catch (error) {
      console.error("评价失败:", error);
    }
  };

  // 关闭工单
  const handleClose = async () => {
    try {
      const values = await form.validateFields();
      await update(
        {
          resource: "ticket",
          id,
          meta: { method: "close" },
          values: { data: { reason: values.reason } },
        },
        {
          onSuccess: () => {
            message.success("工单已关闭");
            setCloseModalVisible(false);
            form.resetFields();
            query.refetch();
          },
        }
      );
    } catch (error) {
      console.error("关闭失败:", error);
    }
  };

  // 指派工单
  const handleAssign = async () => {
    try {
      const values = await assignForm.validateFields();
      await update(
        {
          resource: "ticket",
          id,
          meta: { method: "assign" },
          values: { data: { assignedId: values.assignedId } },
        },
        {
          onSuccess: () => {
            message.success("指派成功");
            setAssignModalVisible(false);
            assignForm.resetFields();
            query.refetch();
          },
        }
      );
    } catch (error) {
      console.error("指派失败:", error);
    }
  };

  // 获取可执行的操作
  const getAvailableActions = (status: TicketStatus) => {
    const actions: string[] = [];
    if (status === "PROCESSING") actions.push("complete");
    if (
      ["WAIT_ASSIGN", "PROCESSING", "COMPLETED"].includes(
        status
      )
    )
      actions.push("close");
    return actions;
  };

  if (!ticket) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        加载中...
      </div>
    );
  }

  const availableActions = getAvailableActions(ticket.status);

  return (
    <div style={{ padding: "24px" }}>
      {/* 顶部导航 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回
          </Button>
          <Divider type="vertical" />
          <span>
            工单编号: <strong>{ticket.ticketNumber}</strong>
          </span>
          <Tag color={STATUS_CONFIG[ticket.status]?.color}>
            {STATUS_CONFIG[ticket.status]?.label}
          </Tag>
          {ticket.isOverdue && <Tag color="red">已超时</Tag>}
        </Space>
      </Card>

      <Row gutter={16}>
        {/* 左侧：主要信息 */}
        <Col span={16}>
          {/* 基本信息 */}
          <Card
            title="基本信息"
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label="分类">
                {ticket.category?.name}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag
                  color={ticket.priority === "URGENT" ? "red" : "blue"}
                >
                  {ticket.priority === "URGENT" ? "紧急" : "普通"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="工单状态">
                <Tag
                  color={STATUS_CONFIG[ticket.status]?.color}
                  icon={STATUS_CONFIG[ticket.status]?.icon}
                >
                  {STATUS_CONFIG[ticket.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="位置">
                {ticket.presetArea?.name || ticket.location || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="提报人姓名">
                {ticket.submitterName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="提报人电话">
                {ticket.submitterPhone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                <Space>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                  />
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
              {ticket.completedAt && (
                <Descriptions.Item label="完成时间" span={2}>
                  {new Date(ticket.completedAt).toLocaleString("zh-CN")}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 描述 */}
            {ticket.description && (
              <Card
                size="small"
                title="工单描述"
                style={{ marginTop: 16 }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {ticket.description}
                </p>
              </Card>
            )}

            {/* 位置信息 */}
            {(ticket.location || ticket.presetArea) && (
              <Card size="small" title="位置信息" style={{ marginTop: 16 }}>
                <Descriptions column={1}>
                  {ticket.location && (
                    <Descriptions.Item label="详细地址">
                      {ticket.location}
                    </Descriptions.Item>
                  )}
                  {ticket.presetArea && (
                    <Descriptions.Item label="预设区域">
                      {ticket.presetArea.name}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </Card>

          {/* 附件 */}
          {attachments.length > 0 && (
            <Card title="附件" style={{ marginBottom: 16 }}>
              <Table
                columns={attachmentColumns}
                dataSource={attachments}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* Tab 内容 */}
          <Card>
            <Tabs
              defaultActiveKey="comments"
              items={[
                {
                  key: "comments",
                  label: `评论 (${comments.length})`,
                  children: (
                    <div>
                      {comments.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "40px 0",
                            color: "#999",
                          }}
                        >
                          暂无评论
                        </div>
                      ) : (
                        <Timeline
                          items={comments.map((comment: any) => ({
                            children: (
                              <Card
                                size="small"
                                style={{ marginBottom: 16 }}
                                headStyle={{
                                  backgroundColor:
                                      comment.commentType === "SYSTEM"
                                        ? "#f0f0f0"
                                        : undefined,
                                  }}
                              >
                                <Space direction="vertical" size="small">
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
                                      {new Date(comment.createdAt).toLocaleString(
                                        "zh-CN"
                                      )}
                                    </span>
                                  </Space>
                                  <div>{comment.content}</div>
                                </Space>
                              </Card>
                            ),
                          }))}
                        />
                      )}
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: `状态历史 (${statusHistory.length})`,
                  children: (
                    <Table
                      columns={statusHistoryColumns}
                      dataSource={statusHistory}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* 右侧：操作面板 */}
        <Col span={8}>
          {/* 操作面板 */}
          <Card title="工单操作" style={{ marginBottom: 16 }}>
            {availableActions.length > 0 ? (
              <Space direction="vertical" style={{ width: "100%" }}>
                {availableActions.includes("accept") && (
                  <Button
                    type="primary"
                    block
                    onClick={() => handleAction("accept")}
                  >
                    接单
                  </Button>
                )}
                {availableActions.includes("complete") && (
                  <Button
                    type="primary"
                    block
                    onClick={() => handleAction("complete")}
                  >
                    完成工单
                  </Button>
                )}
                {availableActions.includes("close") && (
                  <Button block onClick={() => setCloseModalVisible(true)}>
                    关闭工单
                  </Button>
                )}
                {ticket.status === "WAIT_ASSIGN" && (
                  <Button
                    block
                    onClick={() => setAssignModalVisible(true)}
                  >
                    指派工单
                  </Button>
                )}
              </Space>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "#999",
                }}
              >
                该工单已结束，无可用操作
              </div>
            )}
          </Card>

          {/* 评价面板 */}
          {ticket.status === "COMPLETED" && (
            <Card
              title="工单评价"
              extra={
                ticket.rating ? (
                  <Rate
                    disabled
                    value={ticket.rating}
                    character={<StarFilled />}
                    style={{ fontSize: 14 }}
                  />
                ) : null
              }
              style={{ marginBottom: 16 }}
            >
              {ticket.rating ? (
                <div>
                  <Rate
                    disabled
                    value={ticket.rating}
                    character={<StarFilled />}
                    style={{ marginBottom: 8 }}
                  />
                  {ticket.feedback && (
                    <div style={{ color: "#666" }}>
                      <strong>评价：</strong>
                      {ticket.feedback}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <p style={{ color: "#999", marginBottom: 16 }}>
                    请对本次服务进行评价
                  </p>
                  <Button type="primary" onClick={() => setRateModalVisible(true)}>
                    立即评价
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* 统计信息 */}
          <Card title="统计信息" style={{ marginBottom: 16 }}>
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="处理时长"
                  value={
                    ticket.completedAt
                      ? Math.round(
                          (new Date(ticket.completedAt).getTime() -
                            new Date(ticket.createdAt).getTime()) /
                            (1000 * 60 * 60)
                        )
                      : "-"
                  }
                  suffix="小时"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="评论数"
                  value={comments.length}
                  suffix="条"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 评价弹窗 */}
      <Modal
        title="工单评价"
        open={rateModalVisible}
        onOk={handleRate}
        onCancel={() => setRateModalVisible(false)}
        okText="提交评价"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="rating"
            label="评分"
            rules={[{ required: true, message: "请选择评分" }]}
          >
            <Rate
              style={{ fontSize: 24 }}
              character={<StarFilled />}
            />
          </Form.Item>
          <Form.Item name="feedback" label="反馈意见">
            <TextArea
              placeholder="请输入您的反馈意见（可选）"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 关闭工单弹窗 */}
      <Modal
        title="关闭工单"
        open={closeModalVisible}
        onOk={handleClose}
        onCancel={() => setCloseModalVisible(false)}
        okText="确认关闭"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="关闭原因">
            <TextArea
              placeholder="请输入关闭原因（可选）"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 指派弹窗 */}
      <Modal
        title="指派工单"
        open={assignModalVisible}
        onOk={handleAssign}
        onCancel={() => setAssignModalVisible(false)}
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
    </div>
  );
};
