<template>

  <view class="min-h-screen bg-page">
    <!-- 极简表单区域 -->
    <view class="form-container">
      <u-form labelPosition="top" :model="formData" :rules="rules" ref="uFormRef" label-width="200rpx">
        <!-- 位置信息 -->
        <u-form-item label="位置信息" prop="presetAreaId" borderBottom @click="showAreaActionSheet = true">
          <u-input v-model="selectedAreaName" placeholder="请选择位置信息（可选）" disabled disabledColor="#ffffff" border="none"
            :custom-style="inputStyle" />
          <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <!-- 问题分类 -->
        <u-form-item label="问题分类" prop="categoryId" required borderBottom @click="showCategoryActionSheet = true">
          <u-input v-model="selectedCategoryName" placeholder="请选择问题分类" disabled disabledColor="#ffffff" border="none"
            :custom-style="inputStyle" />
          <u-icon slot="right" name="arrow-right"></u-icon>
        </u-form-item>

        <!-- 详细描述 -->
        <u-form-item label="详细描述" prop="description" required borderBottom>
          <u-textarea v-model="formData.description" placeholder="请详细描述问题情况，以便更好地处理" border="none"
            :custom-style="textareaStyle" :maxlength="500" count />
        </u-form-item>

        <!-- 图片上传 -->
        <u-form-item label="图片上传" prop="attachments" borderBottom>
          <u-upload :fileList="fileList" @afterRead="onAfterRead" @delete="onDelete" :maxCount="9"
            :maxSize="5 * 1024 * 1024" :previewFullImage="true" :deletable="true" multiple />
        </u-form-item>

        <!-- 提交者信息 -->




        <u-form-item v-if="!formData.isAnonymous" label="姓名" prop="submitterName" borderBottom>
          <u-input v-model="formData.submitterName" placeholder="请输入您的姓名" border="none" :custom-style="inputStyle" />
        </u-form-item>

        <u-form-item v-if="!formData.isAnonymous" label="手机号" prop="submitterPhone" borderBottom>
          <u-input v-model="formData.submitterPhone" placeholder="请输入您的手机号" border="none" :custom-style="inputStyle"
            type="number" :maxlength="11" />
        </u-form-item>
        <u-form-item label="匿名提交" prop="isAnonymous" borderBottom>
          <u-switch v-model="formData.isAnonymous" :active-value="true" :inactive-value="false" />
        </u-form-item>


        <!-- 提交按钮 -->
        <view class="submit-section">
          <u-button type="primary" :loading="submitting" @click="handleSubmit" :custom-style="{ width: '100%' }">
            提交反馈
          </u-button>
        </view>
      </u-form>
    </view>

    <!-- 分类选择 ActionSheet -->
    <u-action-sheet :show="showCategoryActionSheet" :actions="categoryActions" title="请选择问题分类"
      @close="showCategoryActionSheet = false" @select="onCategorySelect" />

    <!-- 位置选择 ActionSheet -->
    <u-action-sheet :show="showAreaActionSheet" :actions="areaActions" title="请选择位置信息"
      @close="showAreaActionSheet = false" @select="onAreaSelect" />
  </view>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTicketStore } from '@/store';
import { useUpload } from '@/composables/useUpload';
import * as categoryApi from '@/api/category';
import * as areaApi from '@/api/area';
import * as attachmentApi from '@/api/attachment';
import type { Category, Attachment, PresetArea } from '@/api/types';

const ticketStore = useTicketStore();
const { chooseAndUploadImage } = useUpload();

// 表单数据
const formData = ref({
  location: '',
  presetAreaId: '',
  description: '',
  categoryId: '',
  isAnonymous: false,
  submitterName: '',
  submitterPhone: '',
});

// 表单引用
const uFormRef = ref();

// 已上传的附件列表
const uploadedAttachments = ref<Attachment[]>([]);

