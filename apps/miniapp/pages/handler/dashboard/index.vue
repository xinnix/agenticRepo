<template>
  <view class="dashboard-page">
    <!-- 顶部用户信息卡片 -->
    <view class="user-header">
      <view class="user-info">
        <image class="user-avatar" :src="userStore.avatar" mode="aspectFill" />
        <view class="user-details">
          <text class="user-name">{{ realName }}</text>
          <text class="user-dept">{{ departmentName }} • 在线</text>
        </view>
      </view>
      <view class="header-actions">
        <view class="icon-btn" @tap="goToNotifications">
          <u-icon name="bell" size="22"></u-icon>
        </view>
        <view class="icon-btn" @tap="goToSettings">
          <u-icon name="setting" size="22"></u-icon>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-container">
      <view class="stat-item" @tap="goToTasks('processing')">
        <text class="stat-label">待处理</text>
        <text class="stat-value primary">{{ formatNumber(stats.processingCount) }}</text>
      </view>
      <view class="stat-item" @tap="goToTasks('completed')">
        <text class="stat-label">今日完工</text>
        <text class="stat-value">{{ formatNumber(stats.todayCompleted) }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">平均好评</text>
        <view class="rating-container">
          <text class="stat-value rating">{{ formatRating(stats.averageRating) }}</text>
          <u-icon name="star-fill" size="14" color="#FF9500"></u-icon>
        </view>
      </view>
    </view>

    <!-- Tab 切换 -->
    <view class="tab-container">
      <view class="tab-item" :class="{ active: activeTab === 'pool' }" @tap="switchTab('pool')">
        <text>待接单池</text>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'my' }" @tap="switchTab('my')">
        <text>我的任务</text>
      </view>
    </view>

    <!-- 待接单池内容 -->
    <view v-if="activeTab === 'pool'" class="content-container">
      <!-- 紧急任务 -->
      <view v-if="urgentTicket" class="urgent-section">
        <view class="section-header urgent">
          <view class="urgent-indicator">
            <view class="dot"></view>
            <text class="urgent-text">紧急任务</text>
          </view>
          <text class="time-text">刚刚发布</text>
        </view>
        <view class="urgent-card" @tap="goToDetail(urgentTicket.id)">
          <view class="ticket-tag urgent-tag">
            <text class="tag-text">#{{ urgentTicket.ticketNumber }}</text>
          </view>
          <text class="ticket-title">{{ urgentTicket.title }}</text>
          <view class="ticket-location">
            <u-icon name="map" size="16" color="#8E8E93"></u-icon>
            <text>{{ urgentTicket.location || '未指定位置' }}</text>
          </view>
          <view class="grab-btn">
            <text>立即抢单</text>
          </view>
        </view>
      </view>

      <!-- 常规任务列表 -->
      <view class="normal-tasks">
        <!-- <text class="list-title">常规任务 ({{ normalTickets.length }})</text> -->
        <view v-if="normalTickets.length > 0" class="task-list">
          <view v-for="ticket in normalTickets" :key="ticket.id" class="task-card" @tap="goToDetail(ticket.id)">
            <view class="task-header">
              <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
              <text class="ticket-time">{{ formatTime(ticket.createdAt) }}</text>
            </view>
            <text class="task-title">{{ ticket.title }}</text>
            <view class="task-footer">
              <view class="task-distance">
                <u-icon name="map" size="12" color="#8E8E93"></u-icon>
                <text>距离 {{ getRandomDistance() }}</text>
              </view>
              <view class="detail-btn">
                <text>查看详情</text>
              </view>
            </view>
          </view>
        </view>
        <u-empty v-else mode="list" text="暂无待接工单" icon="list" />
      </view>
    </view>

    <!-- 我的任务内容 -->
    <view v-else class="content-container">
      <view v-if="processingTickets.length > 0" class="task-list">
        <view v-for="ticket in processingTickets" :key="ticket.id" class="task-card processing"
          @tap="goToDetail(ticket.id)">
          <view class="task-header">
            <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
            <view class="status-badge processing">
              <text>处理中</text>
            </view>
          </view>
          <text class="task-title">{{ ticket.title }}</text>
          <view class="task-footer">
            <view class="task-meta">
              <u-icon name="clock" size="14" color="#8E8E93"></u-icon>
              <text>{{ formatTime(ticket.createdAt) }}</text>
            </view>
            <view class="detail-btn">
              <text>查看详情</text>
            </view>
          </view>
        </view>
      </view>
      <u-empty v-else mode="list" text="暂无处理中工单" icon="list" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '@/store';
import * as statisticsApi from '@/api/statistics';
import * as authApi from '@/api/auth';
import type { Ticket } from '@/api/types';

