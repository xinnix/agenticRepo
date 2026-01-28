<template>
  <PageLayout>
    <view class="min-h-screen bg-page flex flex-col">
      <!-- 极简分段控件 -->
      <view class="px-xl py-md border-b">
        <u-tabs
          :list="tabs"
          :current="currentTabIndex"
          @change="onTabChange"
          :line-color="'#000000'"
          :active-style="{ color: '#000000', fontWeight: '600' }"
          :inactive-style="{ color: '#5A5650' }"
          :item-style="{ padding: '16rpx 0' }"
        />
      </view>

      <!-- 申请成为办事员卡片 - 极简风格 -->
      <view class="px-xl py-md border-b">
        <view class="apply-card" @tap="goToApplyHandler">
          <view class="flex items-center justify-between w-full">
            <view class="flex items-center gap-md">
              <u-icon name="star" class="apply-icon"></u-icon>
              <view>
                <u-text class="apply-title" text="申请成为办事员"></u-text>
                <u-text class="apply-subtitle" text="加入我们，提供更好的服务"></u-text>
              </view>
            </view>
            <u-icon name="arrow-right" class="apply-arrow"></u-icon>
          </view>
        </view>
      </view>

      <!-- 工单列表 -->
      <scroll-view
        class="flex-1"
        scroll-y
        @scrolltolower="loadMore"
      >
        <!-- 空状态 -->
        <u-empty
          v-if="ticketList.length === 0 && !loading"
          mode="list"
          text="暂无工单"
        />

        <!-- 极简工单列表 -->
        <u-cell-group :border="false">
          <u-cell
            v-for="(ticket, index) in ticketList"
            :key="ticket.id"
            @click="goToDetail(ticket.id)"
            :border="true"
            :title="ticket.title"
            :label="ticket.description"
          >
            <template #icon>
              <u-tag
                :text="getStatusText(ticket.status)"
                :type="getStatusTagType(ticket.status)"
                size="mini"
                plain
              />
            </template>
            <template #value>
              <u-text :text="formatDate(ticket.createdAt)" class="text-tiny"></u-text>
            </template>
          </u-cell>
        </u-cell-group>

        <!-- 加载更多 -->
        <view v-if="loading" class="flex justify-center py-xl">
          <u-loading-icon mode="circle" />
          <u-text class="ml-sm text-body text-secondary" text="加载中..."></u-text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ticketList.length > 0" class="flex justify-center py-xl">
          <u-text class="text-caption text-secondary" text="没有更多了"></u-text>
        </view>
      </scroll-view>

      <!-- 极简悬浮按钮 -->
      <u-fab
        @click="goToSubmit"
        :icon="'plus'"
        :text="'提交'"
      />
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTicketStore } from '@/store';
import PageLayout from '@/components/PageLayout.vue';
import { TicketStatus, type Ticket } from '@/api/types';

const ticketStore = useTicketStore();

// 标签页 - u-tabs 需要使用这种格式
const tabs = [
  { key: 'all', label: '全部' },
  { key: String(TicketStatus.WAIT_ASSIGN), label: '待指派' },
  { key: String(TicketStatus.PROCESSING), label: '处理中' },
  { key: String(TicketStatus.COMPLETED), label: '待评价' },
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
function onTabChange(e: any) {
  const index = e.index || e;
  currentTabIndex.value = index;
  currentTab.value = tabs[index].key;
  refresh();
}

/**
 * 切换标签（旧方法保留兼容）
 */
function switchTab(tab: string) {
  const index = tabs.findIndex(t => t.key === tab);
  if (index !== -1) {
    onTabChange({ index });
  }
}

/**
 * 加载工单列表
 */
async function loadTickets(refresh = false) {
  const params: any = {};

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
    url: `/pages/user/ticket-detail/index?id=${id}`,
  });
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
 * 跳转到申请办事员页面
 */
function goToApplyHandler() {
  uni.navigateTo({
    url: '/pages/user/apply-handler/index',
  });
}

