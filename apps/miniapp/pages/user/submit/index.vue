<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page p-nordic-6 bg-texture-dots">
    <view class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-6 card-organic animate-fade-in-up">
      <!-- 分类选择 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">问题分类</text>
          <view class="w-1 h-1 rounded-full bg-nordic-error ml-2"></view>
        </view>
        <u-input
          :value="selectedCategoryName"
          placeholder="请选择问题分类"
          :border="false"
          :custom-style="{
            background: '#EBE8E1',
            borderRadius: '16rpx',
            height: '80rpx',
          }"
          :disabled="true"
          @click="showCategoryPicker = true"
        />
        <u-picker
          :show="showCategoryPicker"
          :columns="[categoryList]"
          keyName="name"
          @confirm="onCategoryConfirm"
          @cancel="showCategoryPicker = false"
        />
      </view>

      <!-- 标题 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">问题标题</text>
          <view class="w-1 h-1 rounded-full bg-nordic-error ml-2"></view>
        </view>
        <u-input
          v-model="formData.title"
          placeholder="请简要描述问题"
          :border="false"
          :custom-style="{
            background: '#EBE8E1',
            borderRadius: '16rpx',
            height: '80rpx',
          }"
          :maxlength="50"
        />
      </view>

      <!-- 描述 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">详细描述</text>
          <view class="w-1 h-1 rounded-full bg-nordic-error ml-2"></view>
        </view>
        <u-textarea
          v-model="formData.description"
          placeholder="请详细描述问题情况，以便更好地处理"
          :border="false"
          :custom-style="{
            background: '#EBE8E1',
            borderRadius: '16rpx',
            minHeight: '200rpx',
          }"
          :maxlength="500"
        />
      </view>

      <!-- 位置 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">位置信息</text>
        </view>
        <u-input
          v-model="formData.location"
          placeholder="请输入具体位置（可选）"
          :border="false"
          :custom-style="{
            background: '#EBE8E1',
            borderRadius: '16rpx',
            height: '80rpx',
          }"
        />
      </view>

      <!-- 图片上传 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">图片上传（最多9张）</text>
        </view>
        <view class="flex flex-wrap gap-nordic-3">
          <view v-for="(attachment, index) in uploadedAttachments" :key="attachment.id" class="relative" style="width: 160rpx; height: 160rpx; z-index: 10;">
            <image
              :src="attachment.url"
              mode="aspectFill"
              class="w-full h-full rounded-nordic-lg"
              @tap="previewImage(index)"
            />
            <view class="absolute -top-2 -right-2 w-10 h-10 bg-nordic-accent-rose rounded-full flex items-center justify-center shadow-nordic-sm" style="z-index: 20;" @tap="removeImage(index)">
              <text class="text-nordic-bg-card text-nordic-base">×</text>
            </view>
          </view>
          <view v-if="uploadedAttachments.length < 9" class="border-2 border-dashed border-nordic-border rounded-nordic-lg flex flex-col items-center justify-center nordic-button-animate" style="width: 160rpx; height: 160rpx;" @tap="chooseImage">
            <text class="text-5xl text-nordic-text-tertiary">+</text>
            <text class="text-nordic-xs text-nordic-text-tertiary mt-2">添加图片</text>
          </view>
        </view>
      </view>

      <!-- 优先级 -->
      <view class="mb-nordic-6">
        <view class="flex items-center mb-nordic-3">
          <text class="text-nordic-base font-semibold text-nordic-text-primary">优先级</text>
        </view>
        <u-radio-group v-model="formData.priority" @change="onPriorityChange">
          <u-radio
            :custom-style="{ marginRight: '40rpx' }"
            name="NORMAL"
            :checked="formData.priority === 'NORMAL'"
          >
            普通
          </u-radio>
          <u-radio
            name="URGENT"
            :checked="formData.priority === 'URGENT'"
          >
            紧急
          </u-radio>
        </u-radio-group>
      </view>

      <!-- 提交按钮 -->
      <u-button
        type="primary"
        size="large"
        :loading="submitting"
        :disabled="!isFormValid"
        @click="handleSubmit"
        :custom-style="{
          opacity: isFormValid ? 1 : 0.5,
        }"
      >
        提交反馈
      </u-button>
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

    // 选择并立即上传图片
    const attachments = await chooseAndUploadImage(remainingCount);
    console.log('[SubmitPage] 上传成功后的 attachments:', JSON.stringify(attachments, null, 2));
    console.log('[SubmitPage] 当前 uploadedAttachments:', JSON.stringify(uploadedAttachments.value, null, 2));
    uploadedAttachments.value.push(...attachments);
    console.log('[SubmitPage] push 后的 uploadedAttachments:', JSON.stringify(uploadedAttachments.value, null, 2));

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
    // 1. 创建工单（图片已在选择时上传）
    const attachmentUrls = uploadedAttachments.value.map(att => att.url);
    await ticketStore.createTicket({
      ...formData.value,
      attachmentUrls, // 发送预上传的图片URL
    });

    uni.showToast({
      title: '提交成功',
      icon: 'success',
    });

    // 3. 延迟跳转到工单列表
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

/**
 * 页面显示时更新TabBar选中态
 */
onShow(() => {
  // 使用更安全的方式更新TabBar选中状态
  updateTabBarSelected('/pages/user/submit/index')
})

onMounted(() => {
  loadCategories();
});
</script>
