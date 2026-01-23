<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page">
    <!-- 北欧风格用户信息卡片 -->
    <view class="nordic-gradient-primary p-nordic-6 mb-nordic-6">
      <view class="flex items-center gap-nordic-4">
        <image class="w-25 h-25 rounded-full border-4" style="border-color: rgba(255, 255, 255, 0.3)" :src="userStore.avatar" />
        <view class="flex flex-col">
          <text class="text-nordic-h3 font-medium text-nordic-bg-card mb-nordic-2">{{ userStore.displayName }}</text>
          <text class="text-nordic-base" style="color: rgba(255, 255, 255, 0.8)">{{ roleName }}</text>
        </view>
      </view>
    </view>

    <!-- 北欧风格功能列表 -->
    <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm overflow-hidden mx-nordic-6 mb-nordic-6">
      <view class="p-nordic-4 border-b border-nordic-border nordic-button-animate" @click="goToMyTickets">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-nordic-3">
            <text class="text-2xl">📋</text>
            <text class="text-nordic-base text-nordic-text-primary">我的工单</text>
          </view>
          <text class="text-nordic-text-tertiary">→</text>
        </view>
      </view>

      <view v-if="userStore.isHandler" class="p-nordic-4 border-b border-nordic-border nordic-button-animate" @click="goToDashboard">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-nordic-3">
            <text class="text-2xl">📊</text>
            <text class="text-nordic-base text-nordic-text-primary">工作台</text>
          </view>
          <text class="text-nordic-text-tertiary">→</text>
        </view>
      </view>

      <view class="p-nordic-4 border-b border-nordic-border nordic-button-animate" @click="showAbout">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-nordic-3">
            <text class="text-2xl">ℹ️</text>
            <text class="text-nordic-base text-nordic-text-primary">关于</text>
          </view>
          <text class="text-nordic-text-tertiary">→</text>
        </view>
      </view>

      <view class="p-nordic-4 nordic-button-animate" @click="handleLogout">
        <view class="flex items-center justify-between">
          <view class="flex items-center gap-nordic-3">
            <text class="text-2xl">🚪</text>
            <text class="text-nordic-base text-nordic-accent-rose">退出登录</text>
          </view>
          <text class="text-nordic-text-tertiary">→</text>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="text-center">
      <text class="text-nordic-sm text-nordic-text-tertiary">反馈系统 v1.0.0</text>
    </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store';
import { useTabBarStore } from '@/store/modules/tabbar';
import { useTabBarUpdate } from '@/composables/useTabBarUpdate';
import PageLayout from '@/components/PageLayout.vue';
import { navigateTo } from '@/utils/navigation';

const userStore = useUserStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();

// 角色名称
const roleName = computed(() => {
  if (userStore.isHandler) return '处理人员';
  return '普通用户';
});

/**
 * 跳转我的工单
 */
function goToMyTickets() {
  navigateTo('/pages/user/my-tickets/index');
}

/**
 * 跳转工作台
 */
function goToDashboard() {
  uni.navigateTo({
    url: '/pages/handler/dashboard/index',
  });
}

/**
 * 显示关于
 */
function showAbout() {
  uni.showModal({
    title: '关于',
    content: '后勤反馈系统小程序\n版本：v1.0.0\n\n提供便捷的报修服务，高效处理各类问题',
    showCancel: false,
  });
}

/**
 * 退出登录
 */
function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout();
      }
    },
  });
}

/**
 * 页面显示时更新TabBar选中态
 */
onShow(() => {
  // 使用更安全的方式更新TabBar选中状态
  updateTabBarSelected('/pages/common/profile/index')
})
</script>
