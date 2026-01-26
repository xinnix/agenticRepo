<template>
  <view class="min-h-screen bg-page flex flex-col items-center justify-center px-xl">
    <!-- 极简Logo区域 -->
    <view class="flex flex-col items-center mb-2xl">
      <text class="logo-title">反馈系统</text>
      <text class="logo-subtitle">企业员工专属平台</text>
    </view>

    <!-- 极简登录卡片 -->
    <view class="w-full login-card animate-fade-in-up">
      <!-- 微信授权登录按钮 -->
      <button
        class="minimal-btn-primary w-full"
        open-type="getUserInfo"
        @getuserinfo="onGetUserInfo"
        :loading="loading"
      >
        微信一键登录
      </button>

      <!-- 用户信息显示 -->
      <view v-if="userInfo" class="user-info-section">
        <image
          v-if="userInfo.avatarUrl"
          :src="userInfo.avatarUrl"
          class="user-avatar"
        />
        <text class="user-name">{{ userInfo.nickName }}</text>
        <text class="user-status">正在登录...</text>
      </view>
    </view>

    <!-- 协议 -->
    <view class="mt-xl px-md">
      <view class="flex items-start gap-md">
        <view class="checkbox"></view>
        <text class="agreement-text">
          我已阅读并同意
          <text class="agreement-link">《用户协议》</text>
          与
          <text class="agreement-link">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 其他登录方式 -->
    <view class="mt-lg">
      <button class="other-login-btn">手机号验证码登录</button>
    </view>

    <!-- 版本信息 -->
    <view class="mt-xl mb-lg">
      <text class="version-text">后勤反馈系统 v2.4.0</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWxLogin } from '@/composables/useWxLogin';
import { useUserStore } from '@/store';
import { useSmartNavigation } from '@/composables/useSmartNavigation';
import { useTabBarStore } from '@/store/modules/tabbar';

const { loading, wxLogin } = useWxLogin();
const userStore = useUserStore();
const smartNavigation = useSmartNavigation();
const tabBarStore = useTabBarStore();

const userInfo = ref<{ nickName: string; avatarUrl: string } | null>(null);

/**
 * 获取用户信息回调
 */
async function onGetUserInfo(e: any) {
  console.log('=== 登录流程开始 ===');
  console.log('getUserInfo event:', e);

  if (e.detail.userInfo) {
    userInfo.value = e.detail.userInfo;
    console.log('用户信息:', userInfo.value);

    try {
      // 直接登录
      console.log('开始调用 wxLogin...');
      const result = await wxLogin(userInfo.value);
      console.log('登录成功，返回结果:', result);

      // 登录成功后，使用智能导航跳转到对应首页
      setTimeout(() => {
        console.log('用户角色:', userStore.roles);
        console.log('处理人员身份:', userStore.isHandler);

        // 使用智能导航系统，根据用户角色自动跳转到正确的首页
        smartNavigation.handleLoginSuccess();
      }, 500);
    } catch (error) {
      console.error('登录失败:', error);
      uni.showModal({
        title: '登录失败',
        content: JSON.stringify(error),
        showCancel: false,
      });
      userInfo.value = null;
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
.logo-title {
  font-size: var(--text-hero);
  font-weight: 200;
  letter-spacing: 8rpx;
  color: var(--color-black);
  display: block;
  margin-bottom: 16rpx;
}

.logo-subtitle {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
  letter-spacing: 2rpx);
}

.login-card {
  padding: 48rpx;
  background: var(--bg-card);
  border: 1rpx solid var(--border);
}

.user-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32rpx;
  border-top: 1rpx solid var(--border);
  margin-top: 32rpx;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: var(--radius-sm);
  margin-bottom: 16rpx;
}

.user-name {
  font-size: var(--text-body);
  color: var(--text-primary);
  margin-bottom: 8rpx;
  display: block;
}

.user-status {
  font-size: var(--text-caption);
  color: var(--text-tertiary);
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 1rpx solid var(--border);
  flex-shrink: 0;
  margin-top: 4rpx;
}

.agreement-text {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  line-height: 1.6;
}

.agreement-link {
  color: var(--text-primary);
  font-weight: 500;
}

.other-login-btn {
  background: transparent;
  color: var(--text-tertiary);
  font-size: var(--text-caption);
  font-weight: 400;
  padding: 0;
}

.version-text {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  letter-spacing: 2rpx;
}
</style>
