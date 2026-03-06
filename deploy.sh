#!/bin/bash
# FeedbackHub 快速部署脚本

set -e

echo "🚀 FeedbackHub 快速部署脚本"
echo "============================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker 已安装${NC}"
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装，请先安装 Docker Compose${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f .env.prod ]; then
        echo -e "${YELLOW}⚠️  未找到 .env.prod 文件${NC}"
        echo "正在从模板创建..."

        if [ -f .env.prod.example ]; then
            cp .env.prod.example .env.prod
            echo -e "${GREEN}✅ 已创建 .env.prod 文件${NC}"
            echo -e "${YELLOW}⚠️  请编辑 .env.prod 文件，填写必要的配置信息${NC}"
            echo "nano .env.prod"
            read -p "按 Enter 继续（确保已修改配置）..."
        else
            echo -e "${RED}❌ 未找到 .env.prod.example 模板文件${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ 环境变量文件已就绪${NC}"
}

# 验证必要的环境变量
validate_env_vars() {
    source .env.prod

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ 请在 .env.prod 中设置 DATABASE_URL（外部数据库连接字符串）${NC}"
        exit 1
    fi

    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-in-production" ]; then
        echo -e "${RED}❌ 请在 .env.prod 中设置强密码的 JWT_SECRET${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 环境变量验证通过${NC}"
}

# 提示数据库配置
check_database_config() {
    source .env.prod

    echo ""
    echo -e "${YELLOW}📊 数据库配置检查${NC}"
    echo "============================"

    # 从 DATABASE_URL 提取数据库主机
    if [[ $DATABASE_URL =~ @([^:]+):?([0-9]*)? ]]; then
        DB_HOST="${BASH_REMATCH[1]}"
        echo -e "数据库主机: ${GREEN}$DB_HOST${NC}"

        # 测试数据库连接
        echo "正在测试数据库连接..."
        if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"

            if command -v psql &> /dev/null; then
                if PGPASSWORD="${BASH_REMATCH[2]}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
                    echo -e "${GREEN}✅ 数据库连接成功${NC}"
                else
                    echo -e "${YELLOW}⚠️  无法连接到数据库，请检查配置${NC}"
                    read -p "是否继续部署？(y/n) " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        exit 1
                    fi
                fi
            else
                echo -e "${YELLOW}⚠️  未安装 psql 客户端，跳过数据库连接测试${NC}"
            fi
        fi
    fi
}

# 创建必要的目录
create_directories() {
    mkdir -p uploads
    echo -e "${GREEN}✅ 已创建必要的目录${NC}"
}

# 拉取最新镜像
pull_images() {
    echo ""
    echo "📦 正在拉取最新 Docker 镜像..."
    source .env.prod

    # 使用 docker compose 或 docker-compose
    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml --env-file .env.prod pull
    else
        docker-compose -f docker-compose.prod.yml --env-file .env.prod pull
    fi

    echo -e "${GREEN}✅ 镜像拉取完成${NC}"
}

# 停止并删除旧容器
stop_old_containers() {
    echo ""
    echo "🛑 正在停止旧容器..."

    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml --env-file .env.prod down
    else
        docker-compose -f docker-compose.prod.yml --env-file .env.prod down
    fi

    echo -e "${GREEN}✅ 旧容器已停止${NC}"
}

# 启动新容器
start_containers() {
    echo ""
    echo "🚀 正在启动服务..."

    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
    else
        docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    fi

    echo -e "${GREEN}✅ 服务已启动${NC}"
}

# 等待服务就绪
wait_for_services() {
    echo ""
    echo "⏳ 等待服务启动..."

    # 等待 API 健康检查
    max_attempts=30
    attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ API 服务已就绪${NC}"
            break
        fi

        attempt=$((attempt + 1))
        echo "等待中... ($attempt/$max_attempts)"
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        echo -e "${YELLOW}⚠️  API 服务可能未完全启动，请检查日志${NC}"
    fi
}

# 显示服务状态
show_status() {
    echo ""
    echo "📊 服务状态："
    echo "============================"

    if docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml --env-file .env.prod ps
    else
        docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
    fi
}

# 显示访问信息
show_access_info() {
    source .env.prod

    echo ""
    echo "🎉 部署完成！"
    echo "============================"
    echo -e "${GREEN}✅ API 服务${NC}: http://localhost:${API_PORT:-3000}"
    echo -e "${GREEN}✅ 管理后台${NC}: http://localhost:${ADMIN_PORT:-80}"
    echo ""
    echo "📝 查看日志："
    if docker compose version &> /dev/null; then
        echo "docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
    else
        echo "docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f"
    fi
    echo ""
    echo "📖 更多信息请参考: docs/deploy/production.md"
}

# 主流程
main() {
    check_docker
    check_docker_compose
    check_env_file
    validate_env_vars
    check_database_config
    create_directories
    pull_images
    stop_old_containers
    start_containers
    wait_for_services
    show_status
    show_access_info
}

# 执行主流程
main