const userStore = useUserStore();

// 统计数据
const stats = ref({
  waitAcceptCount: 0,
  processingCount: 0,
  totalCompleted: 0,
  todayCompleted: 0,
  averageRating: 0,
});

// 待接单池工单
const poolTickets = ref<Ticket[]>([]);

// 处理中工单列表
const processingTickets = ref<Ticket[]>([]);

// 当前激活的 Tab
const activeTab = ref<'pool' | 'my'>('pool');

// 部门名称
const departmentName = computed(() => {
  return userStore.userInfo?.department?.name || '未设置部门';
});

// 真实姓名
const realName = computed(() => {
  const name = userStore.userInfo?.realName || '';
  if (name) return name;
  return userStore.userInfo?.wxNickname || userStore.userInfo?.username || '未设置';
});

// 紧急任务（优先级高的）
const urgentTicket = computed(() => {
  return poolTickets.value.find(t => t.priority === 'URGENT');
});

// 常规任务
const normalTickets = computed(() => {
  return poolTickets.value.filter(t => t.priority !== 'URGENT');
});

/**
 * 格式化数字，补零
 */
function formatNumber(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * 格式化评分
 */
function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * 格式化时间
 */
function formatTime(dateStr: string): string {
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

/**
 * 获取随机距离（演示用）
 */
function getRandomDistance(): string {
  const distances = ['150m', '400m', '800m', '1.2km', '2km'];
  return distances[Math.floor(Math.random() * distances.length)];
}

/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    const data = await statisticsApi.getHandlerStats(userStore.userInfo!.id);
    stats.value = data;
    processingTickets.value = data.processingTickets || [];
  } catch (error) {
    console.error('加载统计数据失败', error);
  }
}

/**
 * 加载待接单池工单
 */
async function loadPoolTickets() {
  try {
    // 这里需要调用获取待接单池工单的 API
    // 暂时使用空数组，后续需要实现
    poolTickets.value = [];
  } catch (error) {
    console.error('加载待接单池失败', error);
  }
}

/**
 * 刷新用户信息
 */
async function refreshUserInfo() {
  try {
    const user = await authApi.getCurrentUser();
    userStore.setUserInfo(user);
  } catch (error) {
    console.error('刷新用户信息失败', error);
  }
}

/**
 * 切换 Tab
 */
function switchTab(tab: 'pool' | 'my') {
  activeTab.value = tab;
  if (tab === 'pool') {
    loadPoolTickets();
  }
}

/**
 * 跳转通知页面
 */
function goToNotifications() {
  uni.showToast({ title: '通知功能开发中', icon: 'none' });
}

/**
 * 跳转设置页面
 */
function goToSettings() {
  uni.navigateTo({ url: '/pages/common/profile/index' });
}

/**
 * 跳转接单池
 */
function goToTaskPool() {
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

onMounted(() => {
  refreshUserInfo();
  loadStats();
  loadPoolTickets();
});

onShow(() => {
  uni.hideHomeButton();
  loadStats();
  if (activeTab.value === 'pool') {
    loadPoolTickets();
  }

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

.rating-container {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-value.rating {
  color: #FF9500;
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

/* 紧急任务 */
.urgent-section {
  margin-bottom: 48rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.urgent-indicator {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF3B30;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.urgent-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #FF3B30;
  letter-spacing: 2rpx;
}

.time-text {
  font-size: 22rpx;
  color: #AEAEB2;
}

.urgent-card {
  background: #FFFFFF;
  border-left: 8rpx solid #FF3B30;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.ticket-tag {
  align-self: flex-start;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.urgent-tag {
  background: rgba(255, 59, 48, 0.1);
}

.tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #FF3B30;
}

.ticket-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1C1C1E;
}

.ticket-location {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 28rpx;
  color: #8E8E93;
}

.grab-btn {
  background: #FF3B30;
  color: #FFFFFF;
  text-align: center;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  margin-top: 8rpx;
}

/* 常规任务列表 */
.normal-tasks {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.list-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #AEAEB2;
  padding-left: 8rpx;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.task-card {
  background: #FFFFFF;
  border: 2rpx solid #F2F2F7;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
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

.ticket-time {
  font-size: 22rpx;
  color: #AEAEB2;
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

.task-distance,
.task-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #8E8E93;
}


.detail-btn {
  padding: 12rpx 40rpx;
  background: #F2F2F7;
  border-radius: 40rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #1C1C1E;
}

/* 处理中工单样式 */
.task-card.processing {
  border-left: 8rpx solid #FF9500;
}

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-badge.processing {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}
</style>
