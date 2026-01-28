/**
 * 文件上传相关组合式函数
 */
import { ref } from 'vue';
import * as attachmentApi from '@/api/attachment';
import type { Attachment } from '@/api/types';

/**
 * 文件上传 Hook
 */
export function useUpload() {
  const uploading = ref(false);
  const uploadedFiles = ref<Attachment[]>([]);

  /**
   * 选择图片（仅选择，不上传）
   */
  function chooseImage(maxCount: number = 9): Promise<string[]> {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          resolve(res.tempFilePaths);
        },
        fail: reject,
      });
    });
  }

  /**
   * 选择并立即上传图片（推荐使用）
   */
  async function chooseAndUploadImage(
    maxCount: number = 9
  ): Promise<Attachment[]> {
    uploading.value = true;

    try {
      // 1. 选择图片
      const tempPaths = await chooseImage(maxCount);

      // 2. 批量上传
      const uploadPromises = tempPaths.map(filePath => {
        try {
          return uploadToOssWithCredentials(filePath, 'IMAGE');
        } catch (error) {
          console.error(`文件上传失败: ${filePath}`, error);
          throw error;
        }
      });

      // 3. 等待所有上传完成
      const attachments = await Promise.all(uploadPromises);

      // 4. 保存到已上传列表
      uploadedFiles.value.push(...attachments);

      return attachments;
    } catch (error) {
      console.error('选择并上传图片失败', error);
      uni.showToast({
        title: '上传失败',
        icon: 'error',
      });
      throw error;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * 选择视频
   */
  function chooseVideo(maxDuration: number = 60): Promise<string> {
    return new Promise((resolve, reject) => {
      uni.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration,
        camera: 'back',
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: reject,
      });
    });
  }

  /**
   * 上传单个文件（直接使用后端上传）
   */
  async function uploadFile(
    filePath: string,
    type: 'IMAGE' | 'VIDEO' = 'IMAGE',
    ticketId?: string
  ): Promise<Attachment> {
    uploading.value = true;

    try {
      // 直接使用后端上传（避免 OSS 直传凭证配置问题）
      const attachment = await attachmentApi.uploadFile(filePath, type, ticketId);
      uploadedFiles.value.push(attachment);
      return attachment;
    } catch (error) {
      console.error('文件上传失败', error);
      uni.showToast({
        title: '上传失败',
        icon: 'error',
      });
      throw error;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * 使用OSS凭证上传文件
   * 真正的OSS直传流程：
   * 1. 获取OSS凭证
   * 2. 使用凭证直传OSS
   * 3. 返回上传结果
   */
  async function uploadToOssWithCredentials(
    filePath: string,
    type: 'IMAGE' | 'VIDEO' = 'IMAGE'
  ): Promise<Attachment> {
    try {
      // 1. 获取OSS上传凭证
      console.log('[OSS] 开始获取上传凭证...');
      const credentials = await attachmentApi.getUploadCredentials('attachments');
      console.log('[OSS] 凭证获取成功:', credentials);

      // 验证凭证完整性
      if (!credentials.bucket || !credentials.region || !credentials.endpoint) {
        console.error('[OSS] 凭证不完整:', credentials);
        throw new Error('OSS凭证不完整，请检查后端OSS配置');
      }

      // 2. 生成唯一文件名 - 注意：key 必须与 getUploadCredentials 传入的 dirPath 匹配
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const ext = filePath.substring(filePath.lastIndexOf('.'));
      // objectName 必须以 'attachments/' 开头，与 Policy 条件匹配
      const objectName = `attachments/${type.toLowerCase()}/${timestamp}-${randomStr}${ext}`;
      console.log('[OSS] 生成对象名:', objectName);

      // 3. 使用凭证直传OSS
      console.log('[OSS] 开始上传到OSS:', credentials.endpoint);
      const ossUrl = await attachmentApi.uploadToOss(credentials, filePath, objectName);
      console.log('[OSS] 上传成功:', ossUrl);

      // 4. 创建附件记录
      const attachment: Attachment = {
        id: `att_${timestamp}`,
        url: ossUrl,
        fileName: `uploaded_file${ext}`,
        fileSize: 0,
        mimeType: type === 'IMAGE' ? 'image/jpeg' : 'video/mp4',
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[OSS] 创建的 Attachment 对象:', JSON.stringify(attachment, null, 2));
      console.log('[OSS] 图片 URL:', attachment.url);

      return attachment;
    } catch (error) {
      console.error('[OSS] 上传失败:', error);
      throw error;
    }
  }

  /**
   * 批量上传文件
   */
  async function uploadFiles(
    filePaths: string[],
    type: 'IMAGE' | 'VIDEO' = 'IMAGE',
    ticketId?: string
  ): Promise<Attachment[]> {
    uploading.value = true;

    try {
      const attachments = await attachmentApi.uploadFiles(filePaths, type, ticketId);
      uploadedFiles.value.push(...attachments);
      return attachments;
    } catch (error) {
      console.error('批量上传失败', error);
      uni.showToast({
        title: '上传失败',
        icon: 'error',
      });
      throw error;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * 选择并上传图片
   */
  async function chooseAndUploadImages(
    maxCount: number = 9,
    ticketId?: string
  ): Promise<Attachment[]> {
    uploading.value = true;

    try {
      const attachments = await attachmentApi.chooseAndUploadImages(maxCount, ticketId);
      uploadedFiles.value.push(...attachments);
      return attachments;
    } catch (error) {
      console.error('选择并上传图片失败', error);
      throw error;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * 选择并上传视频
   */
  async function chooseAndUploadVideo(
    maxDuration: number = 60,
    ticketId?: string
  ): Promise<Attachment> {
    uploading.value = true;

    try {
      const attachment = await attachmentApi.chooseAndUploadVideo(maxDuration, ticketId);
      uploadedFiles.value.push(attachment);
      return attachment;
    } catch (error) {
      console.error('选择并上传视频失败', error);
      throw error;
    } finally {
      uploading.value = false;
    }
  }

  /**
   * 预览图片
   */
  function previewImage(urls: string[], current?: string) {
    uni.previewImage({
      urls,
      current: current || urls[0],
    });
  }

  /**
   * 清空已上传文件列表
   */
  function clearUploaded() {
    uploadedFiles.value = [];
  }

  /**
   * 移除已上传的文件
   */
  function removeUploaded(attachmentId: string) {
    const index = uploadedFiles.value.findIndex(f => f.id === attachmentId);
    if (index !== -1) {
      uploadedFiles.value.splice(index, 1);
    }
  }

  return {
    uploading,
    uploadedFiles,
    chooseImage,
    chooseAndUploadImage,
    chooseVideo,
    uploadFile,
    uploadFiles,
    chooseAndUploadImages,
    chooseAndUploadVideo,
    previewImage,
    clearUploaded,
    removeUploaded,
  };
}
