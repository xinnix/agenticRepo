<template>
  <view class="minimal-progress-bar">
    <view
      :class="['minimal-progress-bar__fill', animate && 'minimal-progress-bar__fill--animate']"
      :style="{ width: `${progress}%` }"
    ></view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  progress: number
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  progress: 0,
  animate: true
})
</script>

<style scoped>
.minimal-progress-bar {
  width: 100%;
  height: 2rpx;
  background: var(--bg-subtle);
}

.minimal-progress-bar__fill {
  height: 100%;
  background: var(--color-black);
  transition: width 0.3s ease;
}

.minimal-progress-bar__fill--animate {
  transition: width 0.6s ease-in-out;
}
</style>
