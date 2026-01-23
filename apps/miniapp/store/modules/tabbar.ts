/**
 * TabBar状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import { getTabConfigByRole, getDefaultTabId } from '@/config/tabbar.config'
import type { UserRole, TabItem, BadgeConfig } from '@/types/tabbar'

export const useTabBarStore = defineStore('tabbar', () => {
  const userStore = useUserStore()

  // State
  const activeTab = ref<string>('')
  const role = ref<UserRole | null>(null)
  const badges = ref<Map<string, BadgeConfig>>(new Map())

  // Getters
  const currentConfig = computed(() => {
    const config = getTabConfigByRole(role.value)
    // 为配置添加徽章信息
    return config.map(tab => {
      const badgeConfig = badges.value.get(tab.id)
      return {
        ...tab,
        badge: badgeConfig?.value ?? tab.badge,
        dot: badgeConfig?.dot ?? tab.dot
      }
    })
  })

  const isHandler = computed(() => {
    return role.value === 'handler'
  })

  const isUser = computed(() => {
    return role.value === 'user'
  })

  // Actions

  /**
   * 初始化TabBar（根据当前用户角色）
   */
  function initByUser() {
    // 根据用户角色确定当前角色
    const currentRole = getCurrentUserRole()
    role.value = currentRole

    // 设置默认Tab
    const defaultTabId = getDefaultTabId(currentRole)
    activeTab.value = defaultTabId

    console.log('[TabBarStore] 初始化完成', {
      userRoles: userStore.roles,
      currentRole,
      activeTab: defaultTabId
    })
  }

  /**
   * 获取当前用户的有效角色
   * 将后端角色映射到小程序角色
   */
  function getCurrentUserRole(): UserRole | null {
    const roles = userStore.roles

    // 小程序只支持两种角色：handler 和 user
    // 后端角色映射规则：
    // - handler → handler (处理员)
    // - user → user (普通用户)
    // - department_admin, super_admin → 无对应关系（不应使用小程序）

    if (roles.includes('handler')) {
      return 'handler'
    }

    if (roles.includes('user')) {
      return 'user'
    }

    // 其他角色（department_admin, super_admin）不支持小程序
    console.warn('[TabBarStore] 当前角色不支持小程序:', roles)
    return null
  }

  /**
   * 设置当前激活的Tab
   * @param tabId Tab ID
   */
  function setActiveTab(tabId: string) {
    const config = currentConfig.value
    const tabExists = config.some(tab => tab.id === tabId)

    if (tabExists) {
      activeTab.value = tabId
      console.log('[TabBarStore] 切换Tab:', tabId)
    } else {
      console.warn('[TabBarStore] Tab不存在:', tabId)
    }
  }

  /**
   * 切换用户角色（用于测试或特殊情况）
   * @param newRole 新角色
   */
  function switchToRole(newRole: UserRole) {
    role.value = newRole
    initByUser()
    console.log('[TabBarStore] 切换角色到:', newRole)
  }

  /**
   * 更新Tab徽章
   * @param tabId Tab ID
   * @param badge 徽章值（null表示清除徽章）
   */
  function updateBadge(tabId: string, badge: number | string | null) {
    const config = currentConfig.value
    const tabExists = config.some(tab => tab.id === tabId)

    if (tabExists) {
      const badgeConfig: BadgeConfig = {
        tabId,
        value: badge,
        dot: false
      }

      if (badge === null || badge === 0) {
        badges.value.delete(tabId)
      } else {
        badges.value.set(tabId, badgeConfig)
      }

      console.log('[TabBarStore] 更新徽章:', { tabId, badge })
    }
  }

  /**
   * 显示红点徽章
   * @param tabId Tab ID
   */
  function showDot(tabId: string) {
    const config = currentConfig.value
    const tabExists = config.some(tab => tab.id === tabId)

    if (tabExists) {
      const badgeConfig: BadgeConfig = {
        tabId,
        value: '',
        dot: true
      }
      badges.value.set(tabId, badgeConfig)
      console.log('[TabBarStore] 显示红点:', tabId)
    }
  }

  /**
   * 隐藏红点徽章
   * @param tabId Tab ID
   */
  function hideDot(tabId: string) {
    badges.value.delete(tabId)
    console.log('[TabBarStore] 隐藏红点:', tabId)
  }

  /**
   * 清除所有徽章
   */
  function clearAllBadges() {
    badges.value.clear()
    console.log('[TabBarStore] 清除所有徽章')
  }

  /**
   * 清除状态（用于登出）
   */
  function clear() {
    activeTab.value = ''
    role.value = null
    badges.value.clear()
    console.log('[TabBarStore] 清除状态')
  }

  return {
    // State
    activeTab,
    role,
    badges,

    // Getters
    currentConfig,
    isHandler,
    isUser,

    // Actions
    initByUser,
    getCurrentUserRole,
    setActiveTab,
    switchToRole,
    updateBadge,
    showDot,
    hideDot,
    clearAllBadges,
    clear
  }
})
