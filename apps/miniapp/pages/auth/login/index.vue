<template>
  <view class="min-h-screen bg-nordic-bg-page flex flex-col items-center justify-center px-6">
    <!-- Logo 区域 -->
    <view class="flex flex-col items-center mb-8">
      <view class="w-16 h-16 rounded-2xl bg-primary-bg flex items-center justify-center mb-4 shadow-nordic-sm">
        <text class="text-3xl">📦</text>
      </view>
      <text class="text-nordic-h3 font-bold text-nordic-text-primary mb-1">后勤反馈系统</text>
      <text class="text-nordic-sm text-nordic-text-secondary">企业员工专属平台</text>
    </view>

    <!-- 登录卡片 -->
    <view class="w-full max-w-sm bg-nordic-bg-card rounded-2xl shadow-nordic-sm p-4">
      <!-- 微信授权登录按钮 -->
      <button
        class="w-full h-14 bg-primary text-white rounded-xl font-semibold flex items-center justify-center shadow-nordic-sm"
        open-type="getUserInfo"
        @getuserinfo="onGetUserInfo"
        :loading="loading"
      >
        <text class="mr-3 text-xl">💬</text>
        <text class="text-nordic-base">微信一键登录</text>
      </button>

      <!-- 用户信息显示 -->
      <view v-if="userInfo" class="flex flex-col items-center pt-3 border-t border-nordic-border mt-3">
        <image
          v-if="userInfo.avatarUrl"
          :src="userInfo.avatarUrl"
          class="w-12 h-12 rounded-full mb-2"
        />
        <text class="text-nordic-base text-nordic-text-primary mb-1">{{ userInfo.nickName }}</text>
        <text class="text-nordic-xs text-nordic-text-tertiary">正在登录...</text>
      </view>
    </view>

    <!-- 协议 -->
    <view class="mt-6 px-2">
      <view class="flex items-start gap-3">
        <view class="w-5 h-5 rounded border-2 border-nordic-border mt-0.5 flex-shrink-0"></view>
        <text class="text-nordic-xs text-nordic-text-secondary leading-relaxed">
          我已阅读并同意
          <text class="text-primary font-medium">《用户协议》</text>
          与
          <text class="text-primary font-medium">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 其他登录方式 -->
    <view class="mt-6">
      <button class="text-nordic-xs text-nordic-text-tertiary font-medium">
        手机号验证码登录
      </button>
    </view>

    <!-- 版本信息 -->
    <view class="mt-8 mb-4">
      <text class="text-nordic-xs text-nordic-text-tertiary tracking-wide">
        后勤反馈系统 v2.4.0
      </text>
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
