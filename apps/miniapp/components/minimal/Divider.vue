<template>
  <view :class="['minimal-divider', `minimal-divider--${variant}`, thick && 'minimal-divider--thick']"></view>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'solid' | 'dashed'
  thick?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'solid',
  thick: false
})
</script>

<style scoped>
.minimal-divider {
  width: 100%;
}

.minimal-divider--solid {
  background: var(--border);
}

.minimal-divider--dashed {
  background: transparent;
  background-image: linear-gradient(to right, var(--border) 50%, transparent 50%);
  background-size: 8rpx 1rpx;
  background-repeat: repeat-x;
}

.minimal-divider--thick {
  height: 2rpx;
}

.minimal-divider:not(.minimal-divider--thick) {
  height: 1rpx;
}
</style>
