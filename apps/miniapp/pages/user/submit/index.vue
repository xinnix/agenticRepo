<template>
  <PageLayout>
    <view class="min-h-screen bg-page">
      <!-- 极简头部 -->
      <view class="page-header">
        <text class="page-title">提交反馈</text>
        <text class="page-subtitle">告诉我们您的问题</text>
      </view>

      <!-- 极简表单区域 -->
      <view class="form-container">
        <!-- 分类选择 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">问题分类</text>
            <text class="required-mark">*</text>
          </view>
          <view class="form-input-wrapper" @tap="showCategoryPicker = true">
            <text :class="['form-input-text', { placeholder: !selectedCategoryName }]">
              {{ selectedCategoryName || '请选择' }}
            </text>
            <text class="form-input-arrow">→</text>
          </view>
          <u-picker
            :show="showCategoryPicker"
            :columns="[categoryList]"
            keyName="name"
            @confirm="onCategoryConfirm"
            @cancel="showCategoryPicker = false"
          />
        </view>

        <!-- 标题 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">问题标题</text>
            <text class="required-mark">*</text>
          </view>
          <u-input
            v-model="formData.title"
            placeholder="请简要描述问题"
            :border="false"
            :custom-style="inputStyle"
            :maxlength="50"
          />
        </view>

        <!-- 描述 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">详细描述</text>
            <text class="required-mark">*</text>
          </view>
          <u-textarea
            v-model="formData.description"
            placeholder="请详细描述问题情况，以便更好地处理"
            :border="false"
            :custom-style="textareaStyle"
            :maxlength="500"
          />
        </view>

        <!-- 位置 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">位置信息</text>
            <text class="optional-mark">可选</text>
          </view>
          <u-input
            v-model="formData.location"
            placeholder="请输入具体位置"
            :border="false"
            :custom-style="inputStyle"
          />
        </view>

        <!-- 图片上传 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">图片上传</text>
            <text class="optional-mark">可选</text>
          </view>
          <text class="form-hint">最多上传 9 张</text>
          <view class="image-upload-area">
            <view v-for="(attachment, index) in uploadedAttachments" :key="attachment.id" class="uploaded-image">
              <image
                :src="attachment.url"
                mode="aspectFill"
                class="upload-image"
                @tap="previewImage(index)"
              />
              <view class="image-remove" @tap="removeImage(index)">×</view>
            </view>
            <view v-if="uploadedAttachments.length < 9" class="upload-add" @tap="chooseImage">
              <text class="upload-add-icon">+</text>
              <text class="upload-add-text">添加</text>
            </view>
          </view>
        </view>

        <!-- 优先级 -->
        <view class="form-item">
          <view class="form-label-row">
            <text class="form-label">优先级</text>
          </view>
          <u-radio-group v-model="formData.priority" @change="onPriorityChange">
            <view class="priority-options">
              <view
                :class="['priority-option', { active: formData.priority === 'NORMAL' }]"
                @tap="formData.priority = 'NORMAL'"
              >
                <view class="priority-radio">
                  <view v-if="formData.priority === 'NORMAL'" class="priority-radio-dot"></view>
                </view>
                <text class="priority-text">普通</text>
              </view>
              <view
                :class="['priority-option', { active: formData.priority === 'URGENT' }]"
                @tap="formData.priority = 'URGENT'"
              >
                <view class="priority-radio">
                  <view v-if="formData.priority === 'URGENT'" class="priority-radio-dot"></view>
                </view>
                <text class="priority-text">紧急</text>
              </view>
            </view>
          </u-radio-group>
        </view>

        <!-- 提交按钮 -->
        <view class="submit-section">
          <button
            class="submit-btn"
            :loading="submitting"
            :disabled="!isFormValid"
            @tap="handleSubmit"
          >
            提交反馈
          </button>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTicketStore } from '@/store';
import { useTabBarStore } from '@/store/modules/tabbar';
import { useTabBarUpdate } from '@/composables/useTabBarUpdate';
import PageLayout from '@/components/PageLayout.vue';
import { useUpload } from '@/composables/useUpload';
import * as categoryApi from '@/api/category';
import type { Category, Attachment } from '@/api/types';
import { Priority } from '@/api/types';

const ticketStore = useTicketStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();
const { chooseAndUploadImage, uploading } = useUpload();

// 表单数据
const formData = ref({
  title: '',
  description: '',
  categoryId: '',
  location: '',
  priority: Priority.NORMAL,
});

