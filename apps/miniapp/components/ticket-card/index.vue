<template>
  <view class="ticket-card card-organic" @click="$emit('click')">
    <view class="card-header">
      <view class="ticket-number-row">
        <view class="status-dot" :class="`status-dot-${ticket.status.toLowerCase()}`"></view>
        <text class="ticket-number">{{ ticket.ticketNumber }}</text>
      </view>
      <view
        class="status-badge"
        :class="`status-${ticket.status.toLowerCase()}`"
      >
        {{ TICKET_STATUS_TEXT[ticket.status] }}
      </view>
    </view>

    <view class="card-body">
      <text class="ticket-title">{{ ticket.title }}</text>
      <text class="ticket-desc">{{ ticket.description }}</text>

      <!-- 附件预览 -->
      <view v-if="showAttachments && ticket.attachments && ticket.attachments.length > 0" class="attachments">
        <view
          v-for="(img, i) in ticket.attachments.slice(0, 3)"
          :key="i"
          class="attachment-wrapper"
        >
          <image
            :src="img.url"
            class="attachment-thumb"
            mode="aspectFill"
          />
        </view>
        <view v-if="ticket.attachments.length > 3" class="more-count">
          <text class="more-count-text">+{{ ticket.attachments.length - 3 }}</text>
        </view>
      </view>
    </view>

    <view class="card-footer">
      <view class="meta-item">
        <text class="meta-icon">◆</text>
        <text class="meta-text">{{ ticket.category?.name }}</text>
      </view>
      <view class="meta-item">
        <text class="meta-icon">◷</text>
        <text class="meta-text">{{ formatTime(ticket.createdAt) }}</text>
      </view>
    </view>

    <!-- 优先级标记 -->
    <view
      v-if="ticket.priority === 'URGENT'"
      class="priority-tag"
    >
      <text class="priority-tag-text">紧急</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { TICKET_STATUS_TEXT, PRIORITY_COLOR, type Ticket } from '@/api/types';

interface Props {
  ticket: Ticket;
  showAttachments?: boolean;
}

withDefaults(defineProps<Props>(), {
  showAttachments: true,
});

defineEmits<{
  click: [];
}>();

/**
 * 格式化时间
 */
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  return `${Math.floor(diff / 86400000)}天前`;
}
</script>

<style scoped lang="scss">
.ticket-card {
  background: #FFFEFB;
  border-radius: 20rpx;
  padding: 32rpx;
  position: relative;
  box-shadow: 0 4rpx 16rpx rgba(44, 42, 39, 0.08);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: translateY(2rpx) scale(0.99);
    box-shadow: 0 2rpx 12rpx rgba(44, 42, 39, 0.06);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.ticket-number-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.status-dot {
  width: 6rpx;
  height: 24rpx;
  border-radius: 6rpx;

  &.status-dot-wait_assign {
    background: #C4B0A0;
  }

  &.status-dot-wait_accept {
    background: #9CB4C4;
  }

  &.status-dot-processing {
    background: #9DB4A0;
  }

  &.status-dot-completed {
    background: #7BA37B;
  }

  &.status-dot-closed {
    background: #A8A49C;
  }
}

.ticket-number {
  font-size: 24rpx;
  color: #A8A49C;
  font-weight: 500;
}

.status-badge {
  padding: 10rpx 20rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 500;
  letter-spacing: 0.5rpx;

  &.status-wait_assign {
    background: rgba(196, 176, 160, 0.12);
    color: #9A7B4C;
  }

  &.status-wait_accept {
    background: rgba(156, 180, 196, 0.12);
    color: #5C7BA8;
  }

  &.status-processing {
    background: rgba(157, 180, 160, 0.12);
    color: #7A9B7C;
  }

  &.status-completed {
    background: rgba(123, 163, 123, 0.12);
    color: #5C8B5C;
  }

  &.status-closed {
    background: rgba(168, 164, 156, 0.12);
    color: #8E8E93;
  }
}

.card-body {
  margin-bottom: 24rpx;
}

.ticket-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #2C2A27;
  margin-bottom: 12rpx;
}

.ticket-desc {
  display: block;
  font-size: 28rpx;
  color: #6B665F;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.attachments {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}

.attachment-wrapper {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  overflow: hidden;
  border-radius: 12rpx;
}

.attachment-thumb {
  width: 100%;
  height: 100%;
}

.more-count {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EBE8E1;
  border-radius: 12rpx;
  border: 2rpx solid #E0DDD6;
}

.more-count-text {
  font-size: 24rpx;
  color: #A8A49C;
  font-weight: 500;
}

.card-footer {
  display: flex;
  gap: 40rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-icon {
  font-size: 20rpx;
  color: #9DB4A0;
}

.meta-text {
  font-size: 24rpx;
  color: #A8A49C;
}

.priority-tag {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  padding: 8rpx 16rpx;
  background: rgba(196, 120, 120, 0.12);
  border-radius: 20rpx;
}

.priority-tag-text {
  font-size: 22rpx;
  color: #A85C5C;
  font-weight: 500;
}
</style>
