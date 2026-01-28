<template>
  <view class="dashboard-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-header">
      <view class="user-info">
        <image class="user-avatar" :src="avatarUrl" mode="aspectFill" />
        <view class="user-details">
          <text class="user-name">{{ realName }}</text>
          <text class="user-dept">{{ departmentName }}</text>
        </view>
      </view>
      <view class="header-actions">
        <view class="apply-btn-small" @tap="goToApplyHandler">
          <u-icon name="star" size="14" color="#FFFFFF"></u-icon>
          <text>申请办事员</text>
        </view>
        <view class="icon-btn" @tap="goToSettings">
          <u-icon name="setting" size="22"></u-icon>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-container">
      <view class="stat-item" :class="{ active: currentStatus === 'all' }" @tap="switchStatus('all')">
        <text class="stat-label">全部反馈</text>
        <text class="stat-value primary">{{ stats.totalCount }}</text>
      </view>
      <view class="stat-item" :class="{ active: currentStatus === 'PROCESSING' }" @tap="switchStatus('PROCESSING')">
        <text class="stat-label">处理中</text>
        <text class="stat-value">{{ stats.processingCount }}</text>
      </view>
      <view class="stat-item" :class="{ active: currentStatus === 'COMPLETED' }" @tap="switchStatus('COMPLETED')">
        <text class="stat-label">已完成</text>
        <text class="stat-value completed">{{ stats.completedCount }}</text>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-container">
      <view class="tab-item active">
        <text>我的反馈</text>
      </view>
    </view>

    <!-- 我的反馈列表 -->
    <view class="content-container">
      <view v-for="ticket in tickets" :key="ticket.id" class="task-card" :class="{ 'has-rating': ticket.rating }"
        @tap="goToDetail(ticket.id)">
        <view class="task-header">
          <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
          <view class="status-badge" :class="getStatusClass(ticket.status)">
            <text>{{ getStatusText(ticket.status) }}</text>
          </view>
        </view>
        <text class="task-title">{{ ticket.title }}</text>
        <view class="task-footer">
          <view class="task-meta">
            <u-icon name="grid" size="14" color="#8E8E93"></u-icon>
            <text>{{ ticket.category?.name || '未分类' }}</text>
          </view>
          <view class="task-rating" v-if="ticket.rating">
            <u-icon name="star-fill" size="14" color="#FF9500"></u-icon>
            <text>{{ ticket.rating }}分</text>
          </view>
          <text class="task-time">{{ formatTime(ticket.createdAt) }}</text>
        </view>
      </view>

      <u-empty v-if="tickets.length === 0" mode="list" text="暂无反馈记录" icon="list" />

      <!-- 没有更多 -->
      <view v-if="!hasMore && tickets.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </view>

    <!-- 提交反馈按钮 -->
    <view class="submit-btn" @tap="goToSubmit">
      <u-icon name="plus" size="24" color="#FFFFFF"></u-icon>
      <text>提交反馈</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store';
import { useTicketStore } from '@/store/modules/ticket';
import type { Ticket, TicketStatus } from '@/api/types';

const userStore = useUserStore();
const ticketStore = useTicketStore();

// 当前筛选状态
const currentStatus = ref<string>('all');

// 用户信息
const avatarUrl = computed(() => {
  return userStore.userInfo?.wxAvatarUrl || userStore.userInfo?.avatar || '/static/logo.png';
});

const realName = computed(() => {
  const name = userStore.userInfo?.realName || '';
  if (name) return name;
  return userStore.userInfo?.wxNickname || userStore.userInfo?.username || '未设置';
});

const departmentName = computed(() => {
  return userStore.userInfo?.department?.name || '未设置部门';
});

// 反馈列表
const tickets = computed(() => ticketStore.ticketList);

// 加载状态
const hasMore = computed(() => ticketStore.hasMore);

// 统计数据
const stats = computed(() => ({
  totalCount: ticketStore.total,
  processingCount: ticketStore.ticketList.filter(t => t.status === 'PROCESSING').length,
  completedCount: ticketStore.ticketList.filter(t => t.status === 'COMPLETED').length,
}));

/**
 * 切换状态筛选
 */
function switchStatus(status: string) {
  currentStatus.value = status;
  refresh();
}

/**
 * 加载用户反馈列表
 */
