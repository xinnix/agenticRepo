/**
 * 微信登录相关组合式函数
 */
import { ref } from "vue";
import { useUserStore } from "@/store";
import * as authApi from "@/api/auth";

/**
 * 微信登录 Hook
 */
export function useWxLogin() {
  const userStore = useUserStore();
  const loading = ref(false);

  /**
   * 微信授权登录
   * @param userInfo 用户信息（可选）
   */
  async function wxLogin(userInfo?: { nickName: string; avatarUrl: string }) {
    if (loading.value) return;

    loading.value = true;

    // 清除旧的认证信息
    console.log('[Login] Clearing old auth data...');
    userStore.clear();

    try {
      // 1. 获取微信 code
      const loginRes: any = await wx.login({
        provider: "weixin",
      });

      console.log("uni.login result:", loginRes);

      if (!loginRes || !loginRes.code) {
        throw new Error("获取微信 code 失败");
      }

      const code = loginRes.code;

      // 2. 调用后端登录接口（不需要手机号）
      const result = await authApi.wxLogin({
        code,
        phoneCode: "", // 不再需要手机号
        userInfo,
      });

      console.log('[Login] API Result:', result);
      console.log('[Login] accessToken:', result.accessToken?.substring(0, 20) + '...');
      console.log('[Login] refreshToken:', result.refreshToken?.substring(0, 20) + '...');

      // 3. 存储认证信息
      userStore.setToken(result.accessToken, result.refreshToken);

      // 验证存储
      const storedToken = uni.getStorageSync('accessToken');
      console.log('[Login] Stored token:', storedToken?.substring(0, 20) + '...');

      userStore.setUserInfo(result.user);

      uni.showToast({
        title: "登录成功",
        icon: "success",
      });

      return result;
    } catch (error: any) {
      console.error("微信登录失败", error);
      uni.showToast({
        title: error.message || "登录失败",
        icon: "error",
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 退出登录
   */
  async function logout() {
    try {
      await userStore.logout();
      uni.showToast({
        title: "已退出登录",
        icon: "success",
      });
    } catch (error) {
      console.error("退出登录失败", error);
    }
  }

  return {
    loading,
    wxLogin,
    logout,
  };
}
