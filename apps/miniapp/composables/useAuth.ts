/**
 * 认证相关组合式函数
 */
import { useUserStore } from '@/store';

/**
 * 认证 Hook
 */
export function useAuth() {
  const userStore = useUserStore();

  /**
   * 初始化认证状态
   */
  function initAuth() {
    userStore.loadFromStorage();
  }

  /**
   * 检查是否已登录
   */
  function checkAuth(): boolean {
    initAuth();
    if (!userStore.isAuthenticated) {
      uni.reLaunch({
        url: '/pages/auth/login/index',
      });
      return false;
    }
    return true;
  }

  /**
   * 需要处理人权限
   */
  function requireHandler() {
    if (!checkAuth()) return false;

    if (!userStore.isHandler) {
      uni.showToast({
        title: '无权限访问',
        icon: 'error',
      });
      return false;
    }

    return true;
  }

  return {
    userStore,
    initAuth,
    checkAuth,
    requireHandler,
  };
}
