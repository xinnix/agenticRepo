<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page">
    <!-- 北欧风格用户信息卡片 -->
    <view class="nordic-gradient-primary p-nordic-6 mb-nordic-6">
      <view class="flex items-center gap-nordic-4">
        <u-avatar
          :src="userStore.avatar"
          size="100rpx"
        />
        <view class="flex flex-col">
          <u-text class="text-nordic-h3 font-medium text-nordic-bg-card mb-nordic-2" :text="userStore.displayName"></u-text>
          <u-text class="text-nordic-base" style="color: rgba(255, 255, 255, 0.8)" :text="roleName"></u-text>
        </view>
      </view>
    </view>

    <!-- 北欧风格功能列表 -->
    <u-cell-group class="mx-nordic-6 mb-nordic-6">
      <u-cell
        title="我的工单"
        :is-link="true"
        @click="goToMyTickets"
      >
        <template #icon>
          <u-icon name="list" size="24" class="mr-nordic-3"></u-icon>
        </template>
      </u-cell>

      <u-cell
        v-if="userStore.isHandler"
        title="工作台"
        :is-link="true"
        @click="goToDashboard"
      >
        <template #icon>
          <u-icon name="chart" size="24" class="mr-nordic-3"></u-icon>
        </template>
      </u-cell>

      <u-cell
        title="关于"
        :is-link="true"
        @click="showAbout"
      >
        <template #icon>
          <u-icon name="info-circle" size="24" class="mr-nordic-3"></u-icon>
        </template>
      </u-cell>

      <u-cell
        title="退出登录"
        :is-link="true"
        @click="handleLogout"
      >
        <template #icon>
          <u-icon name="close-circle" size="24" class="mr-nordic-3" color="#ff4d4f"></u-icon>
        </template>
      </u-cell>
    </u-cell-group>

    <!-- 版本信息 -->
    <view class="text-center">
      <u-text class="text-nordic-sm text-nordic-text-tertiary" text="反馈系统 v1.0.0"></u-text>
    </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useUserStore } from '@/store';
import PageLayout from '@/components/PageLayout.vue';
import { navigateTo } from '@/utils/navigation';

const userStore = useUserStore();

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
</script>
