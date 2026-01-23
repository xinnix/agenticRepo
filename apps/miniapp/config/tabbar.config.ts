/**
 * 角色驱动的TabBar配置系统
 * 小程序只支持两种角色：普通用户和处理员
 */
import type { TabBarConfig, TabItem, UserRole } from '@/types/tabbar'

export const TAB_BAR_CONFIGS: TabBarConfig = {
  // 普通用户配置
  user: [
    {
      id: 'submit',
      text: '提交反馈',
      pagePath: '/pages/user/submit/index',
      iconPath: 'static/tab_submit.png',
      selectedIconPath: 'static/tab_submit_active.png',
      roles: ['user']
    },
    {
      id: 'my-tickets',
      text: '我的反馈',
      pagePath: '/pages/user/my-tickets/index',
      iconPath: 'static/tab_ticket.png',
      selectedIconPath: 'static/tab_ticket_active.png',
      roles: ['user'],
      badge: 0
    },
    {
      id: 'profile',
      text: '我的',
      pagePath: '/pages/common/profile/index',
      iconPath: 'static/tab_profile.png',
      selectedIconPath: 'static/tab_profile_active.png',
      roles: ['user', 'handler']
    }
  ],

  // 处理员配置（包括 department_admin）
  handler: [
    {
      id: 'dashboard',
      text: '工作台',
      pagePath: '/pages/handler/dashboard/index',
      iconPath: 'static/tab_dashboard.png',
      selectedIconPath: 'static/tab_dashboard_active.png',
      roles: ['handler']
    },
    {
      id: 'task-pool',
      text: '待接单池',
      pagePath: '/pages/handler/task-pool/index',
      iconPath: 'static/tab_pool.png',
      selectedIconPath: 'static/tab_pool_active.png',
      roles: ['handler'],
      badge: 0
    },
    {
      id: 'my-tasks',
      text: '我的任务',
      pagePath: '/pages/handler/my-tasks/index',
      iconPath: 'static/tab_tasks.png',
      selectedIconPath: 'static/tab_tasks_active.png',
      roles: ['handler'],
      badge: 0
    },
    {
      id: 'profile',
      text: '我的',
      pagePath: '/pages/common/profile/index',
      iconPath: 'static/tab_profile.png',
      selectedIconPath: 'static/tab_profile_active.png',
      roles: ['user', 'handler']
    }
  ]
}

/**
 * 根据用户角色获取对应的Tab配置
 * @param role 用户角色 (user 或 handler)
 * @returns Tab配置数组
 */
export function getTabConfigByRole(role: UserRole | null): TabItem[] {
  if (!role) return []

  return TAB_BAR_CONFIGS[role] || []
}

/**
 * 获取默认的Tab ID
 * @param role 用户角色
 * @returns 默认Tab ID
 */
export function getDefaultTabId(role: UserRole | null): string {
  if (!role) return 'submit'

  if (role === 'handler') {
    return 'dashboard'
  }

  return 'submit'
}

/**
 * 检查Tab是否对某个角色可见
 * @param tab Tab项
 * @param role 用户角色
 * @returns 是否可见
 */
export function isTabVisibleForRole(tab: TabItem, role: UserRole | null): boolean {
  if (!role || !tab.roles) return false
  return tab.roles.includes(role)
}
