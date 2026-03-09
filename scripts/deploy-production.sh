#!/bin/bash
# 生产环境快速部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必需的工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_info "✅ 环境检查通过"
}

# 检查环境变量
check_env_file() {
    log_info "检查环境变量配置..."
    
    if [ ! -f ".env.prod" ]; then
        log_warn ".env.prod 文件不存在"
        
        if [ -f ".env.prod.example" ]; then
            log_info "从模板创建 .env.prod 文件..."
            cp .env.prod.example .env.prod
            log_warn "请编辑 .env.prod 文件并填写实际配置"
            log_info "编辑命令: vi .env.prod"
            read -p "是否现在编辑? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                vi .env.prod
            fi
        else
            log_error ".env.prod.example 模板文件不存在"
            exit 1
        fi
    fi
    
    # 检查必需的环境变量
    source .env.prod
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL 未设置"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRET 未设置"
        exit 1
    fi
    
    log_info "✅ 环境变量检查通过"
}

# 构建 Docker 镜像
build_images() {
    log_info "开始构建 Docker 镜像..."
    
    log_info "构建 API 镜像..."
    docker build -f Dockerfile.api -t ${REGISTRY:-ghcr.io}/${IMAGE_NAME:-feedbackhub}-api:${TAG:-v1-latest} .
    
    log_info "构建 Admin 镜像..."
    docker build -f Dockerfile.admin -t ${REGISTRY:-ghcr.io}/${IMAGE_NAME:-feedbackhub}-admin:${TAG:-v1-latest} .
    
    log_info "✅ 镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    log_info "✅ 服务启动完成"
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    
    sleep 5
    
    docker-compose -f docker-compose.prod.yml ps
    
    # 检查 API 服务
    if curl -f http://localhost:${API_PORT:-3000}/health &> /dev/null; then
        log_info "✅ API 服务健康检查通过"
    else
        log_warn "API 服务健康检查失败"
    fi
    
    # 检查 Admin 服务
    if curl -f http://localhost:${ADMIN_PORT:-80}/ &> /dev/null; then
        log_info "✅ Admin 服务健康检查通过"
    else
        log_warn "Admin 服务健康检查失败"
    fi
}

# 显示日志
show_logs() {
    log_info "显示服务日志（按 Ctrl+C 退出）..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# 主函数
main() {
    echo "======================================"
    echo "  FeedbackHub 生产环境部署脚本"
    echo "======================================"
    echo ""
    
    # 解析命令行参数
    case "${1:-deploy}" in
        build)
            check_requirements
            build_images
            ;;
        start)
            check_env_file
            start_services
            check_status
            ;;
        stop)
            log_info "停止服务..."
            docker-compose -f docker-compose.prod.yml down
            log_info "✅ 服务已停止"
            ;;
        restart)
            log_info "重启服务..."
            docker-compose -f docker-compose.prod.yml restart
            check_status
            ;;
        logs)
            show_logs
            ;;
        status)
            docker-compose -f docker-compose.prod.yml ps
            ;;
        deploy)
            check_requirements
            check_env_file
            build_images
            start_services
            check_status
            
            echo ""
            log_info "🎉 部署完成！"
            echo ""
            echo "服务访问地址:"
            echo "  - API:     http://localhost:${API_PORT:-3000}"
            echo "  - Admin:   http://localhost:${ADMIN_PORT:-80}"
            echo ""
            echo "查看日志: $0 logs"
            echo "重启服务: $0 restart"
            echo "停止服务: $0 stop"
            ;;
        *)
            echo "使用方法: $0 {deploy|build|start|stop|restart|logs|status}"
            echo ""
            echo "命令说明:"
            echo "  deploy  - 完整部署（构建+启动）"
            echo "  build   - 仅构建镜像"
            echo "  start   - 仅启动服务"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  status  - 查看状态"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
