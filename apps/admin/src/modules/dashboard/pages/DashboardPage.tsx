import { Card, Row, Col, Statistic, Progress, List, Button } from "antd";
import {
  ArrowUpOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./DashboardPage.css";

// 模拟数据
const weeklyData = [
  { day: "Mon", activity: 12, tasks: 8 },
  { day: "Tue", activity: 18, tasks: 15 },
  { day: "Wed", activity: 15, tasks: 12 },
  { day: "Thu", activity: 22, tasks: 18 },
  { day: "Fri", activity: 28, tasks: 24 },
  { day: "Sat", activity: 20, tasks: 16 },
  { day: "Sun", activity: 14, tasks: 10 },
];

const taskStatsData = [
  { name: "Completed", value: 120, color: "#52c41a" },
  { name: "In Progress", value: 80, color: "#1890ff" },
  { name: "Pending", value: 40, color: "#faad14" },
];

const projects = [
  {
    id: 1,
    name: "Website Redesign",
    client: "ABC Corp",
    priority: "High",
    status: "In Progress",
    progress: 75,
  },
  {
    id: 2,
    name: "Mobile App Development",
    client: "XYZ Inc",
    priority: "Medium",
    status: "In Progress",
    progress: 45,
  },
  {
    id: 3,
    name: "Marketing Campaign",
    client: "Global Tech",
    priority: "Low",
    status: "Pending",
    progress: 20,
  },
];

const notifications = [
  {
    id: 1,
    title: "New project assigned",
    description: "You have been assigned to the Dashboard Redesign project",
    time: "5 min ago",
  },
  {
    id: 2,
    title: "Task completed",
    description: "Database optimization task has been completed",
    time: "1 hour ago",
  },
  {
    id: 3,
    title: "Meeting reminder",
    description: "Team standup meeting in 30 minutes",
    time: "2 hours ago",
  },
];

export const DashboardPage = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Default Dashboard</h1>
        <p>Welcome back! Here's what's happening with your projects today.</p>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Projects"
              value={24}
              prefix={<ProjectOutlined />}
              suffix="active"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Tasks"
              value={156}
              prefix={<CheckCircleOutlined />}
              suffix="tasks"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Tasks"
              value={42}
              prefix={<ClockCircleOutlined />}
              suffix="tasks"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={78.5}
              precision={1}
              suffix="%"
              valueStyle={{ color: "#52c41a" }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card className="welcome-card">
            <h2>Weekly Progress</h2>
            <p>You've completed 68% of your weekly goals</p>
            <Progress percent={68} status="active" strokeColor="#1890ff" />
            <div style={{ marginTop: 16 }}>
              <Button type="primary">View Details</Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Task Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskStatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Weekly Activity" extra={<Button type="link">See all</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="activity"
                  stroke="#1890ff"
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Tasks Overview" extra={<Button type="link">See all</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="#52c41a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Active Projects" extra={<Button type="link">View all</Button>}>
            <List
              dataSource={projects}
              renderItem={(project) => (
                <List.Item>
                  <List.Item.Meta
                    title={project.name}
                    description={
                      <div>
                        <div>Client: {project.client}</div>
                        <div>
                          <span className={`priority-badge priority-${project.priority.toLowerCase()}`}>
                            {project.priority}
                          </span>
                          <span style={{ marginLeft: 8 }}>{project.status}</span>
                        </div>
                      </div>
                    }
                  />
                  <Progress percent={project.progress} size="small" style={{ width: 100 }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Notifications" extra={<Button type="link">View all</Button>}>
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item>
                  <List.Item.Meta
                    title={notification.title}
                    description={notification.description}
                  />
                  <div className="notification-time">{notification.time}</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