// 已上传的附件列表
const uploadedAttachments = ref<Attachment[]>([]);

// 分类列表
const categoryList = ref<Category[]>([]);
const selectedCategoryName = ref('');
const showCategoryPicker = ref(false);

// 提交状态
const submitting = ref(false);

// 表单验证
const isFormValid = computed(() => {
  return formData.value.title.trim() &&
         formData.value.description.trim() &&
         formData.value.categoryId;
});

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
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

/**
 * 分类选择确认
 */
function onCategoryConfirm(e: any) {
  const category = e.value[0];
  formData.value.categoryId = category.id;
  selectedCategoryName.value = category.name;
  showCategoryPicker.value = false;
}

/**
 * 优先级选择
 */
function onPriorityChange(e: any) {
  formData.value.priority = e.detail.value;
}

/**
 * 选择并上传图片
 */
async function chooseImage() {
  try {
    const remainingCount = 9 - uploadedAttachments.value.length;
    if (remainingCount <= 0) {
      uni.showToast({
        title: '最多只能上传9张图片',
        icon: 'none',
      });
      return;
    }

    uni.showLoading({ title: '上传中...' });

    const attachments = await chooseAndUploadImage(remainingCount);
    uploadedAttachments.value.push(...attachments);

    uni.hideLoading();
    uni.showToast({
      title: `上传成功，已选择${attachments.length}张图片`,
      icon: 'success',
    });
  } catch (error) {
    console.error('选择图片失败', error);
    uni.hideLoading();
    uni.showToast({
      title: '上传失败',
      icon: 'error',
    });
  }
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
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写必填项',
      icon: 'none',
    });
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

onShow(() => {
  updateTabBarSelected('/pages/user/submit/index')
})

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
/* 页面头部 */
.page-header {
  padding: 64rpx 48rpx 48rpx;
  background: var(--color-white);
  border-bottom: 1rpx solid var(--border);
}

.page-title {
  font-size: 56rpx;
  font-weight: 200;
  letter-spacing: 4rpx;
  color: var(--color-black);
  display: block;
}

.page-subtitle {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin-top: 16rpx;
  display: block;
}

/* 表单容器 */
.form-container {
  padding: 48rpx;
  background: var(--color-white);
}

/* 表单项 */
.form-item {
  margin-bottom: 48rpx;
}

.form-item:last-of-type {
  margin-bottom: 0;
}

.form-label-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.form-label {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  letter-spacing: 2rpx;
  font-weight: 500;
}

.required-mark {
  font-size: var(--text-tiny);
  color: var(--color-black);
  font-weight: 600;
}

.optional-mark {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  font-weight: 400;
}

.form-hint {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  display: block;
  margin-bottom: 16rpx;
}

/* 输入框样式 */
.form-input-wrapper {
  background: var(--bg-input);
  padding: 24rpx;
  border-radius: var(--radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-input-text {
  font-size: var(--text-body);
  color: var(--text-primary);
}

.form-input-text.placeholder {
  color: var(--text-tertiary);
}

.form-input-arrow {
  font-size: var(--text-body);
  color: var(--text-tertiary);
}

/* 图片上传区域 */
.image-upload-area {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.uploaded-image {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.upload-image {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-sm);
}

.image-remove {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: var(--color-black);
  color: var(--color-white);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  line-height: 1;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  border: 1rpx dashed var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-add-icon {
  font-size: 48rpx;
  color: var(--text-tertiary);
  line-height: 1;
}

.upload-add-text {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  margin-top: 8rpx;
}

/* 优先级选项 */
.priority-options {
  display: flex;
  gap: 24rpx;
}

.priority-option {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
}

.priority-option.active {
  background: var(--bg-card);
  border: 1rpx solid var(--color-black);
}

.priority-radio {
  width: 32rpx;
  height: 32rpx;
  border: 1rpx solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.priority-radio-dot {
  width: 16rpx;
  height: 16rpx;
  background: var(--color-black);
  border-radius: 50%;
}

.priority-option.active .priority-radio {
  border-color: var(--color-black);
}

.priority-text {
  font-size: var(--text-body);
  color: var(--text-primary);
}

/* 提交区域 */
.submit-section {
  margin-top: 64rpx;
}

.submit-btn {
  width: 100%;
  padding: 32rpx;
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-body);
  font-weight: 400;
  letter-spacing: 2rpx;
  text-align: center;
  border: none;
  border-radius: 0;
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>
