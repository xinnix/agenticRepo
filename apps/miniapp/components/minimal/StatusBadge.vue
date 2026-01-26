<template>
  <view :class="['minimal-status-badge', `minimal-status-badge--${variant}`]">
    <view v-if="showDot" class="minimal-status-badge__dot"></view>
    <text class="minimal-status-badge__text">
      <slot />
    </text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'active' | 'success' | 'subtle'
  showDot?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  showDot: false
})
</script>

<style scoped>
.minimal-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 12rpx;
  font-size: var(--text-tiny);
  letter-spacing: 1rpx;
  text-transform: uppercase;
  font-weight: 500;
}

.minimal-status-badge--default {
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.minimal-status-badge--active {
  background: var(--bg-card);
  color: var(--color-black);
  border: 1rpx solid var(--border);
  font-weight: 600;
}

.minimal-status-badge--success {
  background: var(--color-black);
  color: var(--color-white);
}

.minimal-status-badge--subtle {
  background: transparent;
  color: var(--text-tertiary);
}

.minimal-status-badge__dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: currentColor;
}

.minimal-status-badge__text {
  line-height: 1;
}
</style>
