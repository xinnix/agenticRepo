/**
 * 智能导航Hook
 */
import { useTabBarStore } from '@/store/modules/tabbar'
import { useUserStore } from '@/store/modules/user'
import { getDefaultTabId } from '@/config/tabbar.config'
import { navigateTo } from '@/utils/navigation'
import type { UserRole } from '@/types/tabbar'

export function useSmartNavigation() {
  const tabBarStore = useTabBarStore()
  const userStore = useUserStore()

  /**
   * 智能跳转到首页
   * 根据用户角色跳转到对应的首页
   */
  function navigateToHome(options?: { forceRefresh?: boolean }) {
    console.log('[SmartNavigation] 跳转到首页')

    tabBarStore.initByUser()

    const config = tabBarStore.currentConfig
    if (config.length === 0) {
      console.warn('[SmartNavigation] 没有可用的Tab配置')
      return
    }

    // 获取默认Tab
    const defaultTabId = getDefaultTabId(tabBarStore.role)
    const defaultTab = config.find(tab => tab.id === defaultTabId) || config[0]

    console.log('[SmartNavigation] 默认Tab:', defaultTab.id, defaultTab.text)

    // 跳转到默认Tab
    performSwitch(defaultTab.pagePath, options)
  }

  /**
   * 处理登录成功后的跳转
   * @param customPath 可选的自定义跳转路径
   */
  function handleLoginSuccess(customPath?: string) {
    console.log('[SmartNavigation] 处理登录成功跳转')

    // 初始化TabBar
    tabBarStore.initByUser()

    // 如果有自定义路径，直接跳转
    if (customPath) {
      console.log('[SmartNavigation] 使用自定义路径:', customPath)
      uni.switchTab({
        url: customPath,
        fail: (err) => {
          console.error('[SmartNavigation] 自定义路径跳转失败:', err)
          // 降级到默认逻辑
          navigateToHome()
        }
      })
      return
    }

    // 根据角色选择目标路径
    const targetPath = getRoleBasedPath()
    console.log('[SmartNavigation] 角色基础路径:', targetPath)

    // 执行跳转
    performSwitch(targetPath, {
      onFail: () => {
        // 跳转失败时的降级处理
        console.warn('[SmartNavigation] 登录后跳转失败，使用降级方案')
        fallbackToDefault()
      }
    })
  }

  /**
   * 根据角色获取基础路径
   * 小程序只支持两种角色：user 和 handler
   */
  function getRoleBasedPath(): string {
    const role = tabBarStore.role

    if (!role) {
      return '/pages/user/my-tickets/index'
    }

    if (role === 'handler') {
      return '/pages/handler/dashboard/index'
    }

    // user 或其他角色
    return '/pages/user/my-tickets/index'
  }

  /**
   * 降级到默认路径
   */
  function fallbackToDefault() {
    console.log('[SmartNavigation] 使用降级方案')

    // 尝试跳转到用户页面的我的工单
    uni.switchTab({
      url: '/pages/user/my-tickets/index',
      fail: () => {
        // 如果连这个也失败，就跳转到登录页
        console.error('[SmartNavigation] 所有跳转都失败，跳转到登录页')
        uni.reLaunch({
          url: '/pages/auth/login/index'
        })
      }
    })
  }

  /**
   * 切换Tab并跳转
   * @param tabId Tab ID
   * @param options 选项
   */
  function switchTab(tabId: string, options?: { force?: boolean }) {
    const tab = tabBarStore.currentConfig.find(t => t.id === tabId)
    if (!tab) {
      console.error('[SmartNavigation] Tab不存在:', tabId)
      return
    }

    console.log('[SmartNavigation] 切换Tab:', tabId, tab.text)

    // 更新活跃Tab
    tabBarStore.setActiveTab(tabId)

    // 执行跳转
    performSwitch(tab.pagePath, {
      ...options,
      onFail: () => {
        console.error('[SmartNavigation] Tab切换失败:', tabId)
        uni.showToast({
          title: '页面切换失败',
          icon: 'none'
        })
      }
    })
  }

  /**
   * 执行页面跳转
   * 在自定义TabBar环境中，使用navigateTo函数
   */
  function performSwitch(
    pagePath: string,
    options?: {
      forceRefresh?: boolean
      animation?: any
      onSuccess?: () => void
      onFail?: () => void
    }
  ) {
    const {
      forceRefresh = false,
      animation = { duration: 300, timingFunction: 'ease-in-out' },
      onSuccess,
      onFail
    } = options || {}

    console.log('[SmartNavigation] 执行自定义TabBar跳转:', pagePath)

    // 使用统一的navigateTo函数
    navigateTo(pagePath, {
      animation,
      onSuccess: () => {
        console.log('[SmartNavigation] 跳转成功:', pagePath)
        onSuccess?.()

        // 强制刷新逻辑
        if (forceRefresh) {
          setTimeout(() => {
            uni.emit('pageRefresh', { pagePath })
          }, 100)
        }
      },
      onFail: () => {
        console.error('[SmartNavigation] 跳转失败:', pagePath)
        onFail?.()
      }
    })
  }

  /**
   * 获取当前用户可用的Tab配置
   */
  function getAvailableTabs() {
    tabBarStore.initByUser()
    return tabBarStore.currentConfig
  }

  /**
   * 检查是否应该显示TabBar
   */
  function shouldShowTabBar(): boolean {
    return tabBarStore.currentConfig.length > 0
  }

  /**
   * 获取当前角色
   */
  function getCurrentRole(): UserRole | null {
    return tabBarStore.role
  }

  /**
   * 获取当前活跃Tab
   */
  function getActiveTab() {
    return tabBarStore.activeTab
  }

  /**
   * 预加载Tab页面（优化性能）
   */
  function preloadTabs() {
    const tabs = tabBarStore.currentConfig
    console.log('[SmartNavigation] 预加载Tabs:', tabs.map(t => t.id))

    // 可以在这里添加预加载逻辑
    // 比如提前加载页面资源等
    tabs.forEach(tab => {
      // 预加载逻辑（根据uni-app能力）
      console.log('[SmartNavigation] 预加载页面:', tab.pagePath)
    })
  }

  return {
    // 核心导航方法
    navigateToHome,
    handleLoginSuccess,
    switchTab,
    performSwitch,

    // 查询方法
    getAvailableTabs,
    shouldShowTabBar,
    getCurrentRole,
    getActiveTab,

    // 工具方法
    preloadTabs
  }
}
