import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面"
        extra={
          <Button type="primary" onClick={() => navigate("/login")}>
            前往登录
          </Button>
        }
      />
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" onClick={() => navigate("/dashboard")}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};
