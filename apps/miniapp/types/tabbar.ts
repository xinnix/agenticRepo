/**
 * TabBar相关类型定义
 */

export interface TabItem {
  id: string
  text: string
  pagePath: string
  iconPath: string
  selectedIconPath: string
  roles: UserRole[]
  badge?: number | string
  dot?: boolean
}

export type UserRole = 'user' | 'handler'

export interface TabBarConfig {
  [role: string]: TabItem[]
}

export interface TabBarState {
  activeTab: string
  role: UserRole | null
  config: TabItem[]
}

export interface TabBarOptions {
  showBadge?: boolean
  activeColor?: string
  inactiveColor?: string
  animation?: boolean
  safeArea?: boolean
}

export interface BadgeConfig {
  tabId: string
  value: number | string | null
  dot?: boolean
}