// u-upload 组件的文件列表（包含本地临时文件和已上传的文件）
interface FileItem {
  url: string;
  status?: 'uploading' | 'success' | 'failed';
  message?: string;
}
const fileList = ref<FileItem[]>([]);

// 分类列表
const categoryList = ref<Category[]>([]);
const selectedCategoryName = ref('');
const showCategoryActionSheet = ref(false);

// 位置列表
const areaList = ref<PresetArea[]>([]);
const selectedAreaName = ref('');
const showAreaActionSheet = ref(false);

// 提交状态
const submitting = ref(false);

// 分类选项（用于 ActionSheet）
const categoryActions = computed(() => {
  return categoryList.value.map(cat => ({
    name: cat.name,
    id: cat.id,
  }));
});

// 位置选项（用于 ActionSheet）
const areaActions = computed(() => {
  return areaList.value.map(area => ({
    name: area.name,
    id: area.id,
  }));
});

// 表单验证规则
const rules = {
  description: [
    {
      required: true,
      message: '请输入详细描述',
      trigger: ['blur', 'change'],
    },
    {
      min: 5,
      max: 500,
      message: '描述长度在 5 到 500 个字符',
      trigger: ['blur', 'change'],
    },
  ],
  categoryId: [
    {
      required: true,
      message: '请选择问题分类',
      trigger: ['change'],
    },
  ],
  submitterName: [
    {
      required: true,
      message: '请输入姓名',
      trigger: ['blur', 'change'],
    },
  ],
  submitterPhone: [
    {
      required: true,
      message: '请输入手机号',
      trigger: ['blur', 'change'],
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: ['blur', 'change'],
    },
  ],
};

// 极简输入框样式
const inputStyle = {
  background: '#FAFAFA',
  borderRadius: '4rpx',
  height: '88rpx',
  padding: '0 24rpx',
};

const textareaStyle = {
  background: '#FAFAFA',
  borderRadius: '4rpx',
  minHeight: '200rpx',
  padding: '20rpx 24rpx',
};

/**
 * 加载分类列表
 */
