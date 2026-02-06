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
      <view class="card ticket-number-card" :class="{ closed: ticket.status === 'CLOSED' }">
        <view class="card-header">
          <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
          <view class="status-badge" :class="getStatusClass(ticket.status)">
            <text>{{ getStatusText(ticket.status) }}</text>
          </view>
        </view>

        <!-- 关闭提示 -->
        <view v-if="ticket.status === 'CLOSED' && closeReason" class="close-notice">
          <view class="close-notice-icon">!</view>
          <view class="close-notice-content">
            <text class="close-notice-title">工单已关闭</text>
            <text class="close-notice-reason">{{ closeReason }}</text>
          </view>
        </view>

        <!-- 进度条和步骤（仅在非关闭状态显示） -->
        <template v-else>
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <view class="progress-steps">
            <view v-for="(step, index) in steps" :key="index" class="step-item"
              :class="{ active: index <= currentIndex }">
              <view class="step-dot"></view>
              <text class="step-label">{{ step.label }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 工单信息卡片 -->
      <view class="card">
        <view class="card-title">工单信息</view>

        <view class="info-row">
          <text class="info-label">问题分类</text>
          <text class="info-value">{{ ticket.category?.name || '未分类' }}</text>
        </view>

        <view class="info-row">
          <text class="info-label">详细描述</text>
          <text class="info-value description">{{ ticket.description }}</text>
        </view>

        <view v-if="ticket.location" class="info-row">
          <text class="info-label">位置信息</text>
          <text class="info-value">{{ ticket.location }}</text>
        </view>

        <!-- 相关图片 (移至工单信息卡片内) -->
        <view v-if="ticket.attachments && ticket.attachments.length > 0" class="info-section">
          <text class="info-label">相关图片</text>
          <view class="image-grid">
            <view v-for="(img, index) in ticket.attachments" :key="index" class="image-item"
              @tap="previewImage(ticket.attachments!, index)">
              <image class="image-thumb" :src="img.url" mode="aspectFill" />
            </view>
          </view>
        </view>

        <view class="info-row">
          <text class="info-label">提交时间</text>
          <text class="info-value">{{ formatDateTime(ticket.createdAt) }}</text>
        </view>
      </view>

      <!-- 处理反馈卡片 -->
      <view v-if="ticket.assignedTo || handlerComments.length > 0" class="card feedback-card">
        <view class="card-title">处理反馈</view>

        <!-- 处理人信息 -->
        <view v-if="ticket.assignedTo" class="info-row handler-row">
          <text class="info-label">处理人</text>
          <view class="handler-info">
            <image class="handler-avatar-small"
              :src="ticket.assignedTo.wxAvatarUrl || ticket.assignedTo.avatar || '/static/default-avatar.png'"
              mode="aspectFill" />
            <view class="handler-details">
              <text class="handler-name">{{ ticket.assignedTo.realName || ticket.assignedTo.realName ||
                ticket.assignedTo.username || '工作人员' }}</text>
              <text v-if="ticket.assignedTo.department?.name || ticket.assignedTo.position" class="handler-position">
                {{ ticket.assignedTo.department?.name }}{{ ticket.assignedTo.position ? ` ·
                ${ticket.assignedTo.position}` : '' }}
              </text>
            </view>
            <view v-if="ticket.assignedTo.phone" class="action-btn primary" @tap="makeCall">
              <text>联系</text>
            </view>
          </view>
        </view>

        <!-- 处理反馈列表 -->
        <view v-if="handlerComments.length > 0" class="feedback-list">
          <view v-for="(comment, index) in handlerComments" :key="comment.id" class="feedback-section">
            <!-- 完成时间 -->
            <view class="info-row">
              <text class="info-label">完成时间</text>
              <text class="info-value">{{ formatDateTime(comment.createdAt) }}</text>
            </view>

            <!-- 反馈内容 -->
            <view v-if="comment.content" class="info-row">
              <text class="info-label">反馈内容</text>
              <text class="info-value description">{{ comment.content }}</text>
            </view>

            <!-- 反馈图片 -->
            <view v-if="comment.attachments && comment.attachments.length > 0" class="info-section">
              <text class="info-label">反馈图片</text>
              <view class="feedback-images">
                <view v-for="(img, imgIndex) in comment.attachments" :key="img.id" class="feedback-image-item"
                  @tap="previewImage(comment.attachments!, imgIndex)">
                  <image class="feedback-image" :src="img.url" mode="aspectFill" />
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 暂无反馈 -->
        <view v-else-if="ticket.assignedTo" class="no-feedback">
          <text class="no-feedback-text">暂无处理反馈</text>
        </view>
      </view>

      <!-- 评价信息卡片 -->
      <view v-if="ticket.rating" class="card">
        <view class="card-title">我的评价</view>
        <view class="rating-section">
          <view class="rating-stars">
            <u-icon v-for="i in 5" :key="i" name="star-fill" size="24"
              :color="i <= ticket.rating ? '#FF9500' : '#E5E5E5'" />
          </view>
          <text v-if="ticket.feedback" class="feedback-text">{{ ticket.feedback }}</text>
        </view>
      </view>

      <!-- 底部操作按钮 -->
      <view class="bottom-actions">
        <view v-if="ticket.status === 'COMPLETED'" class="action-btn-large primary" @tap="goToRate">
          <text>立即评价</text>
        </view>

        <view v-if="ticket.status === 'COMPLETED' && !ticket.rating" class="action-btn-large outline"
          @tap="closeTicket">
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
import { TicketStatus, CommentType, type Ticket } from '@/api/types';

const ticketStore = useTicketStore();

const ticket = ref<Ticket | null>(null);
const ticketId = ref('');

// 筛选出处理人的反馈评论
const handlerComments = computed(() => {
  if (!ticket.value?.comments) return [];
  return ticket.value.comments
    .filter(c => c.commentType === CommentType.HANDLER)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

// 进度步骤
const steps = [
  { key: TicketStatus.WAIT_ASSIGN, label: '待处理' },
  { key: TicketStatus.PROCESSING, label: '处理中' },
  { key: TicketStatus.COMPLETED, label: '已完成' },
];

// 当前状态索引
const currentIndex = computed(() => {
  if (!ticket.value) return -1;

  // 如果工单已关闭，返回关闭前的状态
  if (ticket.value.status === TicketStatus.CLOSED) {
    // 从状态历史中找到关闭前的状态
    const lastHistory = ticket.value.statusHistory?.find(
      h => h.toStatus === TicketStatus.CLOSED
    );
    if (lastHistory?.fromStatus) {
      return steps.findIndex(s => s.key === lastHistory.fromStatus);
    }
    // 如果没有历史记录，默认显示为"待处理"
    return 0;
  }

  return steps.findIndex(s => s.key === ticket.value?.status);
});

// 进度百分比
const progressPercent = computed(() => {
  if (currentIndex.value < 0) return 0;

  // 如果工单已关闭，进度条保持灰色
  if (ticket.value?.status === TicketStatus.CLOSED) {
    return 0;
  }

  return (currentIndex.value / (steps.length - 1)) * 100;
});

// 获取关闭原因
const closeReason = computed(() => {
  if (ticket.value?.status !== TicketStatus.CLOSED) return null;

  const closeHistory = ticket.value.statusHistory?.find(
    h => h.toStatus === TicketStatus.CLOSED
  );

  return closeHistory?.remark || '工单已关闭';
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
    WAIT_ASSIGN: '待处理',
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

.ticket-number-card.closed {
  background: #8E8E93;
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

/* 关闭提示 */
.close-notice {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  margin-top: 16rpx;
}

.close-notice-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.9);
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.close-notice-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
}

.close-notice-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.close-notice-reason {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
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

/* 信息区域（用于图片等特殊内容） */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F2F2F7;
}

.info-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
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

/* 处理反馈卡片 */
.feedback-card {
  background: #FFFFFF;
  color: #1C1C1E;
}

/* 处理人行（作为info-row的变体） */
.handler-row {
  padding-bottom: 24rpx;
}

.handler-row .handler-info {
  display: flex;
  align-items: center;
  gap: 16rpx;
  width: 100%;
}

.handler-avatar-small {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  border: 2rpx solid #F2F2F7;
  flex-shrink: 0;
}

.handler-details {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
  min-width: 0;
}

.handler-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #1C1C1E;
  word-break: break-all;
}

.handler-position {
  font-size: 22rpx;
  color: #8E8E93;
  word-break: break-all;
}

.handler-row .action-btn {
  padding: 12rpx 24rpx;
  background: #007AFF;
  color: #FFFFFF;
  border-radius: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.25);
}

/* 反馈列表 */
.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  width: 100%;
  padding-top: 8rpx;
}

.feedback-section {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* 反馈图片 */
.feedback-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  width: 100%;
}

.feedback-image-item {
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
  background: #F2F2F7;
}

.feedback-image {
  width: 100%;
  height: 100%;
  display: block;
}

/* 暂无反馈 */
.no-feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.no-feedback-text {
  font-size: 26rpx;
  color: #8E8E93;
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
