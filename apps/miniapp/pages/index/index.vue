<template>
  <view class="min-h-screen bg-nordic-bg-page flex items-center justify-center bg-texture-dots">
    <!-- 加载中状态 -->
    <view v-if="loading" class="flex flex-col items-center animate-fade-in-up">
      <!-- 有机风格加载动画 -->
      <view class="loading-container">
        <view class="loading-organic"></view>
        <view class="loading-organic loading-organic-delay"></view>
        <view class="loading-organic loading-organic-delay-2"></view>
      </view>
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useUserStore } from '@/store';
import { useSmartNavigation } from '@/composables/useSmartNavigation';

const { checkAuth } = useAuth();
const userStore = useUserStore();
const smartNavigation = useSmartNavigation();
const loading = ref(true);

onMounted(() => {
  // 延迟一下，让状态加载完成
  setTimeout(() => {
    if (checkAuth()) {
      // 已登录，使用智能导航跳转到首页
      smartNavigation.handleLoginSuccess();
    } else {
      // 未登录，跳转到登录页
      uni.reLaunch({
        url: '/pages/auth/login/index',
      });
    }
    loading.value = false;
  }, 100);
});
</script>

<style scoped>
.loading-container {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-organic {
  position: absolute;
  width: 24rpx;
  height: 24rpx;
  background: linear-gradient(135deg, #C67B5C 0%, #A85D3E 100%);
  border-radius: 50%;
  animation: organic-bounce 1.4s ease-in-out infinite;
}

.loading-organic-delay {
  animation-delay: 0.2s;
}

.loading-organic-delay-2 {
  animation-delay: 0.4s;
}

@keyframes organic-bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-text {
  margin-top: 40rpx;
  font-size: 28rpx;
  color: var(--nordic-text-secondary);
  font-weight: 500;
  letter-spacing: 2rpx;
}
</style>
