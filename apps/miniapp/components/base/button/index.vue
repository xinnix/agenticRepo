<template>
  <view :class="buttonClasses" :style="buttonStyle" @tap="handleTap">
    <slot />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'text'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  block?: boolean
  round?: boolean
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'md',
  disabled: false,
  block: false,
  round: false,
  customClass: ''
})

const emit = defineEmits<{
  tap: []
}>()

const handleTap = () => {
  if (!props.disabled) {
    emit('tap')
  }
}

const buttonClasses = computed(() => {
  const classes = ['flex', 'items-center', 'justify-center', 'font-medium', 'transition-transform', 'active:scale-95', 'nordic-button-animate']

  // 类型 - 北欧风格
  const typeClasses = {
    primary: ['bg-primary', 'text-nordic-bg-card'],
    secondary: ['bg-nordic-bg-input', 'text-nordic-text-primary'],
    success: ['bg-nordic-accent-sage', 'text-white'],
    warning: ['bg-nordic-accent-sand', 'text-white'],
    error: ['bg-nordic-accent-rose', 'text-white'],
    text: ['bg-transparent', 'text-primary'],
  }
  classes.push(...typeClasses[props.type])

  // 尺寸 - 北欧风格
  const sizeClasses = {
    sm: ['px-nordic-3', 'py-nordic-2', 'text-nordic-sm', 'rounded-nordic-sm'],
    md: ['px-nordic-4', 'py-nordic-3', 'text-nordic-base', 'rounded-nordic-md'],
    lg: ['px-nordic-6', 'py-nordic-4', 'text-nordic-lg', 'rounded-nordic-lg'],
  }
  classes.push(...sizeClasses[props.size])

  // 禁用状态
  if (props.disabled) {
    classes.push('opacity-50')
  }

  // 全宽
  if (props.block) {
    classes.push('w-full')
  }

  // 圆角胶囊
  if (props.round) {
    classes.push('rounded-full')
  }

  // 自定义类
  if (props.customClass) {
    classes.push(props.customClass)
  }

  return classes.join(' ')
})

const buttonStyle = computed(() => {
  return props.disabled ? 'pointer-events: none' : ''
})
</script>
