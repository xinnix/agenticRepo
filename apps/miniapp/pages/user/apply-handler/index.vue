<template>
  <view class="apply-page">
    <!-- 顶部导航 -->


    <!-- 主要内容 -->
    <view class="content-container">
      <!-- 申请卡片 -->
      <view class="apply-card">
        <view class="apply-icon">
          <u-icon name="star" size="40" color="#FFFFFF"></u-icon>
        </view>
        <view class="apply-info">
          <text class="apply-title">加入我们</text>
          <text class="apply-desc">成为办事员，为用户提供更好的服务</text>
        </view>
      </view>

      <!-- 权益说明 -->
      <view class="benefits-card">
        <text class="benefits-title">成为办事员你可以：</text>
        <view class="benefit-item">
          <u-icon name="checkmark-circle" size="20" color="#34C759"></u-icon>
          <text>接单处理用户的反馈请求</text>
        </view>
        <view class="benefit-item">
          <u-icon name="checkmark-circle" size="20" color="#34C759"></u-icon>
          <text>查看附近的任务详情</text>
        </view>
        <view class="benefit-item">
          <u-icon name="checkmark-circle" size="20" color="#34C759"></u-icon>
          <text>积累服务经验和好评</text>
        </view>
        <view class="benefit-item">
          <u-icon name="checkmark-circle" size="20" color="#34C759"></u-icon>
          <text>获得相应的服务报酬</text>
        </view>
      </view>

      <!-- 申请表单 -->
      <view class="form-card">
        <text class="form-title">申请信息</text>

        <!-- 姓名 -->
        <view class="form-item">
          <text class="form-label">真实姓名</text>
          <input v-model="form.name" class="form-input" placeholder="请输入您的真实姓名"
            placeholder-style="color: #AEAEB2; font-size: 28rpx;" />
        </view>

        <!-- 联系电话 -->
        <view class="form-item">
          <text class="form-label">联系电话</text>
          <input v-model="form.phone" type="number" class="form-input" placeholder="请输入您的联系电话"
            placeholder-style="color: #AEAEB2; font-size: 28rpx;" maxlength="11" />
        </view>

        <!-- 提交按钮 -->
        <view class="submit-btn" :class="{ disabled: !isFormValid || submitting }" @tap="submitApplication">
          <text v-if="submitting">提交中...</text>
          <text v-else>提交申请</text>
        </view>
      </view>

      <!-- 温馨提示 -->
      <view class="tips-card">
        <view class="tips-header">
          <u-icon name="info-circle" size="18" color="#007AFF"></u-icon>
          <text class="tips-title">温馨提示</text>
        </view>
        <text class="tips-content">申请提交后，我们将在3个工作日内进行审核。审核通过后，您将收到通知并可以开始处理工单。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { API_BASE_URL } from '@/utils/constants';

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

// 返回上一页
function goBack() {
  uni.navigateBack();
}

// 提交申请
async function submitApplication() {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }

  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
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
</script>

<style scoped>
.apply-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 48rpx;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: #FFFFFF;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
}

.header-actions {
  display: flex;
  gap: 8rpx;
  min-width: 80rpx;
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
}

/* 内容区域 */
.content-container {
  padding: 32rpx;
}

/* 申请卡片 */
.apply-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #1C1C1E;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

.apply-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
}

.apply-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.apply-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.apply-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

/* 权益卡片 */
.benefits-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.benefits-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #3A3A3C;
}

.benefit-item:not(:last-child) {
  border-bottom: 2rpx solid #F2F2F7;
}

/* 表单卡片 */
.form-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.form-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-item:last-of-type {
  margin-bottom: 48rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #3A3A3C;
  margin-bottom: 16rpx;
}

.form-input {
  width: 100%;
  background: #F2F2F7;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  font-size: 28rpx;
  color: #1C1C1E;
  box-sizing: border-box;
  min-height: 88rpx;
  line-height: 1.4;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  max-width: calc(100% - 4rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #007AFF;
  color: #FFFFFF;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.3);
  transition: all 0.3s;
  box-sizing: border-box;
}

.submit-btn.disabled {
  background: #C7C7CC;
  box-shadow: none;
  opacity: 0.6;
}

/* 温馨提示 */
.tips-card {
  background: rgba(0, 122, 255, 0.08);
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid rgba(0, 122, 255, 0.15);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.tips-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #007AFF;
}

.tips-content {
  font-size: 24rpx;
  color: #3A3A3C;
  line-height: 1.6;
}
</style>
