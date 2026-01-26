<template>
  <PageLayout>
    <view class="min-h-screen bg-page px-xl py-xl">
      <!-- 极简用户信息卡片 -->
      <view class="user-card mb-xl">
        <image class="user-avatar" :src="userStore.avatar" />
        <view class="flex-1">
          <text class="user-name">{{ userStore.displayName }}</text>
          <text class="user-role">{{ roleName }}</text>
        </view>
      </view>

      <!-- 极简统计卡片 - 超大数字 -->
      <view class="stats-grid mb-xl">
        <view class="stat-card" @tap="goToTasks('pending')">
          <text class="stat-number">{{ stats.pendingCount || 0 }}</text>
          <text class="stat-label">待处理</text>
          <view class="stat-badge">待接单</view>
        </view>

        <view class="stat-card" @tap="goToTasks('processing')">
          <text class="stat-number">{{ stats.processingCount || 0 }}</text>
          <text class="stat-label">处理中</text>
          <view class="stat-badge">进行中</view>
        </view>

        <view class="stat-card" @tap="goToTasks('completed')">
          <text class="stat-number">{{ stats.todayCompleted || 0 }}</text>
          <text class="stat-label">今日完工</text>
          <view class="stat-badge">已完成</view>
        </view>

        <view class="stat-card">
          <text class="stat-number">{{ stats.averageRating?.toFixed(1) || '0.0' }}</text>
          <text class="stat-label">平均评分</text>
          <view class="stat-badge">★</view>
        </view>
      </view>

      <!-- 极简快捷操作 -->
      <view class="flex gap-md mb-xl">
        <view class="action-card flex-1" @tap="goToPool">
          <text class="action-icon">📋</text>
          <text class="action-label">待接单池</text>
        </view>

        <view class="action-card flex-1" @tap="goToTasks('all')">
          <text class="action-icon">📝</text>
          <text class="action-label">我的任务</text>
        </view>
      </view>

      <!-- 最近工单 -->
      <view class="recent-section">
        <view class="flex justify-between items-center mb-md">
          <text class="section-title">最近工单</text>
          <text class="section-link" @tap="goToTasks('all')">查看全部 →</text>
        </view>

        <scroll-view class="max-h-150" scroll-y v-if="recentTickets.length > 0">
          <view v-for="ticket in recentTickets" :key="ticket.id" class="ticket-item" @tap="goToDetail(ticket.id)">
            <view class="flex justify-between items-center mb-sm">
              <text class="ticket-number">{{ ticket.ticketNumber }}</text>
              <view :class="['status-badge-mini', getStatusClass(ticket.status)]">
                {{ TICKET_STATUS_TEXT[ticket.status] }}
              </view>
            </view>
            <text class="ticket-title">{{ ticket.title }}</text>
            <text class="ticket-time">{{ formatTime(ticket.createdAt) }}</text>
          </view>
        </scroll-view>

        <view v-else class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无工单</text>
        </view>
      </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTabBarStore } from '@/store/modules/tabbar';
import { useTabBarUpdate } from '@/composables/useTabBarUpdate';
import PageLayout from '@/components/PageLayout.vue';
import { useUserStore, useTicketStore } from '@/store';
import * as statisticsApi from '@/api/statistics';
import { TICKET_STATUS_TEXT, type Ticket } from '@/api/types';

const userStore = useUserStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();
const ticketStore = useTicketStore();

// 统计数据
const stats = ref({
  pendingCount: 0,
  processingCount: 0,
  todayCompleted: 0,
  totalCompleted: 0,
  averageRating: 0,
});

// 最近工单
const recentTickets = ref<Ticket[]>([]);

// 角色名称
const roleName = computed(() => {
  if (userStore.isHandler) return '处理人员';
  return '普通用户';
});

// 状态样式
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    'WAIT_ACCEPT': 'status-wait',
    'PROCESSING': 'status-processing',
    'COMPLETED': 'status-completed',
  };
  return statusMap[status] || 'status-default';
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const data = await statisticsApi.getHandlerStats(userStore.userInfo!.id);
    stats.value = data;
  } catch (error) {
    console.error('加载统计数据失败', error);
  }
}

/**
 * 加载最近工单
 */
async function loadRecentTickets() {
  try {
    await ticketStore.loadTickets({
      assignedId: userStore.userInfo!.id,
      limit: 5,
    }, true);
    recentTickets.value = ticketStore.ticketList.slice(0, 5);
  } catch (error) {
    console.error('加载最近工单失败', error);
  }
}

/**
 * 跳转待接单池
 */
function goToPool() {
  uni.navigateTo({
    url: '/pages/handler/task-pool/index',
  });
}

/**
 * 跳转我的任务
 */
function goToTasks(status: string) {
  uni.navigateTo({
    url: `/pages/handler/my-tasks/index?status=${status}`,
  });
}

/**
 * 跳转工单详情
 */
function goToDetail(id: string) {
  uni.navigateTo({
    url: `/pages/handler/task-detail/index?id=${id}`,
  });
}

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

onMounted(() => {
  loadStats();
  loadRecentTickets();
});

onShow(() => {
  loadStats();
  loadRecentTickets();
});
</script>

<style scoped>
/* 用户卡片 */
.user-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx;
  background: var(--bg-card);
  border: 1rpx solid var(--border);
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: var(--radius-sm);
}

.user-name {
  display: block;
  font-size: var(--text-title);
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.user-role {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.stat-card {
  padding: 32rpx;
  background: var(--bg-card);
  border: 1rpx solid var(--border);
  position: relative;
}

.stat-number {
  display: block;
  font-size: var(--text-huge);
  font-weight: 200;
  color: var(--color-black);
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin-bottom: 16rpx;
}

.stat-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 6rpx 12rpx;
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-tiny);
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

/* 快捷操作 */
.action-card {
  padding: 32rpx;
  background: var(--bg-card);
  border: 1rpx solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  font-size: 48rpx;
}

.action-label {
  font-size: var(--text-body);
  color: var(--text-primary);
}

/* 最近工单 */
.recent-section {
  padding: 32rpx 0;
}

.section-title {
  font-size: var(--text-headline);
  font-weight: 400;
  color: var(--text-primary);
}

.section-link {
  font-size: var(--text-body);
  color: var(--color-black);
}

.ticket-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid var(--border);
}

.ticket-number {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  letter-spacing: 1rpx;
}

.ticket-title {
  display: block;
  font-size: var(--text-body);
  color: var(--text-primary);
  margin-bottom: 8rpx;
}

.ticket-time {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
}

.status-badge-mini {
  font-size: var(--text-tiny);
  letter-spacing: 1rpx;
  text-transform: uppercase;
  padding: 4rpx 8rpx;
  font-weight: 500;
}

.status-wait {
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.status-processing {
  background: var(--bg-card);
  color: var(--color-black);
  border: 1rpx solid var(--border);
}

.status-completed {
  background: var(--color-black);
  color: var(--color-white);
}

.status-default {
  background: var(--bg-subtle);
  color: var(--text-tertiary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: var(--text-body);
  color: var(--text-secondary);
}
</style>
