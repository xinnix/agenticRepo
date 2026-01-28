<template>
  <view class="min-h-screen bg-page flex items-center justify-center">
    <!-- 极简风格加载状态 -->
    <view v-if="loading" class="flex flex-col items-center animate-fade-in-up">
      <!-- 极简Logo/标题 -->
      <u-text class="hero-text" text="反馈"></u-text>
      <!-- 线性加载条 -->
      <u-line-progress :percentage="30" :show-percentage="false" active-color="#000000" inactive-color="#E5E5E5"
        height="2" :striped="false" :animation="true" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/store';
import { useSmartNavigation } from '@/composables/useSmartNavigation';
import { onShow } from '@dcloudio/uni-app';
const userStore = useUserStore();
const smartNavigation = useSmartNavigation();
const loading = ref(true);

/**
 * 执行登录跳转逻辑
 */
async function doLoginNavigation() {
  // 1. 先从本地加载 token
  userStore.loadFromStorage();

  // 2. 检查是否有 token
  if (!userStore.token) {
    // 没有 token，跳转到登录页
    uni.reLaunch({
      url: '/pages/auth/login/index',
    });
    return true; // 已跳转
  }

  // 3. 有 token，从后端获取最新用户信息
  console.log('[首页] 获取最新用户信息...');
  await userStore.fetchUserInfo();

  console.log('[首页] 用户信息获取成功:', {
    username: userStore.userInfo?.username,
    roles: userStore.roles,
    isHandler: userStore.isHandler,
    isUser: userStore.isUser,
  });

  // 4. 根据最新用户信息进行智能导航
  smartNavigation.handleLoginSuccess();
  return true; // 已跳转
}

onMounted(async () => {
  try {
    await doLoginNavigation();
  } catch (error) {
    console.error('[首页] 获取用户信息失败:', error);

    // 获取用户信息失败，可能是 token 过期，跳转到登录页
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
    });

    setTimeout(() => {
      userStore.clear();
      uni.reLaunch({
        url: '/pages/auth/login/index',
      });
    }, 1500);
  } finally {
    loading.value = false;
  }
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
  0% {
    width: 0%;
  }

  50% {
    width: 70%;
  }

  100% {
    width: 100%;
  }
}
</style>