async function loadTickets(refresh = false) {
  if (!userStore.userInfo?.id) return;

  const params: any = {
    createdById: userStore.userInfo.id,
    limit: 20,
  };

  if (currentStatus.value !== 'all') {
    params.status = currentStatus.value;
  }

  if (refresh) {
    await ticketStore.refresh(params);
  } else {
    await ticketStore.loadTickets(params);
  }
}

/**
 * 刷新列表
 */
function refresh() {
  loadTickets(true);
}

/**
 * 跳转提交页面
 */
function goToSubmit() {
  uni.navigateTo({
    url: '/pages/user/submit/index',
  });
}

/**
 * 跳转详情页面
 */
function goToDetail(id: string) {
  uni.navigateTo({
    url: `/pages/user/ticket-detail/index?id=${id}`,
  });
}

/**
 * 跳转设置页面
 */
function goToSettings() {
  uni.navigateTo({
    url: '/pages/common/profile/index',
  });
}

/**
 * 跳转申请办事员页面
 */
function goToApplyHandler() {
  uni.navigateTo({
    url: '/pages/user/apply-handler/index',
  });
}

/**
 * 获取状态文本
 */
function getStatusText(status: TicketStatus): string {
  const statusMap: Record<TicketStatus, string> = {
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
  const classMap: Record<TicketStatus, string> = {
    WAIT_ACCEPT: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
  };
  return classMap[status] || '';
}

/**
 * 格式化时间
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  }
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  return `${Math.floor(diff / 86400000)}天前`;
}

onShow(() => {
  uni.hideHomeButton();
  loadTickets(true);
});

onMounted(() => {
  loadTickets(true);
});
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 120rpx;
}

/* 用户头部 */
.user-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background: #FFFFFF;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2rpx solid #F2F2F7;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
}

.user-dept {
  font-size: 22rpx;
  color: #8E8E93;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 8rpx;
  align-items: center;
}

/* 申请办事员小按钮 */
.apply-btn-small {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #007AFF;
  padding: 12rpx 20rpx;
  border-radius: 32rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #FFFFFF;
  box-shadow: 0 4rpx 16rpx rgba(0, 122, 255, 0.25);
}

.icon-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
}

/* 统计卡片 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  padding: 32rpx;
}

.stat-item {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.stat-item.active {
  background: #007AFF;
}

.stat-item.active .stat-label {
  color: rgba(255, 255, 255, 0.8);
}

.stat-item.active .stat-value {
  color: #FFFFFF;
}

.stat-label {
  font-size: 22rpx;
  font-weight: 700;
  color: #AEAEB2;
}

.stat-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #1C1C1E;
  line-height: 1;
}

.stat-value.primary {
  color: #007AFF;
}

.stat-value.completed {
  color: #34C759;
}

/* Tab 切换 */
.tab-container {
  display: flex;
  margin: 0 32rpx 24rpx;
  background: rgba(142, 142, 147, 0.12);
  border-radius: 16rpx;
  padding: 8rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #8E8E93;
  transition: all 0.3s;
}

.tab-item.active {
  background: #FFFFFF;
  color: #1C1C1E;
  font-weight: 700;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

/* 内容区域 */
.content-container {
  padding: 0 32rpx;
}

/* 工单卡片 */
.task-card {
  background: #FFFFFF;
  border: 2rpx solid #F2F2F7;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.task-card.has-rating {
  border-left: 8rpx solid #34C759;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.ticket-number {
  font-size: 22rpx;
  font-weight: 700;
  color: #AEAEB2;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-badge.pending {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.status-badge.processing {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.status-badge.completed {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.status-badge.closed,
.status-badge.cancelled {
  background: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
}

.task-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 2rpx solid #F2F2F7;
  padding-top: 24rpx;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #8E8E93;
}

.task-rating {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #FF9500;
  font-weight: 600;
}

.task-time {
  font-size: 22rpx;
  color: #AEAEB2;
}

/* 申请卡片 */
.apply-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: #1C1C1E;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.apply-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apply-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.apply-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.apply-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.apply-arrow {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

/* 权益卡片 */
.benefits-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.benefits-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #8E8E93;
}

.benefit-item:not(:last-child) {
  border-bottom: 2rpx solid #F2F2F7;
}

/* 没有更多 */
.no-more {
  text-align: center;
  padding: 24rpx;
  font-size: 24rpx;
  color: #AEAEB2;
}

/* 提交反馈按钮 */
.submit-btn {
  position: fixed;
  bottom: 64rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  background: #007AFF;
  color: #FFFFFF;
  padding: 28rpx 80rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 32rpx rgba(0, 122, 255, 0.3);
}
</style>
