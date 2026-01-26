<template>
  <cover-view
    v-if="showTabBar"
    class="dynamic-tabbar-container"
    :style="containerStyle"
  >
    <cover-view class="tabbar-content">
      <cover-view
        v-for="(tab, index) in tabConfig"
        :key="tab.id"
        class="tab-item"
        :class="{ 'active': activeTab === tab.id }"
        @tap="handleTabTap(tab)"
      >
        <!-- 徽章容器 -->
        <cover-view class="badge-container">
          <!-- 红点徽章 -->
          <cover-view v-if="tab.dot" class="badge-dot"></cover-view>

          <!-- 数字徽章 -->
          <cover-view
            v-else-if="tab.badge && tab.badge !== 0 && showBadge"
            class="badge-number"
            :class="{ 'badge-single-digit': String(tab.badge).length === 1 }"
          >
            {{ formatBadge(tab.badge) }}
          </cover-view>
        </cover-view>

        <!-- Tab图标（使用emoji替代图标文件） -->
        <cover-view class="tab-icon-emoji">{{ getTabIcon(tab.id, activeTab === tab.id) }}</cover-view>

        <!-- Tab文字 -->
        <cover-view
          class="tab-text"
          :class="{ 'active': activeTab === tab.id }"
        >
          {{ tab.text }}
        </cover-view>
      </cover-view>
    </cover-view>
  </cover-view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTabBarStore } from '@/store/modules/tabbar'
import { useTabBarUpdate } from '@/composables/useTabBarUpdate'
import type { TabItem } from '@/types/tabbar'

interface Props {
  showBadge?: boolean
  activeColor?: string
  inactiveColor?: string
  animation?: boolean
  safeArea?: boolean
  backgroundColor?: string
  borderColor?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  showBadge: true,
  activeColor: '#000000',
  inactiveColor: '#A3A3A3',
  animation: true,
  safeArea: true,
  backgroundColor: '#FFFFFF',
  borderColor: '#E5E5E5',
  height: '100rpx'
})

const tabBarStore = useTabBarStore()
const { handleTabTap: handleTabBarTap } = useTabBarUpdate()

// 计算属性
const tabConfig = computed(() => tabBarStore.currentConfig)
const activeTab = computed(() => tabBarStore.activeTab)
const showTabBar = computed(() => tabConfig.value.length > 0)

const containerStyle = computed(() => {
  const style: Record<string, string> = {
    backgroundColor: props.backgroundColor,
    borderTop: `1px solid ${props.borderColor}`,
    height: props.height
  }

  // 安全区域处理
  if (props.safeArea) {
    try {
      const systemInfo = uni.getSystemInfoSync()
      if (systemInfo.safeArea) {
        style.paddingBottom = `${systemInfo.safeArea.bottom - systemInfo.safeArea.bottom + 34}rpx`
      }
    } catch (err) {
      console.log('[DynamicTabBar] 无法获取系统信息:', err)
    }
  }

  return style
})

// 方法
function handleTabTap(tab: TabItem) {
  console.log('[DynamicTabBar] 点击Tab:', tab.id, tab.text)
  handleTabBarTap(tab)
}

/**
 * 格式化徽章显示
 */
function formatBadge(badge: number | string): string {
  if (typeof badge === 'number') {
    if (badge > 99) return '99+'
    return String(badge)
  }
  return String(badge)
}

/**
 * 获取Tab图标
 */
function getTabIcon(tabId: string, isActive: boolean): string {
  const icons: Record<string, { active: string; inactive: string }> = {
    'my-tickets': { active: '📋', inactive: '📋' },
    'submit': { active: '➕', inactive: '➕' },
    'profile': { active: '👤', inactive: '👤' },
    'dashboard': { active: '🏠', inactive: '🏠' },
    'task-pool': { active: '📝', inactive: '📝' },
    'my-tasks': { active: '✅', inactive: '✅' },
    'admin-dashboard': { active: '⚙️', inactive: '⚙️' },
    'user-management': { active: '👥', inactive: '👥' }
  }

  const icon = icons[tabId]
  return icon ? (isActive ? icon.active : icon.inactive) : '🔘'
}
</script>

<style scoped>
.dynamic-tabbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  box-shadow: 0 -1rpx 0 #E5E5E5;
  pointer-events: auto;
}

.tabbar-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding-top: 10rpx;
  pointer-events: none;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 10rpx 0;
  transition: all 0.2s ease;
  pointer-events: auto;
}

.tab-item:active {
  opacity: 0.7;
}

.badge-container {
  position: relative;
  margin-bottom: 6rpx;
  pointer-events: none;
}

.badge-dot {
  position: absolute;
  top: -4rpx;
  right: -8rpx;
  width: 16rpx;
  height: 16rpx;
  background-color: #000000;
  border-radius: 0;
  border: 2rpx solid #FFFFFF;
  z-index: 1;
}

.badge-number {
  position: absolute;
  top: -8rpx;
  right: -12rpx;
  min-width: 32rpx;
  height: 32rpx;
  background-color: #000000;
  color: #FFFFFF;
  border-radius: 0;
  border: 2rpx solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  z-index: 1;
  padding: 0 8rpx;
}

.badge-single-digit {
  min-width: 28rpx;
  height: 28rpx;
  font-size: 18rpx;
}

.tab-icon-emoji {
  font-size: 48rpx;
  line-height: 48rpx;
  margin-bottom: 4rpx;
  transition: all 0.2s ease;
  text-align: center;
  width: 48rpx;
  height: 48rpx;
}

.tab-text {
  font-size: 20rpx;
  line-height: 1;
  color: #A3A3A3;
  font-weight: 400;
  transition: all 0.2s ease;
  letter-spacing: 0.5rpx;
}

.tab-text.active {
  color: #000000;
  font-weight: 600;
}

/* 活跃状态指示器 - 极简风格 */
.tab-item.active::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 2rpx;
  background: #000000;
}

.tab-item.active .tab-icon-emoji {
  transform: translateY(-2rpx);
}
</style>
