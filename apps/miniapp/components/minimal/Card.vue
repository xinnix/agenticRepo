<template>
  <view
    :class="[
      'minimal-card',
      `minimal-card--${variant}`,
      clickable && 'minimal-card--clickable'
    ]"
    @tap="handleTap"
  >
    <slot />
  </view>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'elevated' | 'outlined'
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  clickable: false
})

const emit = defineEmits<{
  tap: []
}>()

function handleTap() {
  if (props.clickable) {
    emit('tap')
  }
}
</script>

<style scoped>
.minimal-card {
  padding: 48rpx 0;
  border-bottom: 1rpx solid var(--border);
}

.minimal-card--default {
  background: transparent;
}

.minimal-card--elevated {
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  padding: 32rpx;
  box-shadow: var(--shadow-sm);
}

.minimal-card--outlined {
  background: transparent;
  border: 1rpx solid var(--border);
  border-radius: var(--radius-sm);
  padding: 32rpx;
}

.minimal-card--clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.minimal-card--clickable:active {
  background: var(--bg-subtle);
}
</style>
