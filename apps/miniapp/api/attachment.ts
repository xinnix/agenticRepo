/**
 * 附件上传 API
 */
import type { Attachment } from './types';

const BASE_URL = 'http://localhost:3000/api';

/**
 * 获取OSS上传凭证
 */
export function getUploadCredentials(dirPath = 'attachments'): Promise<{
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  bucket: string;
  region: string;
  endpoint: string;
  policy: string;
  signature: string;
  xOssSignatureVersion: string;
  xOssCredential: string;
}> {
  const token = uni.getStorageSync('accessToken');

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/attachments/upload-credentials?dir=${encodeURIComponent(dirPath)}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`,
      },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理后端响应包装格式，从 res.data.data 中提取凭证
          const credentials = res.data.data || res.data;
          resolve(credentials);
        } else {
          reject(new Error(res.data?.message || '获取上传凭证失败'));
        }
      },
      fail: reject,
    });
  });
}

/**
 * 使用OSS直传文件到OSS（真正的客户端直传）
 * 使用简化的 PostObject 方式，避免V4签名复杂度
 * 参考文档：https://help.aliyun.com/zh/oss/user-guide/wechat-applet-uploads-files-directly-to-oss
 */
export function uploadToOss(
  credentials: {
    accessKeyId: string;
    accessKeySecret: string;
    securityToken: string;
    expiration: string;
    bucket: string;
    region: string;
    endpoint: string;
    policy: string;
    signature: string;
    xOssSignatureVersion: string;
    xOssCredential: string;
  },
  filePath: string,
  objectName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 直接上传到OSS（不走后端）
    const ossUrl = `https://${credentials.bucket}.${credentials.region}.aliyuncs.com`;

    // 使用简化的 PostObject 表单参数（V1签名）
    const formData = {
      key: objectName,
      policy: credentials.policy,
      OSSAccessKeyId: credentials.accessKeyId,
      signature: credentials.signature,
      // 不添加额外的V4签名参数，避免签名不匹配问题
    };

    console.log('[OSS] 上传参数:', {
      ...formData,
      signature: formData.signature.substring(0, 20) + '...',
    });
    console.log('[OSS] 上传到:', ossUrl);

    uni.uploadFile({
      url: ossUrl,
      filePath,
      name: 'file',
      formData,
      success: (res) => {
        console.log('[OSS] 上传响应:', res);
        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          // 上传成功，返回OSS上的文件URL
          const fileUrl = `${ossUrl}/${objectName}`;
          console.log('[OSS] 上传成功，URL:', fileUrl);
          resolve(fileUrl);
        } else {
          console.error('OSS上传失败，状态码:', res.statusCode);
          console.error('错误详情:', res.data);
          reject(new Error(`上传失败: ${res.statusCode} - ${res.data}`));
        }
      },
      fail: (err) => {
        console.error('上传请求失败:', err);
        reject(err);
      },
    });
  });
}

/**
 * 上传单个文件
 * @param filePath 本地文件路径
 * @param type 文件类型（IMAGE/VIDEO）
 * @param ticketId 关联的工单ID（可选）
 */
export function uploadFile(
  filePath: string,
  type: 'IMAGE' | 'VIDEO' = 'IMAGE',
  ticketId?: string
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('accessToken');

    uni.showLoading({ title: '上传中...', mask: true });

    uni.uploadFile({
      url: `${BASE_URL}/attachments/upload`,
      filePath,
      name: 'file',
      formData: {
        type,
        ...(ticketId && { ticketId }),
      },
      header: {
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        uni.hideLoading();

        if (res.statusCode === 201) {
          const response = JSON.parse(res.data);
          // 后端使用 TransformInterceptor 包装响应，从 data 字段提取实际数据
          const attachment = response.data || response;
          console.log('[上传成功] 响应数据:', response);
          console.log('[上传成功] 附件对象:', attachment);
          resolve(attachment);
        } else {
          const error = JSON.parse(res.data);
          reject(new Error(error.message || '上传失败'));
        }
      },
      fail: (err) => {
        uni.hideLoading();
        reject(new Error('网络请求失败'));
      },
    });
  });
}

/**
 * 批量上传文件
 * @param filePaths 本地文件路径数组
 * @param type 文件类型
 * @param ticketId 关联的工单ID（可选）
 */
export async function uploadFiles(
  filePaths: string[],
  type: 'IMAGE' | 'VIDEO' = 'IMAGE',
  ticketId?: string
): Promise<Attachment[]> {
  const results: Attachment[] = [];

  for (const filePath of filePaths) {
    try {
      const result = await uploadFile(filePath, type, ticketId);
      results.push(result);
    } catch (error) {
      console.error('文件上传失败:', filePath, error);
      // 继续上传其他文件，不中断整个流程
    }
  }

  return results;
}

/**
 * 选择并上传图片
 * @param maxCount 最大选择数量
 * @param ticketId 关联的工单ID（可选）
 */
export async function chooseAndUploadImages(
  maxCount: number = 9,
  ticketId?: string
): Promise<Attachment[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const attachments = await uploadFiles(res.tempFilePaths, 'IMAGE', ticketId);
          resolve(attachments);
        } catch (error) {
          reject(error);
        }
      },
      fail: reject,
    });
  });
}

/**
 * 选择并上传视频
 * @param maxDuration 最大视频时长（秒）
 * @param ticketId 关联的工单ID（可选）
 */
export async function chooseAndUploadVideo(
  maxDuration: number = 60,
  ticketId?: string
): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    uni.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration,
      camera: 'back',
      success: async (res) => {
        try {
          const attachment = await uploadFile(res.tempFilePath, 'VIDEO', ticketId);
          resolve(attachment);
        } catch (error) {
          reject(error);
        }
      },
      fail: reject,
    });
  });
}

/**
 * 删除附件
 * @param id 附件ID
 */
export function deleteAttachment(id: string): Promise<{ success: boolean }> {
  const token = uni.getStorageSync('accessToken');

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/attachments/${id}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`,
      },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.message || '删除失败'));
        }
      },
      fail: reject,
    });
  });
}
