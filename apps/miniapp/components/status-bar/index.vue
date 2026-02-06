<template>
  <view class="status-bar" :class="{ compact: compact }">
    <view
      v-for="(step, index) in steps"
      :key="index"
      class="step"
      :class="{ active: currentIndex >= index, completed: currentIndex > index }"
    >
      <view class="step-dot">
        <text v-if="currentIndex > index" class="step-check">✓</text>
      </view>
      <text class="step-label">{{ step.label }}</text>
      <view v-if="index < steps.length - 1" class="step-line"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TicketStatus } from '@/api/types';

interface Step {
  key: TicketStatus;
  label: string;
}

interface Props {
  currentStatus: TicketStatus;
  statusHistory?: Array<{ fromStatus?: TicketStatus; toStatus: TicketStatus }>;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const steps: Step[] = [
  { key: TicketStatus.WAIT_ASSIGN, label: '待处理' },
  { key: TicketStatus.PROCESSING, label: '处理中' },
  { key: TicketStatus.COMPLETED, label: '已完成' },
];

const currentIndex = computed(() => {
  // 如果工单已关闭，不显示任何步骤为激活状态
  if (props.currentStatus === TicketStatus.CLOSED) {
    return -1;
  }
  return steps.findIndex(s => s.key === props.currentStatus);
});
</script>

<style scoped lang="scss">
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;

  &.compact {
    .step-label {
      font-size: 20rpx;
    }

    .step-dot {
      width: 32rpx;
      height: 32rpx;
    }
  }
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  background: #e0e0e0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  z-index: 1;
  transition: all 0.3s;

  .step.active &,
  .step.completed & {
    background: #667eea;
  }
}

.step-check {
  font-size: 24rpx;
  color: #fff;
}

.step-label {
  font-size: 22rpx;
  color: #999;
  transition: all 0.3s;

  .step.active &,
  .step.completed & {
    color: #667eea;
  }
}

.step-line {
  position: absolute;
  top: 24rpx;
  left: 50%;
  width: 100%;
  height: 2rpx;
  background: #e0e0e0;
  z-index: 0;
  transition: all 0.3s;

  .step.completed & {
    background: #667eea;
  }
}
</style>
