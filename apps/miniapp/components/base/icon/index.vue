<template>
  <view :class="iconClasses" :style="iconStyle">
    <image v-if="isSvg" :src="iconSrc" :mode="mode" class="w-full h-full" />
    <text v-else :class="iconClasses">{{ iconName }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: number | string
  color?: string
  type?: 'svg' | 'emoji'
  mode?: 'aspectFit' | 'aspectFill' | 'widthFix' | 'heightFix'
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: '#8E8E93',
  type: 'svg',
  mode: 'aspectFit'
})

const isSvg = computed(() => props.type === 'svg')

const iconName = computed(() => {
  // Emoji 模式直接显示
  return props.name
})

const iconSrc = computed(() => {
  // SVG 模式从 static/icons 目录加载
  return `/static/icons/${props.name}.svg`
})

const iconClasses = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}rpx` : props.size
  return ['flex-shrink-0', 'inline-flex', 'items-center', 'justify-center']
})

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}rpx` : props.size
  return {
    width: size,
    height: size,
    color: props.color,
  }
})
</script>
