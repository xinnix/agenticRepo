<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view v-if="!ticket" class="loading-container">
      <u-loading-icon mode="circle" size="60" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 工单详情内容 -->
    <scroll-view v-else class="content-wrapper" scroll-y>
      <!-- 工单编号卡片 -->
      <view class="card ticket-number-card">
        <view class="card-header">
          <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
          <view class="status-badge" :class="getStatusClass(ticket.status)">
            <text>{{ getStatusText(ticket.status) }}</text>
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <view class="progress-steps">
          <view
            v-for="(step, index) in steps"
            :key="index"
            class="step-item"
            :class="{ active: index <= currentIndex }"
          >
            <view class="step-dot"></view>
            <text class="step-label">{{ step.label }}</text>
          </view>
        </view>
      </view>

      <!-- 工单信息卡片 -->
      <view class="card">
        <view class="card-title">工单信息</view>

        <view class="info-row">
          <text class="info-label">问题标题</text>
          <text class="info-value">{{ ticket.title }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">详细描述</text>
          <text class="info-value description">{{ ticket.description }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">问题分类</text>
          <text class="info-value">{{ ticket.category?.name || '未分类' }}</text>
        </view>

        <view v-if="ticket.location" class="info-row">
          <text class="info-label">位置信息</text>
          <text class="info-value">{{ ticket.location }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">优先级</text>
          <view class="priority-tag" :class="getPriorityClass(ticket.priority)">
            <text>{{ getPriorityText(ticket.priority) }}</text>
          </view>
        </view>

        <view class="info-row">
          <text class="info-label">提交时间</text>
          <text class="info-value">{{ formatDateTime(ticket.createdAt) }}</text>
        </view>
      </view>

      <!-- 图片附件卡片 -->
      <view v-if="ticket.attachments && ticket.attachments.length > 0" class="card">
        <view class="card-title">相关图片</view>
        <view class="image-grid">
          <view
            v-for="(img, index) in ticket.attachments"
            :key="index"
            class="image-item"
            @tap="previewImage(ticket.attachments!, index)"
          >
            <image class="image-thumb" :src="img.url" mode="aspectFill" />
          </view>
        </view>
      </view>

      <!-- 处理人信息卡片 -->
      <view v-if="ticket.assignedTo" class="card">
        <view class="card-title">处理人信息</view>
        <view class="handler-info">
          <image
            class="handler-avatar"
            :src="ticket.assignedTo.wxAvatarUrl || ticket.assignedTo.avatar || '/static/logo.png'"
            mode="aspectFill"
          />
          <view class="handler-details">
            <text class="handler-name">{{ ticket.assignedTo.wxNickname || ticket.assignedTo.username }}</text>
            <text v-if="ticket.assignedTo.position" class="handler-position">{{ ticket.assignedTo.position }}</text>
          </view>
        </view>
        <view class="action-btns">
          <view class="action-btn primary" @tap="makeCall">
            <u-icon name="phone" size="20" color="#FFFFFF"></u-icon>
            <text>联系处理人</text>
          </view>
        </view>
      </view>

      <!-- 评价信息卡片 -->
      <view v-if="ticket.rating" class="card">
        <view class="card-title">我的评价</view>
        <view class="rating-section">
          <view class="rating-stars">
            <u-icon
              v-for="i in 5"
              :key="i"
              name="star-fill"
              size="24"
              :color="i <= ticket.rating ? '#FF9500' : '#E5E5E5'"
            />
          </view>
          <text v-if="ticket.feedback" class="feedback-text">{{ ticket.feedback }}</text>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="bottom-actions">
        <view
          v-if="ticket.status === 'COMPLETED'"
          class="action-btn-large primary"
          @tap="goToRate"
        >
          <text>立即评价</text>
        </view>

        <view
          v-if="ticket.status === 'COMPLETED' && !ticket.rating"
          class="action-btn-large outline"
          @tap="closeTicket"
        >
          <text>关闭工单</text>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-spacer"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTicketStore } from '@/store';
import { TicketStatus, type Ticket } from '@/api/types';

const ticketStore = useTicketStore();

const ticket = ref<Ticket | null>(null);
const ticketId = ref('');

// 进度步骤
const steps = [
  { key: TicketStatus.WAIT_ASSIGN, label: '已提交' },
  { key: TicketStatus.WAIT_ACCEPT, label: '已指派' },
  { key: TicketStatus.PROCESSING, label: '处理中' },
  { key: TicketStatus.COMPLETED, label: '已完成' },
  { key: TicketStatus.CLOSED, label: '已关闭' },
];

// 当前状态索引
const currentIndex = computed(() => {
  if (!ticket.value) return -1;
  return steps.findIndex(s => s.key === ticket.value?.status);
});

// 进度百分比
const progressPercent = computed(() => {
  if (currentIndex.value < 0) return 0;
  return (currentIndex.value / (steps.length - 1)) * 100;
});

/**
 * 加载工单详情
 */
async function loadDetail(id: string) {
  try {
    console.log('[TicketDetail] 开始加载工单详情, ID:', id);
    ticket.value = await ticketStore.loadTicketDetail(id);
    console.log('[TicketDetail] 工单详情加载成功:', ticket.value);
  } catch (error) {
    console.error('[TicketDetail] 加载工单详情失败', error);
    uni.showToast({
      title: '加载失败',
      icon: 'error',
    });
  }
}

/**
 * 预览图片
 */
function previewImage(attachments: any[], index: number) {
  const urls = attachments.map(a => a.url);
  uni.previewImage({
    urls,
    current: index,
  });
}

/**
 * 拨打电话
 */
function makeCall() {
  if (ticket.value?.assignedTo?.phone) {
    uni.makePhoneCall({
      phoneNumber: ticket.value.assignedTo.phone,
    });
  } else {
    uni.showToast({
      title: '暂无联系方式',
      icon: 'none',
    });
  }
}

/**
 * 跳转评价页面
 */
function goToRate() {
  uni.navigateTo({
    url: `/pages/user/rate/index?id=${ticketId.value}`,
  });
}

/**
 * 关闭工单
 */
async function closeTicket() {
  uni.showModal({
    title: '确认关闭',
    content: '关闭后将无法再次评价，确定要关闭工单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await ticketStore.rateTicket(ticketId.value, 0, '用户关闭工单');
          uni.showToast({
            title: '已关闭',
            icon: 'success',
          });
          await loadDetail(ticketId.value);
        } catch (error) {
          console.error('关闭失败', error);
        }
      }
    },
  });
}

