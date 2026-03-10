// apps/admin/src/modules/dashboard/pages/DashboardPage.tsx
import { Card, Row, Col, Statistic } from "antd";
import { CheckSquareOutlined, UserOutlined, TeamOutlined } from "@ant-design/icons";

export function DashboardPage() {
  return (
    <div>
      <h2>仪表盘</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="待办事项"
              value={0}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="用户总数"
              value={0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="角色总数"
              value={0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
