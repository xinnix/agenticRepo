<template>
  <button
    :class="[
      'minimal-button',
      `minimal-button--${variant}`,
      `minimal-button--${size}`,
      block && 'minimal-button--block',
      disabled && 'minimal-button--disabled'
    ]"
    :disabled="disabled"
    @tap="handleTap"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  block?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  block: false,
  disabled: false
})

const emit = defineEmits<{
  tap: []
}>()

function handleTap() {
  if (!props.disabled) {
    emit('tap')
  }
}
</script>

<style scoped>
.minimal-button {
  border: none;
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-body);
  font-weight: 400;
  letter-spacing: 2rpx;
  text-align: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
  padding: 0;
}

.minimal-button:active {
  opacity: 0.8;
}

.minimal-button--primary {
  background: var(--color-black);
  color: var(--color-white);
}

.minimal-button--secondary {
  background: transparent;
  color: var(--color-black);
  border: 1rpx solid var(--border);
}

.minimal-button--outline {
  background: transparent;
  color: var(--color-black);
  border: 1rpx solid var(--color-black);
}

.minimal-button--small {
  padding: 16rpx 32rpx;
  font-size: var(--text-caption);
}

.minimal-button--medium {
  padding: 24rpx 48rpx;
  font-size: var(--text-body);
}

.minimal-button--large {
  padding: 32rpx 64rpx;
  font-size: var(--text-title);
}

.minimal-button--block {
  width: 100%;
  display: block;
}

.minimal-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.minimal-button--disabled:active {
  opacity: 0.5;
}
</style>
