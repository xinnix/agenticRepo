# 新的图片上传流程说明

## 概述

按照用户要求，图片上传流程已修改为：**选择图片后立即上传到OSS，提交表单时才将URL存入数据库**。

## 新的工作流程

### 1. 选择图片阶段
```
用户点击"+"按钮 → 选择图片 → 立即上传到OSS → 返回OSS URL → 显示图片
```

**前端实现**：
- 在 `pages/user/submit/index.vue` 的 `chooseImage()` 函数中
- 选择图片后立即调用 `uploadFile()` 上传到OSS
- 上传成功后存储OSS URL到 `images.value` 数组
- 如果上传失败，显示错误提示

### 2. 提交表单阶段
```
用户填写表单 → 点击"提交反馈" → 使用已上传的OSS URLs → 创建工单记录
```

**前端实现**：
- 提交时直接使用 `images.value` 中的OSS URLs
- 通过 `attachmentUrls` 参数传递给后端

### 3. 后端处理阶段
```
接收attachmentUrls → 创建附件记录 → 关联到工单 → 返回完整工单信息
```

**后端实现**：
- 在 `ticket.service.ts` 的 `create()` 方法中
- 支持两种附件处理方式：
  1. `attachmentIds`：传统方式（通过后端上传）
  2. `attachmentUrls`：新的OSS直传方式
- 自动解析URL获取文件信息和类型

## 代码修改

### 前端修改

#### 1. 选择图片逻辑
```typescript
// pages/user/submit/index.vue
async function chooseImage() {
  try {
    const filePaths = await selectImage(9 - images.value.length);

    // 逐个上传选择的图片
    for (const filePath of filePaths) {
      try {
        uni.showLoading({ title: '上传中...', mask: true });

        // 直接上传到OSS并获取URL
        const attachment = await uploadFile(filePath, 'IMAGE');

        // 存储OSS URL而不是本地路径
        images.value.push(attachment.url);

        uni.hideLoading();
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
      } catch (uploadError) {
        console.error('图片上传失败:', uploadError);
        uni.hideLoading();
        uni.showToast({
          title: '上传失败',
          icon: 'error'
        });
      }
    }
  } catch (error) {
    console.error('选择图片失败', error);
    uni.showToast({
      title: '选择失败',
      icon: 'error'
    });
  }
}
```

#### 2. 提交逻辑
```typescript
// pages/user/submit/index.vue
async function handleSubmit() {
  try {
    // 图片已经在选择时上传到OSS，现在直接使用URLs
    // 不需要再上传图片

    // 创建工单（直接使用OSS URLs）
    await ticketStore.createTicket({
      ...formData.value,
      attachmentUrls: images.value, // 直接使用OSS URLs
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    // 延迟跳转到工单列表
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    console.error('提交失败', error);
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'error',
    });
  } finally {
    submitting.value = false;
  }
}
```

#### 3. 类型定义
```typescript
// api/types.ts
export interface CreateTicketDto {
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  location?: string;
  attachmentIds?: string[]; // 通过后端上传的附件ID
  attachmentUrls?: string[]; // 直接上传到OSS的URLs
}
```

### 后端修改

#### 1. 工单服务
```typescript
// ticket.service.ts
async create(data: {
  // ... 其他字段
  attachmentIds?: string[];
  attachmentUrls?: string[]; // 直接上传的OSS URLs
}) {
  // 创建工单
  const ticket = await this.prisma.ticket.create({ /* ... */ });

  // 处理附件
  const attachments = [];

  // 1. 处理通过后端上传的附件ID
  if (data.attachmentIds && data.attachmentIds.length > 0) {
    await this.prisma.attachment.updateMany({
      where: { id: { in: data.attachmentIds } },
      data: { ticketId: ticket.id },
    });
    attachments.push(...await this.prisma.attachment.findMany({
      where: { id: { in: data.attachmentIds } }
    }));
  }

  // 2. 处理直接上传的OSS URLs
  if (data.attachmentUrls && data.attachmentUrls.length > 0) {
    for (const url of data.attachmentUrls) {
      const attachment = await this.prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          url,
          fileName: this.extractFileNameFromUrl(url),
          fileSize: 0,
          mimeType: this.getMimeTypeFromUrl(url),
          type: this.getFileTypeFromUrl(url),
          uploadedById: data.createdById,
        },
      });
      attachments.push(attachment);
    }
  }

  // 重新获取包含附件的工单
  return await this.prisma.ticket.findUnique({
    where: { id: ticket.id },
    include: {
      createdBy: { select: { id: true, username: true, firstName: true, lastName: true } },
      category: { select: { id: true, name: true } },
      attachments: true,
    },
  });
}
```

#### 2. 辅助方法
```typescript
// ticket.service.ts - 辅助方法
private extractFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
    return fileName || 'unknown';
  } catch (error) {
    return url.substring(url.lastIndexOf('/') + 1) || 'unknown';
  }
}

private getMimeTypeFromUrl(url: string): string {
  const ext = url.substring(url.lastIndexOf('.')).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

private getFileTypeFromUrl(url: string): 'IMAGE' | 'VIDEO' {
  const ext = url.substring(url.lastIndexOf('.')).toLowerCase();
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  return videoExts.includes(ext) ? 'VIDEO' : 'IMAGE';
}
```

## 优势

1. **即时反馈**：用户选择图片后立即知道是否上传成功
2. **减少网络流量**：如果用户不提交表单，已上传的图片不会占用服务器带宽
3. **用户体验好**：上传过程有进度提示和状态反馈
4. **数据一致性**：只有提交表单的图片才会被记录到数据库
5. **容错性**：上传失败的图片不会影响表单提交

## 注意事项

1. **OSS配置**：需要正确配置阿里云OSS才能使用直传功能
2. **CORS配置**：OSS Bucket需要配置正确的CORS规则
3. **文件大小限制**：根据OSS配置限制单文件大小
4. **网络依赖**：需要稳定的网络连接才能上传
5. **临时存储**：上传成功但未提交的图片仅存储在前端，刷新页面会丢失

## 故障排除

### 上传失败
- 检查OSS配置是否正确
- 确认网络连接稳定
- 查看控制台错误信息

### 图片不显示
- 检查OSS URL是否可访问
- 确认图片格式支持
- 验证CORS配置

### 提交失败
- 检查后端API是否正常
- 确认附件URL格式正确
- 查看服务器日志
