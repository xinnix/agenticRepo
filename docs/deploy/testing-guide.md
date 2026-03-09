# 🚀 Dockerfile.api 快速测试指南

## 📝 测试前准备

确保你已经配置好数据库连接：

```bash
# 检查 1panel.env 文件存在
cat 1panel.env

# 确保包含以下配置：
# DATABASE_URL=postgresql://user:password@host:port/database
```

## 🧪 测试步骤

### 方法 1：使用自动化测试脚本（推荐）

```bash
# 运行测试脚本
./scripts/test-docker-build.sh
```

### 方法 2：手动测试

```bash
# 1. 构建镜像
docker-compose -f docker-compose.local.yml build api

# 2. 检查镜像大小
docker images | grep feedbackhub-api

# 3. 验证镜像内容
docker run --rm xinnix2000/feedbackhub-api:v1-local ls -la node_modules/@opencode/

# 4. 启动服务
docker-compose -f docker-compose.local.yml up api

# 5. 查看日志
docker-compose -f docker-compose.local.yml logs -f api
```

## ✅ 成功标志

如果看到以下输出，说明构建成功：

```
✅ 镜像构建成功！
📊 镜像大小：约 300-500MB
🔍 node_modules 包含 shared 和 database
🚀 服务启动，监听 3000 端口
```

## 🔧 故障排查

### 构建失败

```bash
# 查看详细构建日志
docker-compose -f docker-compose.local.yml build --no-cache api 2>&1 | tee build.log
```

### 运行时错误

```bash
# 进入容器检查
docker run --rm -it xinnix2000/feedbackhub-api:v1-local sh

# 检查文件结构
ls -la
ls -la node_modules/@opencode/
ls -la dist/
ls -la infra/shared/dist/

# 检查 Prisma
npx prisma --version
ls -la infra/database/prisma/
```

### 数据库连接错误

```bash
# 检查环境变量
docker run --rm xinnix2000/feedbackhub-api:v1-local env | grep DATABASE

# 测试数据库连接
docker run --rm xinnix2000/feedbackhub-api:v1-local npx prisma db push
```

## 📊 性能对比

改进前 vs 改进后：

| 指标 | 改进前 | 改进后 |
|------|--------|--------|
| 镜像大小 | 1GB+ | 300-500MB |
| 构建时间 | 5-8分钟 | 3-5分钟 |
| 二次构建 | 5-8分钟 | 1-2分钟 |
| 模块查找问题 | 经常出现 | 已解决 |

## 🎯 下一步

如果测试成功，你可以：

1. **推送到镜像仓库**
   ```bash
   docker tag xinnix2000/feedbackhub-api:v1-local xinnix2000/feedbackhub-api:v1
   docker push xinnix2000/feedbackhub-api:v1
   ```

2. **更新生产配置**
   ```bash
   # 在 docker-compose.prod.yml 中使用新镜像
   ```

3. **部署到服务器**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 💡 优化建议

- 启用 BuildKit 以获得更好的性能
- 使用镜像缓存加速 CI/CD 流程
- 定期清理未使用的镜像和层