/**
 * 获取状态文本
 */
function getStatusText(status: TicketStatus): string {
  const statusMap: Record<string, string> = {
    WAIT_ASSIGN: '待指派',
    WAIT_ACCEPT: '待接单',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    CLOSED: '已关闭',
    CANCELLED: '已取消',
  };
  return statusMap[status] || status;
}

/**
 * 获取状态样式类
 */
function getStatusClass(status: TicketStatus): string {
  const classMap: Record<string, string> = {
    WAIT_ASSIGN: 'pending',
    WAIT_ACCEPT: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
  };
  return classMap[status] || '';
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority: string): string {
  const map: Record<string, string> = {
    NORMAL: '普通',
    URGENT: '紧急',
  };
  return map[priority] || priority;
}

/**
 * 获取优先级样式类
 */
function getPriorityClass(priority: string): string {
  return priority === 'URGENT' ? 'urgent' : 'normal';
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 使用 onLoad 获取页面参数
onLoad((options) => {
  console.log('[TicketDetail] 页面参数:', options);

  if (options?.id) {
    ticketId.value = options.id;
    loadDetail(options.id);
  } else {
    console.error('[TicketDetail] 缺少工单ID参数');
    uni.showToast({
      title: '参数错误',
      icon: 'error',
    });
  }
});
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #F2F2F7;
  width: 100%;
  overflow-x: hidden;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #8E8E93;
}