async function loadCategories() {
  try {
    const categories = await categoryApi.getCategoryList({ status: 'ACTIVE' });
    categoryList.value = categories;
    console.log('加载的分类列表:', categories);
    console.log('分类选项（categoryActions）:', categoryActions.value);
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

/**
 * 分类选择确认
 * @param item 选中的分类项
 * @param index 选中的索引
 */
function onCategorySelect(item: any, index: number) {
  console.log('分类选择参数:', { item, index });

  // u-action-sheet 的 @select 事件会传递 action 对象
  // item 包含 name 和 id 属性
  if (item && item.id) {
    formData.value.categoryId = item.id;
    selectedCategoryName.value = item.name;
    console.log('已选择分类:', { id: item.id, name: item.name });
  }

  showCategoryActionSheet.value = false;
}

/**
 * 加载位置列表
 */
async function loadAreas() {
  try {
    const areas = await areaApi.getAreaList({ isActive: true });
    areaList.value = areas;
    console.log('加载的位置列表:', areas);
    console.log('位置选项（areaActions）:', areaActions.value);
  } catch (error) {
    console.error('加载位置失败', error);
  }
}

/**
 * 位置选择确认
 * @param item 选中的位置项
 * @param index 选中的索引
 */
function onAreaSelect(item: any, index: number) {
  console.log('位置选择参数:', { item, index });

  if (item && item.id) {
    formData.value.presetAreaId = item.id;
    selectedAreaName.value = item.name;
    console.log('已选择位置:', { id: item.id, name: item.name });
  }

  showAreaActionSheet.value = false;
}

/**
 * u-upload 组件选择图片后的回调
 */
async function onAfterRead(event: any) {
  try {
    // u-upload 组件已经让用户选择了文件，直接上传即可
    // event.file 可能是单个文件对象或文件数组
    const files = Array.isArray(event.file) ? event.file : [event.file];

    // 记录添加前的 fileList 长度（起始索引）
    const startIndex = fileList.value.length;

    // 先将本地临时文件添加到 fileList，显示预览
    files.forEach((f: any) => {
      fileList.value.push({
        url: f.url || f.path, // 本地临时路径
        status: 'uploading',
        message: '上传中',
      });
    });

    uni.showLoading({ title: '上传中...' });

    // 批量上传已选择的文件（使用 OSS 直传）
    const uploadPromises = files.map(async (f: any, index: number) => {
      const currentIndex = startIndex + index; // 正确的索引计算
      const filePath = f.url || f.path;

      try {
        // 1. 获取OSS上传凭证
        console.log(`[OSS] 开始获取上传凭证，文件: ${filePath}`);
        const credentials = await attachmentApi.getUploadCredentials('attachments');

        // 2. 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const ext = filePath.substring(filePath.lastIndexOf('.'));
        const objectName = `attachments/image/${timestamp}-${randomStr}${ext}`;

        // 3. 使用凭证直传OSS
        const ossUrl = await attachmentApi.uploadToOss(credentials, filePath, objectName);
        console.log(`[OSS] 上传成功，索引 ${currentIndex}，URL:`, ossUrl);

        // 4. 创建附件记录（调用后端 API）
        const attachment = await attachmentApi.createAttachment({
          url: ossUrl,
          fileName: `uploaded_file${ext}`,
          fileSize: 0, // OSS 直传方式无法获取文件大小
          mimeType: 'image/jpeg',
          type: 'IMAGE',
        });

        console.log(`[OSS] 后端附件记录创建成功，索引 ${currentIndex}，ID:`, attachment.id);

        // 更新 fileList 中对应项的状态和 URL
        fileList.value[currentIndex] = {
          url: attachment.url, // 服务器返回的 URL
          status: 'success',
          message: '上传成功',
        };

        return attachment;
      } catch (error) {
        console.error(`文件上传失败，索引 ${currentIndex}:`, error);
        fileList.value[currentIndex] = {
          url: filePath,
          status: 'failed',
          message: '上传失败',
        };
        throw error;
      }
    });

    const attachments = await Promise.all(uploadPromises);
    uploadedAttachments.value.push(...attachments);

    console.log('fileList:', fileList.value);
    console.log('uploadedAttachments:', uploadedAttachments.value);
  } catch (error) {
    console.error('批量上传失败', error);
    uni.showToast({
      title: '上传失败',
      icon: 'error',
    });
  } finally {
    uni.hideLoading();
  }
}

/**
 * u-upload 组件删除图片的回调
 */
function onDelete(event: any) {
  const { index } = event;
  // 同时从 fileList 和 uploadedAttachments 中删除
  fileList.value.splice(index, 1);
  uploadedAttachments.value.splice(index, 1);
}

/**
 * 预览图片
 */
function previewImage(index: number) {
  const urls = uploadedAttachments.value.map(att => att.url);
  uni.previewImage({
    urls,
    current: index,
  });
}

/**
 * 删除图片
 */
function removeImage(index: number) {
  uploadedAttachments.value.splice(index, 1);
}

/**
 * 提交表单
 */
async function handleSubmit() {
  // 使用 u-form 的 validate 方法进行验证
  const valid = await uFormRef.value.validate();
  if (!valid) {
    return;
  }

  submitting.value = true;

  try {
    const attachmentUrls = uploadedAttachments.value.map(att => att.url);
    await ticketStore.createTicket({
      ...formData.value,
      attachmentUrls,
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

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

onMounted(() => {
  loadCategories();
  loadAreas();
  // 处理小程序码 scene 参数
  handleSceneParameter();
});

/**
 * 处理小程序码 scene 参数
 * scene 格式: a{16位哈希}
 */
async function handleSceneParameter() {
  const options = uni.getLaunchOptionsSync();
  console.log('[Scene] 完整启动参数:', JSON.stringify(options, null, 2));

  // scene 参数在 query 中，不在 scene 字段中
  // options.scene 是启动场景码（数字），如 1047 表示扫描小程序码
  const sceneValue = options.query?.scene;

  if (sceneValue) {
    const scene = decodeURIComponent(sceneValue);
    console.log('[Scene] 原始 scene (query.scene):', sceneValue);
    console.log('[Scene] 解码后 scene:', scene);
    console.log('[Scene] scene 长度:', scene.length);
    console.log('[Scene] scene 类型:', typeof scene);

    // 使用新的 API 通过 scene 查询区域
    try {
      uni.showLoading({ title: '加载中...' });
      console.log('[Scene] 准备调用 API，scene =', scene);
      const area = await areaApi.getAreaByScene(scene);
      console.log('[Scene] API 返回结果:', area);

      if (area) {
        formData.value.presetAreaId = area.id;
        selectedAreaName.value = area.name;

        uni.showToast({
          title: `已选择区域: ${area.name}`,
          icon: 'success',
          duration: 2000,
        });

        console.log('[Scene] 区域自动填充成功:', area);
      } else {
        console.warn('[Scene] 未找到 scene 对应的区域:', scene);
        uni.showToast({
          title: '未找到对应区域',
          icon: 'none',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[Scene] 查询区域失败:', error);
      uni.showToast({
        title: '查询区域失败',
        icon: 'none',
        duration: 2000,
      });
    } finally {
      uni.hideLoading();
    }
  } else {
    console.log('[Scene] 无 scene 参数，正常进入页面');
  }
}

/**
 * 自动填充区域
 * @param areaCode 区域代码（不是ID）
 * @deprecated 使用 handleSceneParameter 代替
 */
async function autoFillArea(areaCode: string) {
  console.log('[AutoFill] 开始自动填充区域, areaCode:', areaCode);

  // 从已加载的列表中查找并填充（使用code匹配）
  const area = areaList.value.find(a => a.code === areaCode);

  if (area) {
    formData.value.presetAreaId = area.id;
    selectedAreaName.value = area.name;

    uni.showToast({
      title: `已选择区域: ${area.name}`,
      icon: 'success',
      duration: 2000,
    });

    console.log('[AutoFill] 区域自动填充成功:', area);
  } else {
    console.log('[AutoFill] 区域列表中未找到，尝试重新加载');

    // 如果列表中没有，重新加载
    try {
      await loadAreas();
      const reloadedArea = areaList.value.find(a => a.code === areaCode);

      if (reloadedArea) {
        formData.value.presetAreaId = reloadedArea.id;
        selectedAreaName.value = reloadedArea.name;

        uni.showToast({
          title: `已选择区域: ${reloadedArea.name}`,
          icon: 'success',
          duration: 2000,
        });

        console.log('[AutoFill] 重新加载后区域自动填充成功:', reloadedArea);
      } else {
        console.warn('[AutoFill] 未找到区域代码:', areaCode);

        uni.showToast({
          title: '未找到对应区域',
          icon: 'none',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('[AutoFill] 重新加载区域失败:', error);
    }
  }
}
</script>

<style scoped>
/* 表单容器 */
.form-container {
  padding: 48rpx;
  background: var(--color-white);
  padding-bottom: 100rpx;
}

/* 输入框样式 */
.inputStyle {
  background: #FAFAFA;
  border-radius: 4rpx;
  height: 88rpx;
  padding: 0 24rpx;
}

.textareaStyle {
  background: #FAFAFA;
  border-radius: 4rpx;
  min-height: 200rpx;
  padding: 20rpx 24rpx;
}

/* 提交区域 */
.submit-section {
  margin-top: 64rpx;
}

/* 提交者信息区域 */
.submitter-section {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 1rpx solid #F0F0F0;
}

.submitter-section .block {
  margin-bottom: 24rpx;
}
</style>
