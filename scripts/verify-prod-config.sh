#!/bin/bash
# 生产环境配置验证脚本

echo "🔍 验证生产环境 API 地址配置"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 GitHub Actions 配置
echo "📋 检查 GitHub Actions 配置..."
if grep -q "VITE_API_URL: /trpc" .github/workflows/deploy.yml; then
    echo -e "${GREEN}✅${NC} GitHub Actions 默认配置正确: VITE_API_URL=/trpc"
else
    echo -e "${RED}❌${NC} GitHub Actions 配置可能有问题"
fi
echo ""

# 2. 检查 Dockerfile 默认值
echo "📋 检查 Dockerfile.admin 默认值..."
if grep -q "ARG VITE_API_URL=/trpc" Dockerfile.admin; then
    echo -e "${GREEN}✅${NC} Dockerfile 默认值正确: VITE_API_URL=/trpc"
else
    echo -e "${RED}❌${NC} Dockerfile 默认值可能不正确"
fi
echo ""

# 3. 检查 nginx 配置
echo "📋 检查 nginx.conf 反向代理..."
if grep -q "proxy_pass http://api:3000" nginx.conf; then
    echo -e "${GREEN}✅${NC} nginx 反向代理正确: http://api:3000"
else
    echo -e "${RED}❌${NC} nginx 配置可能有问题"
fi
echo ""

# 4. 检查 docker-compose 配置
echo "📋 检查 docker-compose.prod.yml..."
if grep -q "env_file:" docker-compose.prod.yml | grep -q "admin"; then
    echo -e "${YELLOW}⚠️${NC} admin 服务配置了 env_file（运行时配置，对构建无效）"
else
    echo -e "${GREEN}✅${NC} docker-compose 配置清晰"
fi
echo ""

# 5. 数据流验证
echo "📊 生产环境数据流验证："
echo "  1. 浏览器请求: https://your-domain.com/trpc"
echo "  2. Nginx 接收: localhost:80"
echo "  3. 反向代理到: api:3000 (容器内网络)"
echo "  4. 后端处理: NestJS tRPC Router"
echo ""

# 6. 构建验证
echo "🔧 构建验证建议："
echo "  1. 拉取最新镜像:"
echo "     docker pull ghcr.io/你的用户名/feedbackhub-admin:v1-latest"
echo ""
echo "  2. 启动容器:"
echo "     docker compose -f docker-compose.prod.yml up admin"
echo ""
echo "  3. 检查构建的 JS 文件:"
echo "     docker exec feedbackhub-admin-prod sh -c 'grep -o \"VITE_API_URL[^,]*\" /usr/share/nginx/html/assets/*.js | head -1'"
echo "     应该输出: /trpc"
echo ""

echo "✨ 验证完成！"
