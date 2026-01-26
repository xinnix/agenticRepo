<template>
  <view class="min-h-screen bg-page flex items-center justify-center">
    <!-- 极简风格加载状态 -->
    <view v-if="loading" class="flex flex-col items-center animate-fade-in-up">
      <!-- 极简Logo/标题 -->
      <text class="hero-text">反馈</text>
      <!-- 线性加载条 -->
      <view class="loading-bar">
        <view class="loading-progress"></view>
      </view>
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
.hero-text {
  font-size: 64rpx;
  font-weight: 200;
  letter-spacing: 16rpx;
  color: #000000;
}

.loading-bar {
  width: 200rpx;
  height: 2rpx;
  background: #E5E5E5;
  margin-top: 48rpx;
}

.loading-progress {
  height: 100%;
  background: #000000;
  animation: linear-loading 1.5s ease-in-out infinite;
}

@keyframes linear-loading {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}
</style>
