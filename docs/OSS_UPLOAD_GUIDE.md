# OSS 上传功能使用指南

## 概述

小程序支持两种文件上传方式：
1. **传统上传**：文件通过后端 API 上传到服务器，由后端处理存储
2. **OSS 直传**：客户端直接上传文件到阿里云 OSS，后端仅记录文件信息

## 当前实现

### 传统上传流程
```
小程序 → uni.uploadFile → 后端 /api/v1/attachments/upload → 后端处理存储 → 返回结果
```

### OSS 直传流程（推荐）
```
小程序 → 获取 OSS 凭证 → 直接上传到 OSS → 记录文件信息
```

## 配置 OSS

### 1. 环境变量配置

在 `apps/api/.env` 中添加以下配置：

```env
# 文件存储配置
FILE_STORAGE_PROVIDER=aliyun-oss

# 阿里云 OSS 配置
OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
OSS_BUCKET=your-bucket-name
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_REGION=oss-cn-hangzhou
```

### 2. 安装依赖

```bash
pnpm add ali-oss -w
```

## 使用方法

### 前端上传（小程序）

```typescript
import { useUpload } from '@/composables/useUpload';

const { uploadFile } = useUpload();

// 上传文件（自动选择最优方式）
await uploadFile(filePath, 'IMAGE');
```

### 后端 API

#### 获取 OSS 上传凭证
```
GET /api/v1/attachments/upload-credentials?dir=attachments
```

响应示例：
```json
{
  "accessKeyId": "xxx",
  "accessKeySecret": "xxx",
  "securityToken": "xxx",
  "expiration": "2024-01-01T00:00:00.000Z",
  "bucket": "your-bucket",
  "region": "oss-cn-hangzhou",
  "endpoint": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com"
}
```

#### 传统上传
```
POST /api/v1/attachments/upload
Content-Type: multipart/form-data

{
  "file": <binary>,
  "type": "IMAGE",
  "ticketId": "optional"
}
```

## 技术实现

### FileStorageService

支持多种存储策略：
- `local`：本地存储
- `aliyun-oss`：阿里云 OSS

```typescript
export interface IFileStorage {
  upload(file: UploadedFile, dirPath: string): Promise<UploadResult>;
  delete(filePath: string): Promise<void>;
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
  getUploadCredentials(dirPath: string): Promise<UploadCredentials>;
}
```

### 上传流程

1. **获取凭证**：调用 `/upload-credentials` API
2. **直传 OSS**：使用凭证直接上传到 OSS
3. **记录文件**：在后端记录文件信息

## 注意事项

### 安全
- 使用 OSS 时，建议使用 RAM 服务生成临时 STS Token
- 不要在前端暴露长期的访问密钥

### 性能
- OSS 直传可以减少服务器带宽占用
- 适合大文件上传

### 兼容性
- 如果 OSS 未配置，系统会自动回退到传统上传
- 支持图片和视频文件

## 故障排除

### 问题 1：上传失败
- 检查 OSS 配置是否正确
- 确认网络连接正常
- 查看控制台错误信息

### 问题 2：权限错误
- 检查 OSS 访问密钥是否有效
- 确认 Bucket 权限设置
- 验证 STS Token 是否过期

### 问题 3：CORS 错误
- 在 OSS 控制台配置 CORS 规则
- 允许小程序域名访问

## 参考文档

- [阿里云 OSS 官方文档](https://help.aliyun.com/product/31815.html)
- [小程序上传文档](https://developers.weixin.qq.com/miniprogram/dev/api/media/image/wx.chooseImage.html)
- [uni-app 上传文档](https://uniapp.dcloud.net.cn/api/request/request.html#uploadfile)
