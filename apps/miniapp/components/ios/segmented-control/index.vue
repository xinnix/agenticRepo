<template>
  <view :class="containerClasses">
    <view
      v-for="(option, index) in options"
      :key="index"
      :class="optionClasses(index)"
      :style="optionStyle(index)"
      @tap="handleSelect(index)"
    >
      <text :class="textClasses(index)">{{ option.label || option }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label?: string
  value?: string | number
}

interface Props {
  options: (string | Option)[]
  modelValue?: number | string
  size?: 'sm' | 'md' | 'lg'
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  modelValue: 0,
  size: 'md',
  rounded: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string]
  change: [value: number | string, index: number]
}>()

const currentIndex = computed(() => {
  if (typeof props.modelValue === 'number') {
    return props.modelValue
  }
  return props.options.findIndex((opt) => {
    if (typeof opt === 'string') {
      return opt === props.modelValue
    }
    return opt.value === props.modelValue
  })
})

const containerClasses = computed(() => {
  const classes = ['flex', 'bg-ios-background', 'p-1']

  // 圆角
  if (props.rounded) {
    classes.push('rounded-ios-xl')
  } else {
    classes.push('rounded-ios')
  }

  // 尺寸
  const sizeClasses = {
    sm: ['h-14', 'text-ios-subhead'],
    md: ['h-16', 'text-ios-body'],
    lg: ['h-18', 'text-ios-headline'],
  }
  classes.push(...sizeClasses[props.size])

  return classes.join(' ')
})

const optionClasses = (index: number) => {
  const classes = ['flex-1', 'flex', 'items-center', 'justify-center', 'transition-all']

  if (index === currentIndex.value) {
    classes.push('bg-white', 'shadow-ios-card')
  }

  return classes.join(' ')
}

const optionStyle = (index: number) => {
  const styles: Record<string, string> = {}

  if (index === currentIndex.value) {
    // 选中项有圆角
    if (props.rounded) {
      styles.borderRadius = '20rpx'
    } else {
      styles.borderRadius = '12rpx'
    }
  }

  return styles
}

const textClasses = (index: number) => {
  const classes = ['font-medium']

  if (index === currentIndex.value) {
    classes.push('text-primary')
  } else {
    classes.push('text-ios-gray')
  }

  return classes.join(' ')
}

const handleSelect = (index: number) => {
  const option = props.options[index]

  let value: number | string
  if (typeof option === 'string') {
    value = option
  } else {
    value = option.value ?? index
  }

  emit('update:modelValue', value)
  emit('change', value, index)
}
</script>
