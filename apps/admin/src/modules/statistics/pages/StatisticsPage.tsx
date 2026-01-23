import { useState } from "react";
import { Card, Row, Col, Statistic, DatePicker, Select, Space } from "antd";
import {
  CheckCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { Table, Tag } from "antd";

// 本地类型定义
type TicketStatus = "WAIT_ASSIGN" | "WAIT_ACCEPT" | "PROCESSING" | "COMPLETED" | "CLOSED";

const { RangePicker } = DatePicker;

// 状态配置
const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  WAIT_ASSIGN: { color: "default", label: "待指派" },
  WAIT_ACCEPT: { color: "processing", label: "待接单" },
  PROCESSING: { color: "blue", label: "处理中" },
  COMPLETED: { color: "success", label: "已完成" },
  CLOSED: { color: "default", label: "已关闭" },
};

export const StatisticsPage = () => {
  const [dateRange, setDateRange] = useState<any>(null);
  const [selectedInterval, setSelectedInterval] = useState<
    "day" | "week" | "month"
  >("day");

  // 获取工单列表用于统计
  const { result: ticketResult } = useList({
    resource: "ticket",
    pagination: { pageSize: 1000 },
    queryOptions: {
      enabled: true,
    },
  });

  const tickets = ticketResult?.data || [];

  // 计算统计数据
  const calculateStats = () => {
    const total = tickets.length;
    const completed = tickets.filter((t: any) => t.status === "COMPLETED");
    const closed = tickets.filter((t: any) => t.status === "CLOSED");
    const overdue = tickets.filter((t: any) => t.isOverdue);
    const rated = tickets.filter((t: any) => t.rating);

    // 平均评分
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum: number, t: any) => sum + t.rating, 0) / rated.length
        : 0;

    // 按状态分组
    const statusGroups: Record<string, number> = {};
    tickets.forEach((t: any) => {
      statusGroups[t.status] = (statusGroups[t.status] || 0) + 1;
    });

    // 按分类分组
    const categoryGroups: Record<string, number> = {};
    tickets.forEach((t: any) => {
      const catName = t.category?.name || "未分类";
      categoryGroups[catName] = (categoryGroups[catName] || 0) + 1;
    });

    // 趋势数据（按天）
    const trendData = tickets.reduce((acc: any, t: any) => {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      completed: completed.length,
      closed: closed.length,
      overdue: overdue.length,
      avgRating: avgRating.toFixed(1),
      completionRate: total > 0 ? (((completed.length + closed.length) / total) * 100).toFixed(1) : "0",
      statusGroups,
      categoryGroups,
      trendData,
    };
  };

  const stats = calculateStats();

  // 状态分布表格数据
  const statusData = Object.entries(stats.statusGroups).map(
    ([status, count]) => ({
      status,
      count,
      percentage: ((count / stats.total) * 100).toFixed(1),
    })
  );

  // 分类分布表格数据
  const categoryData = Object.entries(stats.categoryGroups)
    .map(([name, count]) => ({
      categoryName: name,
      count,
      percentage: ((count / stats.total) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);

  // 超时工单列表
  const overdueTickets = tickets
    .filter((t: any) => t.isOverdue)
    .slice(0, 10);

  // 超时表格列
  const overdueColumns = [
    { title: "工单编号", dataIndex: "ticketNumber", width: 140 },
    { title: "标题", dataIndex: "title", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (val: TicketStatus) => {
        const config = STATUS_CONFIG[val];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "处理人",
      dataIndex: "assignedTo",
      width: 100,
      render: (user: any) => user?.username || "-",
    },
    {
      title: "截止时间",
      dataIndex: "deadlineAt",
      width: 160,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1
        style={{
          marginBottom: 24,
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        数据统计
      </h1>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
          />
          <Select
            value={selectedInterval}
            onChange={setSelectedInterval}
            style={{ width: 100 }}
            options={[
              { label: "按天", value: "day" },
              { label: "按周", value: "week" },
              { label: "按月", value: "month" },
            ]}
          />
        </Space>
      </Card>

      {/* 概览统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总工单"
              value={stats.total}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              suffix={`/ ${stats.total}`}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="超时工单"
              value={stats.overdue}
              valueStyle={{ color: stats.overdue > 0 ? "#ff4d4f" : "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="完成率"
              value={stats.completionRate}
              suffix="%"
              valueStyle={{
                color: parseFloat(stats.completionRate) >= 80 ? "#52c41a" : "#faad14",
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avgRating}
              prefix={<StarFilled />}
              suffix="/ 5"
              precision={1}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="关闭工单" value={stats.closed} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 状态分布表格 */}
        <Col span={24}>
          <Card title="状态分布" style={{ marginBottom: 16 }}>
            <Table
              columns={[
                {
                  title: "状态",
                  dataIndex: "status",
                  key: "status",
                  render: (val: string) => STATUS_CONFIG[val]?.label || val,
                },
                { title: "工单数", dataIndex: "count" },
                {
                  title: "占比",
                  dataIndex: "percentage",
                  render: (val: string) => `${val}%`,
                },
              ]}
              dataSource={statusData}
              rowKey="status"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* 分类统计表格 */}
        <Col span={12}>
          <Card title="分类统计" style={{ marginBottom: 16 }}>
            <Table
              columns={[
                {
                  title: "分类名称",
                  dataIndex: "categoryName",
                  key: "categoryName",
                },
                { title: "工单数", dataIndex: "count", sorter: true },
                {
                  title: "占比",
                  dataIndex: "percentage",
                  render: (val: string) => `${val}%`,
                },
              ]}
              dataSource={categoryData}
              rowKey={(record) => record.categoryName}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 超时工单 */}
        <Col span={12}>
          <Card title="超时工单" style={{ marginBottom: 16 }}>
            {overdueTickets.length > 0 ? (
              <Table
                columns={overdueColumns}
                dataSource={overdueTickets}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  color: "#999",
                }}
              >
                暂无超时工单
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
