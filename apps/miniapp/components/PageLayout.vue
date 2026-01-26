<template>
  <view class="page-layout">
    <!-- 页面内容区域 -->
    <view
      class="page-content"
      :class="{
        'has-tabbar': showTabBar,
        'safe-area-top': safeArea,
        'safe-area-bottom': safeArea && showTabBar
      }"
    >
      <slot />
    </view>

    <!-- 自定义TabBar（使用cover-view包裹以提升层级） -->
    <cover-view v-if="showTabBar" class="tabbar-container">
      <DynamicTabBar
        :show-badge="showBadge"
        :active-color="activeColor"
        :inactive-color="inactiveColor"
        :animation="animation"
        :safe-area="safeArea"
        :background-color="backgroundColor"
        :border-color="borderColor"
        :height="tabbarHeight"
      />
    </cover-view>
  </view>
</template>

<script setup lang="ts">
import DynamicTabBar from './DynamicTabBar.vue'

interface Props {
  showTabBar?: boolean
  showBadge?: boolean
  activeColor?: string
  inactiveColor?: string
  animation?: boolean
  safeArea?: boolean
  backgroundColor?: string
  borderColor?: string
  tabbarHeight?: string
  customPadding?: boolean
}

withDefaults(defineProps<Props>(), {
  showTabBar: true,
  showBadge: true,
  activeColor: '#000000',
  inactiveColor: '#A3A3A3',
  animation: true,
  safeArea: true,
  backgroundColor: '#FFFFFF',
  borderColor: '#E5E5E5',
  tabbarHeight: '100rpx',
  customPadding: false
})
</script>

<style scoped>
.page-layout {
  min-height: 100%;
  background-color: #FFFFFF;
  position: relative;
}

.page-content {
  min-height: 100%;
  width: 100%;
  transition: padding-bottom 0.3s ease;
}

/* 有TabBar时的底部内边距 */
.page-content.has-tabbar {
  padding-bottom: 120rpx;
}

/* 安全区域顶部 */
.page-content.safe-area-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 安全区域底部 */
.page-content.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 自定义内边距 */
.page-content.custom-padding {
  padding: 20rpx;
}

/* TabBar容器样式 */
.tabbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  pointer-events: none; /* 容器不响应事件，子组件响应 */
}

.tabbar-container .dynamic-tabbar-container {
  pointer-events: auto; /* 子组件响应事件 */
}
</style>
