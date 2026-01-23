<template>
  <view :class="badgeClasses">
    <view v-if="dot" :class="dotClasses" />
    <text :class="textClasses">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type StatusType = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled' | 'custom'

interface Props {
  type?: StatusType
  text?: string
  dot?: boolean
  size?: 'sm' | 'md' | 'lg'
  customColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'pending',
  text: '',
  dot: false,
  size: 'md',
  customColor: ''
})

// 状态对应的颜色配置
const statusConfig: Record<StatusType, { bg: string; text: string }> = {
  pending: { bg: 'bg-ios-orange/10', text: 'text-ios-orange' },
  processing: { bg: 'bg-primary/10', text: 'text-primary' },
  completed: { bg: 'bg-ios-green/10', text: 'text-ios-green' },
  rejected: { bg: 'bg-ios-red/10', text: 'text-ios-red' },
  cancelled: { bg: 'bg-ios-gray/10', text: 'text-ios-gray' },
  custom: { bg: 'bg-gray-100', text: 'text-gray-600' },
}

const config = computed(() => {
  if (props.type === 'custom' && props.customColor) {
    return {
      bg: '',
      text: '',
      customColor: props.customColor,
    }
  }
  return statusConfig[props.type]
})

const badgeClasses = computed(() => {
  const classes = ['inline-flex', 'items-center', 'font-medium', 'rounded-ios-pill']

  // 背景色
  if (config.value.customColor) {
    // 使用自定义颜色
  } else {
    classes.push(config.value.bg)
  }

  // 尺寸
  const sizeClasses = {
    sm: ['px-ios-xs', 'py-1', 'text-ios-caption1'],
    md: ['px-ios-sm', 'py-1', 'text-ios-caption1'],
    lg: ['px-ios-element', 'py-ios-sm', 'text-ios-subhead'],
  }
  classes.push(...sizeClasses[props.size])

  return classes.join(' ')
})

const dotClasses = computed(() => {
  const classes = ['rounded-full', 'mr-1']
  const size = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }
  classes.push(size[props.size])

  if (config.value.customColor) {
    classes.push('bg-current')
  } else {
    classes.push(config.value.text.replace('text-', 'bg-'))
  }

  return classes.join(' ')
})

const textClasses = computed(() => {
  const classes = []
  if (config.value.customColor) {
    // 使用自定义颜色
  } else {
    classes.push(config.value.text)
  }
  return classes.join(' ')
})

const badgeStyle = computed(() => {
  if (config.value.customColor) {
    return {
      backgroundColor: `${config.value.customColor}15`,
      color: config.value.customColor,
    }
  }
  return {}
})
</script>

<template>
  <view :class="badgeClasses" :style="badgeStyle">
    <view v-if="dot" :class="dotClasses" />
    <text :class="textClasses">{{ text }}</text>
  </view>
</template>
