/**
 * TabBar更新Hook（官方推荐方式）
 * 使用getTabBar更新选中态
 */

import { getCurrentInstance } from 'vue'
import { useTabBarStore } from '@/store/modules/tabbar'
import { navigateTo } from '@/utils/navigation'

export function useTabBarUpdate() {
  const tabBarStore = useTabBarStore()

  /**
   * 获取TabBar实例并更新选中态
   * @param pagePath 当前页面路径
   */
  function updateTabBarSelected(pagePath: string) {
    try {
      // 获取Tab配置中的索引
      const config = tabBarStore.currentConfig
      const activeIndex = config.findIndex(tab => tab.pagePath === pagePath)

      if (activeIndex === -1) {
        console.log('[useTabBarUpdate] 页面不在TabBar配置中:', pagePath)
        return
      }

      console.log('[useTabBarUpdate] 更新TabBar选中态:', {
        pagePath,
        activeIndex,
        tabId: config[activeIndex]?.id
      })

      // 设置选中态
      tabBarStore.setActiveTab(config[activeIndex].id)

      // 尝试通过getTabBar更新选中态（官方方式）
      // @ts-ignore - uni-app全局方法
      if (typeof uni.getTabBar === 'function') {
        try {
          const tabBar = uni.getCurrentTabBar()
          if (tabBar && typeof tabBar.setData === 'function') {
            tabBar.setData({
              selected: activeIndex
            })
          }
        } catch (err) {
          console.log('[useTabBarUpdate] 无法获取TabBar实例:', err)
        }
      }
    } catch (error) {
      console.error('[useTabBarUpdate] 更新TabBar选中态失败:', error)
    }
  }

  /**
   * 处理Tab点击（官方推荐方式）
   * @param tab 点击的Tab
   */
  function handleTabTap(tab: any) {
    const currentPagePath = getCurrentPagePath()

    // 如果点击的是当前Tab，不做任何操作
    if (tab.pagePath === currentPagePath) {
      return
    }

    console.log('[useTabBarUpdate] 处理Tab点击:', tab)

    // 更新选中态
    updateTabBarSelected(tab.pagePath)

    // 页面跳转
    navigateTo(tab.pagePath)
  }

  /**
   * 获取当前页面路径
   */
  function getCurrentPagePath(): string {
    try {
      // 使用更安全的方式获取当前页面路径
      const instance = getCurrentInstance()
      if (instance?.page) {
        const route = instance.page.$page?.route || ''
        return route ? `/${route}` : ''
      }
    } catch (error) {
      console.error('[useTabBarUpdate] 获取当前页面路径失败:', error)
    }
    return ''
  }

  return {
    updateTabBarSelected,
    handleTabTap,
    getCurrentPagePath
  }
}
