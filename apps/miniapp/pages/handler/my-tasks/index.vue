<template>
  <view class="my-tasks-page">
    <!-- Tab 切换 -->
    <view class="tab-container">
      <view v-for="(tab, index) in tabs" :key="tab.key" class="tab-item" :class="{ active: currentTabIndex === index }"
        @tap="onTabChange(index)">
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 工单列表 -->
    <scroll-view class="content-container" scroll-y @scrolltolower="loadMore">
      <!-- 空状态 -->
      <u-empty v-if="ticketList.length === 0 && !loading" mode="list" text="暂无任务" />

      <!-- 任务列表容器 -->
      <view v-else class="task-list">
        <!-- 工单卡片 -->
        <view
          v-for="ticket in ticketList"
          :key="ticket.id"
          class="task-card"
          :class="[getStatusClass(ticket.status), { urgent: ticket.priority === 'URGENT' }]"
          @tap="goToDetail(ticket.id)"
        >
          <view class="task-header">
            <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
            <view class="status-badge" :class="getStatusClass(ticket.status)">
              <text>{{ getStatusText(ticket.status) }}</text>
            </view>
          </view>
          <text class="task-title">{{ ticket.title }}</text>
          <text class="task-description">{{ ticket.description }}</text>

          <!-- 附件预览 -->
          <scroll-view v-if="ticket.attachments && ticket.attachments.length > 0" class="attachments-scroll" scroll-x>
            <view class="attachments-container">
              <image v-for="(img, i) in ticket.attachments.slice(0, 3)" :key="i" :src="img.url" class="attachment-image"
                mode="aspectFill" />
            </view>
          </scroll-view>

          <!-- 卡片底部 -->
          <view class="task-footer">
            <view class="task-meta">
              <view class="meta-item">
                <u-icon name="folder" size="14" color="#8E8E93"></u-icon>
                <text>{{ ticket.category?.name }}</text>
              </view>
              <view class="meta-item">
                <u-icon name="account" size="14" color="#8E8E93"></u-icon>
                <text>{{ ticket.createdBy.wxNickname || ticket.createdBy.username }}</text>
              </view>
              <view class="meta-item">
                <u-icon name="clock" size="14" color="#8E8E93"></u-icon>
                <text>{{ formatTime(ticket.createdAt) }}</text>
              </view>
            </view>
            <!-- 紧急标记 -->
            <view v-if="ticket.priority === 'URGENT'" class="urgent-badge">
              <text>紧急</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-container">
        <u-loading-icon mode="circle" />
        <text class="loading-text">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!hasMore && ticketList.length > 0" class="no-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTicketStore, useUserStore } from '@/store';
import { TicketStatus, type Ticket } from '@/api/types';
import { getStatusText } from '@/utils/tag-helpers';

const ticketStore = useTicketStore();
const userStore = useUserStore();

// 标签页
const tabs = [
  { key: 'all', label: '全部' },
  { key: String(TicketStatus.PROCESSING), label: '处理中' },
  { key: String(TicketStatus.COMPLETED), label: '已完成' },
];
const currentTab = ref('all');
const currentTabIndex = ref(0);

// 列表数据
const ticketList = computed(() => ticketStore.ticketList);
const loading = computed(() => ticketStore.loading);
const hasMore = computed(() => ticketStore.hasMore);

/**
 * 切换标签
 */
function switchTab(tab: string) {
  currentTab.value = tab;
  refresh();
}

/**
 * 标签切换（用于自定义 tab）
 */
function onTabChange(index: number) {
  currentTabIndex.value = index;
  currentTab.value = tabs[index].key;
  refresh();
}

/**
 * 获取状态样式类
 */
function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    [TicketStatus.WAIT_ASSIGN]: 'waiting',
    [TicketStatus.PROCESSING]: 'processing',
    [TicketStatus.COMPLETED]: 'completed',
    [TicketStatus.CLOSED]: 'closed',
  };
  return statusMap[status] || 'waiting';
}

/**
 * 加载工单列表
 */
async function loadTickets(refresh = false) {
  console.log('[MyTasks] Loading tickets...');
  console.log('[MyTasks] User info:', userStore.userInfo);
  console.log('[MyTasks] User ID:', userStore.userInfo?.id);

  const params: any = {
    assignedId: userStore.userInfo!.id,
  };

  console.log('[MyTasks] Request params:', params);

  if (currentTab.value !== 'all') {
    params.status = currentTab.value;
  }

  await ticketStore.loadTickets(params, refresh);
}

/**
 * 加载更多
 */
async function loadMore() {
  await ticketStore.loadMore();
}

/**
 * 刷新
 */
function refresh() {
  loadTickets(true);
}

/**
 * 跳转详情
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
  // 直接初始化，不依赖页面参数
  loadTickets(true);
});

onShow(() => {
  refresh();
});
</script>

<style scoped>
.my-tasks-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-top: 16rpx;
  padding-bottom: 32rpx;

}

/* Tab 切换 */
.tab-container {
  display: flex;
  margin: 32rpx;
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
  height: calc(100vh - 200rpx);
}

/* 任务列表容器 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 0 32rpx;
}

/* 工单卡片 */
.task-card {
  background: #FFFFFF;
  border: 2rpx solid #F2F2F7;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

/* 左侧状态边框 */
.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 8rpx;
  background: #007AFF;
  border-radius: 24rpx 0 0 24rpx;
}

.task-card.waiting::before {
  background: #007AFF;
}

.task-card.processing::before {
  background: #FF9500;
}

.task-card.completed::before {
  background: #34C759;
}

.task-card.closed::before {
  background: #8E8E93;
}

/* 紧急任务特殊样式（红色边框覆盖状态颜色） */
.task-card.urgent::before {
  background: #FF3B30;
}

/* 卡片头部 */
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

/* 状态徽章 */
.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-badge.waiting {
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

.status-badge.closed {
  background: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
}

/* 任务标题 */
.task-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 12rpx;
  line-height: 1.4;
}

/* 任务描述 */
.task-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 28rpx;
  color: #8E8E93;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

/* 附件预览 */
.attachments-scroll {
  margin-bottom: 16rpx;
}

.attachments-container {
  display: flex;
  gap: 16rpx;
}

.attachment-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

/* 卡片底部 */
.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 2rpx solid #F2F2F7;
  padding-top: 24rpx;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  flex: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #8E8E93;
}

/* 紧急徽章 */
.urgent-badge {
  padding: 8rpx 20rpx;
  background: rgba(255, 59, 48, 0.1);
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #FF3B30;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 32rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #8E8E93;
}

/* 没有更多 */
.no-more {
  display: flex;
  justify-content: center;
  padding: 32rpx;
}

.no-more text {
  font-size: 28rpx;
  color: #AEAEB2;
}
</style>
