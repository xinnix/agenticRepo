<template>
  <component
    :is="tag"
    :class="[
      'minimal-typography',
      `minimal-typography--${variant}`,
      `minimal-typography--${weight}`,
      uppercase && 'minimal-typography--uppercase'
    ]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'huge' | 'hero' | 'display' | 'headline' | 'title' | 'body' | 'caption' | 'tiny'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  uppercase?: boolean
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'body',
  weight: 'normal',
  uppercase: false,
  tag: 'text'
})
</script>

<style scoped>
.minimal-typography {
  color: var(--text-primary);
  line-height: 1.6;
}

.minimal-typography--huge {
  font-size: var(--text-huge);
  font-weight: 200;
  letter-spacing: 4rpx;
}

.minimal-typography--hero {
  font-size: var(--text-hero);
  font-weight: 200;
  letter-spacing: 3rpx;
}

.minimal-typography--display {
  font-size: var(--text-display);
  font-weight: 300;
  letter-spacing: 2rpx;
}

.minimal-typography--headline {
  font-size: var(--text-headline);
  font-weight: 400;
}

.minimal-typography--title {
  font-size: var(--text-title);
  font-weight: 500;
}

.minimal-typography--body {
  font-size: var(--text-body);
  font-weight: 400;
}

.minimal-typography--caption {
  font-size: var(--text-caption);
  font-weight: 400;
}

.minimal-typography--tiny {
  font-size: var(--text-tiny);
  font-weight: 400;
  letter-spacing: 1rpx;
}

.minimal-typography--light {
  font-weight: 200;
}

.minimal-typography--normal {
  font-weight: 400;
}

.minimal-typography--medium {
  font-weight: 500;
}

.minimal-typography--semibold {
  font-weight: 600;
}

.minimal-typography--bold {
  font-weight: 700;
}

.minimal-typography--uppercase {
  text-transform: uppercase;
}
</style>