/* 内容容器 */
.content-wrapper {
  width: 100%;
  max-width: 750rpx;
  margin: 0 auto;
  padding: 32rpx;
  padding-bottom: 200rpx;
  box-sizing: border-box;
}

/* 卡片通用样式 */
.card {
  width: 100%;
  box-sizing: border-box;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

/* 工单编号卡片 */
.ticket-number-card {
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  color: #FFFFFF;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.ticket-number {
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1rpx;
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-badge.pending {
  background: rgba(255, 255, 255, 0.25);
  color: #FFFFFF;
}

.status-badge.processing {
  background: rgba(255, 149, 0, 0.9);
  color: #FFFFFF;
}

.status-badge.completed {
  background: rgba(52, 199, 89, 0.9);
  color: #FFFFFF;
}

.status-badge.closed,
.status-badge.cancelled {
  background: rgba(142, 142, 147, 0.5);
  color: #FFFFFF;
}

/* 进度条 */
.progress-bar {
  width: 100%;
  height: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3rpx;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.progress-fill {
  height: 100%;
  background: #FFFFFF;
  border-radius: 3rpx;
  transition: width 0.3s;
}

/* 进度步骤 */
.progress-steps {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  min-width: 0;
}

.step-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.step-item.active .step-dot {
  background: #FFFFFF;
  box-shadow: 0 0 0 6rpx rgba(255, 255, 255, 0.2);
}

.step-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.step-item.active .step-label {
  color: #FFFFFF;
  font-weight: 600;
}

/* 信息行 */
.info-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F2F2F7;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 24rpx;
  color: #8E8E93;
  font-weight: 500;
  word-break: break-all;
}

.info-value {
  font-size: 28rpx;
  color: #1C1C1E;
  font-weight: 500;
  line-height: 1.6;
  word-break: break-all;
}

.info-value.description {
  color: #3A3A3C;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* 优先级标签 */
.priority-tag {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.priority-tag.normal {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.priority-tag.urgent {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

/* 图片网格 */
.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  width: 100%;
  box-sizing: border-box;
}

.image-item {
  aspect-ratio: 1;
  border-radius: 16rpx;
  overflow: hidden;
  background: #F2F2F7;
  width: 100%;
  box-sizing: border-box;
}

.image-thumb {
  width: 100%;
  height: 100%;
  display: block;
}

/* 处理人信息 */
.handler-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  width: 100%;
}

.handler-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 3rpx solid #F2F2F7;
  flex-shrink: 0;
}

.handler-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.handler-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1C1C1E;
  word-break: break-all;
}

.handler-position {
  font-size: 24rpx;
  color: #8E8E93;
  word-break: break-all;
}

.action-btns {
  display: flex;
  gap: 16rpx;
  width: 100%;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 700;
  box-sizing: border-box;
  min-width: 0;
}

.action-btn.primary {
  background: #007AFF;
  color: #FFFFFF;
  box-shadow: 0 8rpx 24rpx rgba(0, 122, 255, 0.3);
}

/* 评价区域 */
.rating-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rating-stars {
  display: flex;
  gap: 8rpx;
}

.feedback-text {
  font-size: 28rpx;
  color: #3A3A3C;
  line-height: 1.6;
}

/* 底部操作按钮 */
.bottom-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
  width: 100%;
  box-sizing: border-box;
}

.action-btn-large {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-sizing: border-box;
  min-width: 0;
}

.action-btn-large.primary {
  background: #007AFF;
  color: #FFFFFF;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.3);
}

.action-btn-large.outline {
  background: #FFFFFF;
  color: #8E8E93;
  border: 2rpx solid #E5E5E5;
}

/* 底部占位 */
.bottom-spacer {
  height: 40rpx;
}
</style>
