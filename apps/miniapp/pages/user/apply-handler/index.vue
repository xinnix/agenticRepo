<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page">
      <!-- 页面头部 -->
      <view class="bg-gradient-to-r from-blue-500 to-purple-600 p-nordic-6 text-center">
        <text class="text-6xl block mb-4">🏢</text>
        <text class="text-nordic-2xl font-bold text-white block mb-2">申请成为办事员</text>
        <text class="text-nordic-base text-blue-100">加入我们，为用户提供更好的服务</text>
      </view>

      <!-- 申请表单 -->
      <view class="p-nordic-6">
        <!-- 办事员介绍 -->
        <view class="bg-nordic-bg-card rounded-nordic-lg p-nordic-6 mb-nordic-6">
          <text class="text-nordic-lg font-medium text-nordic-text-primary block mb-4">💡 办事员职责</text>
          <view class="space-y-3">
            <view class="flex items-start">
              <text class="text-primary mr-3 mt-1">•</text>
              <text class="text-nordic-base text-nordic-text-secondary">处理用户提交的反馈和投诉</text>
            </view>
            <view class="flex items-start">
              <text class="text-primary mr-3 mt-1">•</text>
              <text class="text-nordic-base text-nordic-text-secondary">及时响应用户需求，提供解决方案</text>
            </view>
            <view class="flex items-start">
              <text class="text-primary mr-3 mt-1">•</text>
              <text class="text-nordic-base text-nordic-text-secondary">维护良好的用户体验和服务质量</text>
            </view>
          </view>
        </view>

        <!-- 申请表单 -->
        <view class="bg-nordic-bg-card rounded-nordic-lg p-nordic-6">
          <text class="text-nordic-lg font-medium text-nordic-text-primary block mb-6">📝 申请信息</text>

          <!-- 姓名 -->
          <view class="mb-nordic-6">
            <text class="text-nordic-base text-nordic-text-primary block mb-2">姓名 *</text>
            <input
              v-model="form.name"
              class="bg-nordic-bg-input rounded-nordic-lg p-nordic-4 text-nordic-base text-nordic-text-primary"
              placeholder="请输入您的真实姓名"
              placeholder-class="text-nordic-text-tertiary"
            />
          </view>

          <!-- 联系电话 -->
          <view class="mb-nordic-8">
            <text class="text-nordic-base text-nordic-text-primary block mb-2">联系电话 *</text>
            <input
              v-model="form.phone"
              type="number"
              class="bg-nordic-bg-input rounded-nordic-lg p-nordic-4 text-nordic-base text-nordic-text-primary"
              placeholder="请输入您的联系电话"
              placeholder-class="text-nordic-text-tertiary"
            />
          </view>

          <!-- 提交按钮 -->
          <button
            class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-nordic-lg p-nordic-4 text-nordic-base font-medium text-white border-none nordic-button-animate"
            :disabled="!isFormValid || submitting"
            :class="{ 'opacity-50': !isFormValid || submitting }"
            @tap="submitApplication"
          >
            <text v-if="submitting" class="flex items-center justify-center">
              <text class="mr-2">提交中...</text>
            </text>
            <text v-else>提交申请</text>
          </button>
        </view>

        <!-- 温馨提示 -->
        <view class="bg-blue-50 border border-blue-200 rounded-nordic-lg p-nordic-4 mt-nordic-6">
          <view class="flex items-start">
            <text class="text-blue-500 text-xl mr-3">💡</text>
            <view>
              <text class="text-nordic-base font-medium text-blue-700 block mb-1">温馨提示</text>
              <text class="text-nordic-sm text-blue-600">
                申请提交后，我们将在3个工作日内进行审核。审核通过后，您将收到通知并可以开始处理工单。
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTabBarStore } from '@/store/modules/tabbar';
import PageLayout from '@/components/PageLayout.vue';
import { API_BASE_URL } from '@/utils/constants';

const tabBarStore = useTabBarStore();

// 表单数据
const form = ref({
  name: '',
  phone: ''
});

// 提交状态
const submitting = ref(false);

// 表单验证
const isFormValid = computed(() => {
  return form.value.name.trim() !== '' && form.value.phone.trim() !== '';
});

// 提交申请
async function submitApplication() {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }

  // 获取当前用户信息
  const savedUserInfo = uni.getStorageSync('userInfo');
  let userId = '';

  if (savedUserInfo) {
    try {
      const userInfo = JSON.parse(savedUserInfo);
      userId = userInfo.id;
      console.log('[ApplyHandler] 用户ID:', userId);
    } catch (e) {
      console.error('[ApplyHandler] 解析用户信息失败:', e);
    }
  }

  if (!userId) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }

  // 获取 token
  const token = uni.getStorageSync('accessToken') || '';
  console.log('[ApplyHandler] Token exists:', !!token);

  try {
    submitting.value = true;

    // 调用后端 API 提交申请
    await new Promise<any>((resolve, reject) => {
      uni.request({
        url: `${API_BASE_URL}/user/submit-handler-application`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          userId: userId,
          realName: form.value.name,
          phone: form.value.phone
        },
        success: (response) => {
          console.log('[ApplyHandler] API response:', response);
          if (response.statusCode === 200 || response.statusCode === 201) {
            resolve(response.data);
          } else {
            reject(new Error(response.data?.message || `提交失败(${response.statusCode})`));
          }
        },
        fail: (error) => {
          console.error('[ApplyHandler] API error:', error);
          reject(error);
        }
      });
    });

    uni.showToast({
      title: '申请提交成功',
      icon: 'success'
    });

    // 返回上一页
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);

  } catch (error: any) {
    console.error('提交申请失败:', error);
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    submitting.value = false;
  }
}

// 页面显示时设置TabBar
onShow(() => {
  tabBarStore.setActiveTab('my-tickets');
});
</script>

<style scoped>
.space-y-3 > view + view {
  margin-top: 0.75rem;
}
</style>