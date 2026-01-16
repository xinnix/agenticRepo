import { Form, Input, Button, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useLogin } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export const LoginPage = () => {
  const { mutate: login, isLoading } = useLogin();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    login(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          message.success("登录成功");
          navigate('/dashboard');
        },
        onError: (error: any) => {
          message.error(error?.message || "登录失败");
        },
      },
    );
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-card-wrapper">
          <Card className="login-card" bordered={false}>
            <div className="login-header">
              <h1>Admin</h1>
              <p>后台管理系统</p>
            </div>
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              size="large"
            >
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: "请输入邮箱" },
                  { type: "email", message: "请输入有效的邮箱地址" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="邮箱"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={isLoading}>
                  登录
                </Button>
              </Form.Item>
            </Form>
            <div className="login-footer">
              <p>测试账号: admin@example.com / admin123</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
