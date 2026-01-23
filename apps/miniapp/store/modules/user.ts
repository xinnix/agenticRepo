/**
 * 用户状态管理
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/api/types';
import * as authApi from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>('');
  const refreshToken = ref<string>('');
  const userInfo = ref<User | null>(null);
  const roles = ref<string[]>([]);

  // Getters
  const isAuthenticated = computed(() => !!token.value);
  // 小程序只支持两种角色：handler 和 user
  // 后端角色映射：handler → handler；user → user
  const isHandler = computed(() => roles.value.includes('handler'));
  const isUser = computed(() => roles.value.includes('user'));
  const displayName = computed(() => {
    if (userInfo.value?.wxNickname) return userInfo.value.wxNickname;
    if (userInfo.value?.firstName || userInfo.value?.lastName) {
      return `${userInfo.value.firstName || ''} ${userInfo.value.lastName || ''}`.trim();
    }
    return userInfo.value?.username || '游客';
  });
  const avatar = computed(() => {
    return userInfo.value?.wxAvatarUrl || userInfo.value?.avatar || '/static/logo.png';
  });

  // Actions
  function setToken(accessToken: string, newRefreshToken: string) {
    console.log('[UserStore] setToken called');
    console.log('[UserStore] accessToken length:', accessToken?.length);
    console.log('[UserStore] refreshToken length:', newRefreshToken?.length);

    token.value = accessToken;
    refreshToken.value = newRefreshToken;

    uni.setStorageSync('accessToken', accessToken);
    uni.setStorageSync('refreshToken', newRefreshToken);

    // 验证存储
    const stored = uni.getStorageSync('accessToken');
    console.log('[UserStore] Verified stored token length:', stored?.length);
  }

  function setUserInfo(user: User) {
    userInfo.value = user;
    roles.value = user.roles?.map((r: any) => r.role?.slug) || [];

    // 存储到本地
    uni.setStorageSync('userInfo', JSON.stringify(user));
  }

  function loadFromStorage() {
    const accessToken = uni.getStorageSync('accessToken');
    const newRefreshToken = uni.getStorageSync('refreshToken');
    const savedUserInfo = uni.getStorageSync('userInfo');

    console.log('[UserStore] loadFromStorage called');
    console.log('[UserStore] accessToken from storage:', !!accessToken);
    console.log('[UserStore] accessToken length:', accessToken?.length);

    if (accessToken && accessToken !== '') {
      token.value = accessToken;
      console.log('[UserStore] Token loaded, length:', token.value.length);
    }
    if (newRefreshToken && newRefreshToken !== '') {
      refreshToken.value = newRefreshToken;
    }
    if (savedUserInfo) {
      try {
        const user = JSON.parse(savedUserInfo);
        userInfo.value = user;
        roles.value = user.roles?.map((r: any) => r.role?.slug) || [];
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }
  }

  async function fetchUserInfo() {
    try {
      const user = await authApi.getCurrentUser();
      setUserInfo(user);
      return user;
    } catch (error) {
      console.error('获取用户信息失败', error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await authApi.logout(refreshToken.value);
      }
    } catch (error) {
      console.error('登出失败', error);
    } finally {
      // 清除本地状态
      token.value = '';
      refreshToken.value = '';
      userInfo.value = null;
      roles.value = [];
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('refreshToken');
      uni.removeStorageSync('userInfo');

      // 跳转登录页
      uni.reLaunch({
        url: '/pages/auth/login/index',
      });
    }
  }

  // 清除状态（不跳转，用于重新登录）
  function clear() {
    console.log('[UserStore] Clearing auth state...');
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    roles.value = [];
    uni.removeStorageSync('accessToken');
    uni.removeStorageSync('refreshToken');
    uni.removeStorageSync('userInfo');
  }

  return {
    // State
    token,
    refreshToken,
    userInfo,
    roles,

    // Getters
    isAuthenticated,
    isHandler,
    isUser,
    displayName,
    avatar,

    // Actions
    setToken,
    setUserInfo,
    loadFromStorage,
    fetchUserInfo,
    logout,
    clear,
  };
});
