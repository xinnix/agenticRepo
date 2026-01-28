<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page flex flex-col">
      <!-- 北欧风格分段控件 -->
      <view class="bg-nordic-bg-card p-nordic-6">
        <u-subsection
          :list="tabs.map(t => ({ name: t.label }))"
          :current="currentTabIndex"
          @change="onTabChange"
          :active-color="'#667eea'"
          :inactive-color="'#8E8E93'"
        />
      </view>

      <!-- 工单列表 -->
      <scroll-view class="flex-1 p-nordic-6" scroll-y @scrolltolower="loadMore">
        <!-- 空状态 -->
        <u-empty
          v-if="ticketList.length === 0 && !loading"
          mode="list"
          text="暂无任务"
        />

        <!-- 工单卡片 - 北欧风格 -->
        <u-card
          v-for="ticket in ticketList"
          :key="ticket.id"
          :title="ticket.ticketNumber"
          :full="true"
          :thumb="'https://uviewui.com/common/logo.png'"
          class="mb-nordic-6"
          @click="goToDetail(ticket.id)"
        >
          <template #title>
            <view class="flex justify-between items-center mb-nordic-3">
              <u-text class="text-nordic-xs text-nordic-text-tertiary" :text="ticket.ticketNumber"></u-text>
              <u-tag
                :text="getStatusText(ticket.status)"
                :type="getStatusTagType(ticket.status)"
                size="mini"
                plain
              />
            </view>
          </template>
          <template #body>
            <view class="mb-nordic-4">
              <u-text class="block text-nordic-lg font-medium text-nordic-text-primary mb-nordic-2" :text="ticket.title"></u-text>
              <u-text class="block text-nordic-base text-nordic-text-secondary leading-relaxed line-clamp-2" :text="ticket.description"></u-text>

              <!-- 附件预览 -->
              <scroll-view v-if="ticket.attachments && ticket.attachments.length > 0" class="flex gap-nordic-2 mt-nordic-3" scroll-x>
                <u-image
                  v-for="(img, i) in ticket.attachments.slice(0, 3)"
                  :key="i"
                  :src="img.url"
                  width="80rpx"
                  height="80rpx"
                  :radius="8"
                />
              </scroll-view>
            </view>

            <!-- 卡片底部 -->
            <view class="flex flex-wrap gap-nordic-2">
              <view class="flex items-center gap-2">
                <u-icon name="folder" size="14" class="text-nordic-base"></u-icon>
                <u-text class="text-nordic-xs text-nordic-text-tertiary" :text="ticket.category?.name"></u-text>
              </view>
              <view class="flex items-center gap-2">
                <u-icon name="account" size="14" class="text-nordic-base"></u-icon>
                <u-text class="text-nordic-xs text-nordic-text-tertiary" :text="ticket.createdBy.wxNickname || ticket.createdBy.username"></u-text>
              </view>
              <view class="flex items-center gap-2">
                <u-icon name="clock" size="14" class="text-nordic-base"></u-icon>
                <u-text class="text-nordic-xs text-nordic-text-tertiary" :text="formatTime(ticket.createdAt)"></u-text>
              </view>
            </view>

            <!-- 优先级标记 -->
            <u-tag
              v-if="ticket.priority === 'URGENT'"
              text="紧急"
              type="error"
              size="mini"
              class="absolute top-nordic-4 right-nordic-4"
            />
          </template>
        </u-card>

        <!-- 加载状态 -->
        <view v-if="loading" class="flex justify-center py-nordic-4">
          <u-loading-icon mode="circle" />
          <u-text class="ml-nordic-2 text-nordic-base text-nordic-text-secondary" text="加载中..."></u-text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ticketList.length > 0" class="flex justify-center py-nordic-4">
          <u-text class="text-nordic-base text-nordic-text-secondary" text="没有更多了"></u-text>
        </view>
      </scroll-view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import PageLayout from '@/components/PageLayout.vue';
import { useTicketStore, useUserStore } from '@/store';
import { TicketStatus, type Ticket } from '@/api/types';
import { getStatusText, getStatusTagType } from '@/utils/tag-helpers';

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
 * 标签切换（用于 u-subsection）
 */
function onTabChange(e: any) {
  const index = e.index || e;
  currentTabIndex.value = index;
  currentTab.value = tabs[index].key;
  refresh();
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