/**
 * 页面挂载时初始化数据
 */
onMounted(() => {
  refresh();
});

/**
 * 获取状态徽章样式
 */
function getStatusBadgeClass(status: string): string {
  const badgeClasses: Record<string, string> = {
    'WAIT_ASSIGN': 'status-wait-assign',
    'WAIT_ACCEPT': 'status-wait-accept',
    'PROCESSING': 'status-processing',
    'COMPLETED': 'status-completed',
    'CLOSED': 'status-closed',
  };
  return badgeClasses[status] || 'status-closed';
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    'WAIT_ASSIGN': '待指派',
    'WAIT_ACCEPT': '待接单',
    'PROCESSING': '处理中',
    'COMPLETED': '已完成',
    'CLOSED': '已关闭',
  };
  return statusTexts[status] || '未知';
}

/**
 * 获取状态标签类型（用于 u-tag）
 */
function getStatusTagType(status: string): string {
  const tagTypes: Record<string, string> = {
    'WAIT_ASSIGN': 'info',
    'WAIT_ACCEPT': 'primary',
    'PROCESSING': 'warning',
    'COMPLETED': 'success',
    'CLOSED': 'default',
  };
  return tagTypes[status] || 'default';
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  // 小于7天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  // 格式化为 MM-DD
  return `${date.getMonth() + 1}-${date.getDate()}`;
}
</script>

<style scoped>
/* 分段控件 */
.tab-container {
  display: flex;
  background: var(--bg-subtle);
  padding: 4rpx;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
}

.tab-item.active .tab-text {
  font-weight: 600;
  color: var(--color-black);
}

.tab-text {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

/* 申请卡片 */
.apply-card {
  background: var(--color-black);
  color: var(--color-white);
  padding: 32rpx;
}

.apply-icon {
  font-size: 32rpx;
}

.apply-title {
  display: block;
  font-size: var(--text-body);
  font-weight: 500;
}

.apply-subtitle {
  display: block;
  font-size: var(--text-tiny);
  opacity: 0.8;
  margin-top: 4rpx;
}

.apply-arrow {
  font-size: 32rpx;
}

/* 工单列表项 */
.ticket-list-item {
  padding: 48rpx 0;
  border-bottom: 1rpx solid var(--border);
  position: relative;
}

.ticket-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: var(--color-black);
}

.ticket-number {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  letter-spacing: 1rpx;
}

.status-badge {
  font-size: var(--text-tiny);
  letter-spacing: 1rpx;
  text-transform: uppercase;
  padding: 6rpx 12rpx;
  font-weight: 500;
}

.status-wait-assign {
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.status-wait-accept {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.status-processing {
  background: var(--bg-card);
  color: var(--color-black);
  border: 1rpx solid var(--border);
  font-weight: 600;
}

.status-completed {
  background: var(--color-black);
  color: var(--color-white);
}

.status-closed {
  background: var(--bg-subtle);
  color: var(--text-tertiary);
}

.ticket-title {
  display: block;
  font-size: var(--text-title);
  font-weight: 500;
  color: var(--text-primary);
}

.ticket-description {
  display: block;
  font-size: var(--text-body);
  color: var(--text-secondary);
  line-height: 1.6;
}

.attachment-preview {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.attachment-more {
  width: 80rpx;
  height: 80rpx;
  background: var(--bg-subtle);
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
}

.meta-icon {
  font-size: 16rpx;
  color: var(--text-tertiary);
}

.meta-text {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
}

.priority-mark {
  position: absolute;
  top: 16rpx;
  right: 32rpx;
  background: var(--color-black);
  color: var(--color-white);
  padding: 4rpx 8rpx;
}

/* 悬浮按钮 */
.floating-btn {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 112rpx;
  height: 112rpx;
  background: var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-btn-icon {
  font-size: 48rpx;
  color: var(--color-white);
  font-weight: 200;
  line-height: 1;
}
</style>
