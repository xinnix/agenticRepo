import { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StarFilled,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import dayjs from "dayjs";
import { useTrpcQuery } from "../../../shared/hooks/useTrpcQuery";
import "./DashboardPage.css";

const { RangePicker } = DatePicker;

// 状态配置
const STATUS_CONFIG: Record<string, { color: string; label: string; chartColor: string }> = {
  WAIT_ASSIGN: { color: "default", label: "待指派", chartColor: "#d9d9d9" },
  WAIT_ACCEPT: { color: "processing", label: "待接单", chartColor: "#1890ff" },
  PROCESSING: { color: "blue", label: "处理中", chartColor: "#52c41a" },
  COMPLETED: { color: "success", label: "已完成", chartColor: "#13c2c2" },
  CLOSED: { color: "default", label: "已关闭", chartColor: "#722ed1" },
};

export const DashboardPage = () => {
  // 默认日期范围：最近30天
  const defaultStartDate = dayjs().subtract(30, "day").startOf("day");
  const defaultEndDate = dayjs().endOf("day");

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    defaultStartDate,
    defaultEndDate,
  ]);
  const [selectedInterval, setSelectedInterval] = useState<"day" | "week" | "month">("day");

  // 格式化日期为 ISO 字符串
  const startDate = dateRange[0]?.toISOString();
  const endDate = dateRange[1]?.toISOString();

  // 获取概览统计（使用 protectedProcedure）
  const { data: overview, isLoading: overviewLoading } = useTrpcQuery(
    "statistics.getOverview",
    { startDate, endDate },
    { enabled: !!startDate && !!endDate }
  );

  // 获取趋势统计（需要 permission，可能失败）
  const { data: trendData, isLoading: trendLoading } = useTrpcQuery(
    "statistics.getTrendStats",
    { startDate, endDate, interval: selectedInterval },
    { enabled: !!startDate && !!endDate, retry: false }
  );

  // 获取分类统计
  const { data: categoryData, isLoading: categoryLoading } = useTrpcQuery(
    "statistics.getCategoryStats",
    { startDate, endDate },
    { enabled: !!startDate && !!endDate, retry: false }
  );

  // 获取处理人绩效统计
  const { data: performanceData, isLoading: performanceLoading } = useTrpcQuery(
    "statistics.getPerformanceStats",
    { startDate, endDate, limit: 10 },
    { enabled: !!startDate && !!endDate, retry: false }
  );

  // 获取超时工单统计
  const { data: overdueData, isLoading: overdueLoading } = useTrpcQuery(
    "statistics.getOverdueStats",
    {},
    { retry: false }
  );

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    } else {
      setDateRange([defaultStartDate, defaultEndDate]);
    }
  };

  // 状态分布数据（用于饼图）
  const statusDistributionData = useMemo(() => {
    if (!overview?.statusDistribution) return [];
    return overview.statusDistribution.map((item: any) => ({
      name: STATUS_CONFIG[item.status]?.label || item.status,
      value: item.count,
      color: STATUS_CONFIG[item.status]?.chartColor || "#1890ff",
    }));
  }, [overview]);

  // 分类统计数据（用于柱状图）
  const categoryChartData = useMemo(() => {
    const data = categoryData || overview?.categoryStats || [];
    return data.map((item: any) => ({
      categoryName: item.categoryName,
      count: item.count,
    }));
  }, [categoryData, overview]);

  // 趋势数据格式化
  const trendChartData = useMemo(() => {
    if (!trendData) return [];
    return trendData.map((item: any) => ({
      date: item.date,
      count: item.count,
    }));
  }, [trendData]);

  // 处理人绩效表格列
  const performanceColumns = [
    {
      title: "排名",
      key: "rank",
      render: (_: any, __: any, index: number) => (
        <span
          style={{
            fontWeight: "bold",
            color: index < 3 ? "#1890ff" : undefined,
          }}
        >
          {index + 1}
        </span>
      ),
      width: 80,
    },
    {
      title: "处理人",
      dataIndex: "handlerName",
      key: "handlerName",
    },
    {
      title: "处理量",
      dataIndex: "totalTickets",
      key: "totalTickets",
      sorter: true,
      defaultSortOrder: "descend" as const,
    },
    {
      title: "平均评分",
      dataIndex: "avgRating",
      key: "avgRating",
      render: (value: number) => (
        <span>
          <StarFilled style={{ color: "#faad14" }} /> {value.toFixed(2)}
        </span>
      ),
    },
    {
      title: "平均处理时间",
      dataIndex: "avgCompletionTime",
      key: "avgCompletionTime",
      render: (value: number) => `${value.toFixed(2)} 小时`,
    },
  ];

  // 超时工单表格列
  const overdueColumns = [
    { title: "工单编号", dataIndex: "ticketNumber", width: 140 },
    { title: "标题", dataIndex: "title", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      width: 100,
      render: (val: string) => {
        const config = STATUS_CONFIG[val];
        return <Tag color={config?.color}>{config?.label || val}</Tag>;
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 80,
      render: (val: string) => {
        const priorityMap: Record<string, { text: string; color: string }> = {
          HIGH: { text: "高", color: "red" },
          MEDIUM: { text: "中", color: "orange" },
          LOW: { text: "低", color: "green" },
        };
        const p = priorityMap[val];
        return <Tag color={p?.color}>{p?.text || val}</Tag>;
      },
    },
    {
      title: "处理人",
      dataIndex: ["assignedTo", "name"],
      width: 120,
      render: (name: string) => name || "-",
    },
    {
      title: "截止时间",
      dataIndex: "deadlineAt",
      width: 160,
      render: (val: string) => new Date(val).toLocaleString("zh-CN"),
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>数据仪表盘</h1>
        <p>工单数据统计与分析</p>
      </div>

      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <span>统计时间：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <span style={{ marginLeft: 16 }}>趋势间隔：</span>
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

      {/* 核心指标卡片（6个） */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="总工单"
              value={overview?.summary?.totalTickets || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="已完成"
              value={overview?.summary?.completedTickets || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="已关闭"
              value={overview?.summary?.closedTickets || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="超时工单"
              value={overview?.summary?.overdueTickets || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{
                color: (overview?.summary?.overdueTickets || 0) > 0 ? "#ff4d4f" : "#faad14",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="完成率"
              value={overview?.summary?.completionRate || 0}
              precision={1}
              suffix="%"
              valueStyle={{
                color: (overview?.summary?.completionRate || 0) >= 80 ? "#52c41a" : "#faad14",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card loading={overviewLoading}>
            <Statistic
              title="平均评分"
              value={overview?.summary?.avgRating || 0}
              precision={1}
              prefix={<StarFilled />}
              suffix="/ 5"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 状态分布饼图 */}
        <Col xs={24} lg={12}>
          <Card title="状态分布" loading={overviewLoading}>
            {statusDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        {/* 分类统计柱状图 */}
        <Col xs={24} lg={12}>
          <Card title="分类统计" loading={categoryLoading || overviewLoading}>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoryName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 工单趋势图 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="工单趋势"
            loading={trendLoading}
            extra={
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
            }
          >
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1890ff" fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 处理人绩效排行 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />
                处理人绩效排行
              </span>
            }
            loading={performanceLoading}
          >
            {performanceData && performanceData.length > 0 ? (
              <Table
                columns={performanceColumns}
                dataSource={performanceData}
                rowKey="handlerId"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 超时工单列表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title={
              <span>
                <ExclamationCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
                超时工单
              </span>
            }
            loading={overdueLoading}
          >
            {overdueData?.recentOverdue && overdueData.recentOverdue.length > 0 ? (
              <Table
                columns={overdueColumns}
                dataSource={overdueData.recentOverdue}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                暂无超时工单
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
