/**
 * 统一的导航工具函数
 * 确保在自定义TabBar环境中使用正确的方法
 */

/**
 * 跳转到指定页面
 * @param pagePath 页面路径
 * @param options 选项
 */
export function navigateTo(
  pagePath: string,
  options?: {
    animation?: any;
    onSuccess?: () => void;
    onFail?: () => void;
  },
) {
  const {
    animation = { duration: 300, timingFunction: "ease-in-out" },
    onSuccess,
    onFail,
  } = options || {};

  console.log("[Navigation] 跳转到页面:", pagePath);

  // 在自定义TabBar环境中，使用reLaunch
  uni.switchTab({
    url: pagePath,
    animation,
    success: () => {
      console.log("[Navigation] 跳转成功:", pagePath);
      onSuccess?.();
    },
    fail: (err) => {
      console.error("[Navigation] 跳转失败:", err);
      onFail?.();

      // 降级处理
      uni.showToast({
        title: "页面跳转失败",
        icon: "none",
      });
    },
  });
}

/**
 * 跳转到Tab页面
 * @param pagePath 页面路径
 * @param options 选项
 */
export function switchTab(
  pagePath: string,
  options?: {
    animation?: any;
    onSuccess?: () => void;
    onFail?: () => void;
  },
) {
  console.warn(
    "[Navigation] switchTab在自定义TabBar环境中不可用，使用reLaunch替代:",
    pagePath,
  );
  return navigateTo(pagePath, options);
}

/**
 * 返回上一页
 */
export function navigateBack(delta: number = 1) {
  uni.navigateBack({ delta });
}

/**
 * 关闭当前页面并返回上一页
 */
export function navigateBackAndRedirect(delta: number = 1) {
  uni.navigateBack({ delta });
}

/**
 * 重新加载当前页面
 */
export function reLaunchCurrentPage() {
  try {
    // 使用更安全的方式获取当前页面
    const instance = getCurrentInstance()
    if (instance?.page) {
      const route = instance.page.$page?.route || ''
      if (route) {
        const fullPath = route.startsWith("/") ? route : `/${route}`
        navigateTo(fullPath)
      }
    }
  } catch (error) {
    console.error('[navigation] 重新加载当前页面失败:', error)
  }
}

/**
 * 跳转到首页
 * @param role 用户角色 (user 或 handler)
 */
export function navigateToHome(
  role: "user" | "handler" = "user",
) {
  const homePaths = {
    user: "/pages/user/my-tickets/index",
    handler: "/pages/handler/dashboard/index",
  };

  navigateTo(homePaths[role]);
}

/**
 * 快速导航方法集合
 */
export const NavigationUtils = {
  navigateTo,
  switchTab,
  navigateBack,
  navigateBackAndRedirect,
  reLaunchCurrentPage,
  navigateToHome,
};

export default NavigationUtils;
