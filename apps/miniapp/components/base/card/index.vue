<template>
  <view :class="cardClasses">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  padding?: boolean
  shadow?: 'card' | 'elevated' | 'float' | 'none'
  radius?: 'nordic-sm' | 'nordic-lg' | 'nordic-xl' | 'none'
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  padding: true,
  shadow: 'card',
  radius: 'nordic-lg',
  customClass: ''
})

const cardClasses = computed(() => {
  const classes = ['bg-nordic-bg-card', 'nordic-card-hover']

  // 圆角 - 北欧风格
  if (props.radius !== 'none') {
    classes.push(`rounded-${props.radius}`)
  }

  // 阴影 - 北欧风格
  if (props.shadow !== 'none') {
    classes.push(`shadow-nordic-${props.shadow}`)
  }

  // 内边距 - 北欧风格
  if (props.padding) {
    classes.push('p-nordic-6')
  }

  // 自定义类
  if (props.customClass) {
    classes.push(props.customClass)
  }

  return classes.join(' ')
})
</script>
