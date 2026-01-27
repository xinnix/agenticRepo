<template>
  <view class="login-page">
    <!-- 顶部品牌区域 -->
    <view class="brand-section">
      <view class="brand-logo">
        <image class="logo-image" src="/static/logo.png" mode="aspectFit" />
      </view>
      <text class="brand-title">反馈系统</text>
      <text class="brand-subtitle">企业员工专属报修平台</text>
    </view>

    <!-- 微信授权登录按钮 -->
    <button class="wechat-btn" open-type="getUserInfo" @getuserinfo="onGetUserInfo" :disabled="loading">
      <view class="btn-content">
        <!-- <u-icon name="weixin-fill" size="40" color="#FFFFFF"></u-icon> -->
        <text class="btn-text">{{ loading ? '登录中...' : '登录' }}</text>
      </view>
    </button>

    <!-- 协议 -->
    <view class="agreement-section">
      <view class="checkbox-wrapper" @tap="agreed = !agreed">
        <view class="checkbox" :class="{ checked: agreed }">
          <u-icon v-if="agreed" name="checkmark" size="12" color="#FFFFFF"></u-icon>
        </view>
      </view>
      <text class="agreement-text">
        我已阅读并同意《用户协议》与《隐私政策》
      </text>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">后勤反馈系统 v2.4.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWxLogin } from '@/composables/useWxLogin';
import { useUserStore } from '@/store';
import { useSmartNavigation } from '@/composables/useSmartNavigation';

const { loading, wxLogin } = useWxLogin();
const userStore = useUserStore();
const smartNavigation = useSmartNavigation();

const agreed = ref(false);

/**
 * 获取用户信息回调
 */
async function onGetUserInfo(e: any) {
  console.log('=== 登录流程开始 ===');
  console.log('getUserInfo event:', e);

  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none',
    });
    return;
  }

  if (e.detail.userInfo) {
    console.log('用户信息:', e.detail.userInfo);

    try {
      console.log('开始调用 wxLogin...');
      await wxLogin(e.detail.userInfo);
      console.log('登录成功');

      setTimeout(() => {
        console.log('用户角色:', userStore.roles);
        smartNavigation.handleLoginSuccess();
      }, 500);
    } catch (error: any) {
      console.error('登录失败:', error);
      uni.showModal({
        title: '登录失败',
        content: error.message || '登录失败，请重试',
        showCancel: false,
      });
    }
  } else {
    console.log('用户拒绝授权');
    uni.showToast({
      title: '需要授权才能登录',
      icon: 'none',
    });
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #F2F2F7;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 300rpx 64rpx 64rpx;
}

/* 品牌区域 */
.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 96rpx;
}

.brand-logo {
  width: 160rpx;
  height: 160rpx;
  background: #FFFFFF;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.15);
}

.logo-image {
  width: 100rpx;
  height: 100rpx;
}

.brand-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 12rpx;
  letter-spacing: 4rpx;
}

.brand-subtitle {
  font-size: 26rpx;
  color: #8E8E93;
  letter-spacing: 2rpx;
}

/* 微信登录按钮 */
.wechat-btn {
  width: 100%;
  height: 96rpx;
  background: #07C160;
  border-radius: 20rpx;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-btn[disabled] {
  opacity: 0.7;
}

.wechat-btn::after {
  border: none;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
}

/* 协议 */
.agreement-section {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-top: 64rpx;
  max-width: 600rpx;
}

.checkbox-wrapper {
  flex-shrink: 0;
  padding: 8rpx;
  margin: -8rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  border: 2rpx solid #C5C5C7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #007AFF;
  border-color: #007AFF;
}

.agreement-text {
  font-size: 24rpx;
  color: #8E8E93;
  line-height: 1.6;
}

/* 版本信息 */
.version-info {
  margin-top: auto;
  padding-top: 120rpx;
}

.version-text {
  font-size: 22rpx;
  color: #AEAEB2;
  letter-spacing: 2rpx;
}
</style>
