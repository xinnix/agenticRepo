<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page flex flex-col">
      <!-- 北欧风格分段控件 -->
      <view class="bg-nordic-bg-card p-nordic-6">
        <view class="flex bg-nordic-bg-input rounded-nordic-lg p-1">
          <view v-for="tab in tabs" :key="tab.key"
            class="flex-1 flex items-center justify-center py-2 rounded-nordic-sm transition-all nordic-button-animate"
            :class="currentTab === tab.key ? 'bg-nordic-bg-card shadow-nordic-sm text-primary' : 'text-nordic-text-secondary'"
            @tap="switchTab(tab.key)">
            <text class="font-medium text-nordic-sm">{{ tab.label }}</text>
          </view>
        </view>
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
        <view v-for="ticket in ticketList" :key="ticket.id"
          class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6 nordic-card-hover relative"
          @tap="goToDetail(ticket.id)">
          <!-- 卡片头部 -->
          <view class="flex justify-between items-center mb-nordic-3">
            <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
            <u-tag
              :text="getStatusText(ticket.status)"
              :type="getStatusTagType(ticket.status)"
              size="mini"
              plain
            />
          </view>

          <!-- 卡片内容 -->
          <view class="mb-nordic-4">
            <text class="block text-nordic-lg font-medium text-nordic-text-primary mb-nordic-2">{{ ticket.title
              }}</text>
            <text class="block text-nordic-base text-nordic-text-secondary leading-relaxed line-clamp-2">{{
              ticket.description }}</text>

            <!-- 附件预览 -->
            <view v-if="ticket.attachments && ticket.attachments.length > 0" class="flex gap-nordic-2 mt-nordic-3">
              <image v-for="(img, i) in ticket.attachments.slice(0, 3)" :key="i" :src="img.url"
                class="w-20 h-20 rounded-nordic-sm" mode="aspectFill" />
            </view>
          </view>

          <!-- 卡片底部 -->
          <view class="flex flex-wrap gap-nordic-2">
            <view class="flex items-center gap-2">
              <text class="text-nordic-base">📁</text>
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.category?.name }}</text>
            </view>
            <view class="flex items-center gap-2">
              <text class="text-nordic-base">👤</text>
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.createdBy.wxNickname ||
                ticket.createdBy.username }}</text>
            </view>
            <view class="flex items-center gap-2">
              <text class="text-nordic-base">⏰</text>
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ formatTime(ticket.createdAt) }}</text>
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
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="flex justify-center py-nordic-4">
          <u-loading-icon mode="circle" />
          <text class="ml-nordic-2 text-nordic-base text-nordic-text-secondary">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ticketList.length > 0" class="flex justify-center py-nordic-4">
          <text class="text-nordic-base text-nordic-text-secondary">没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTabBarStore } from '@/store/modules/tabbar';
import { useTabBarUpdate } from '@/composables/useTabBarUpdate';
import PageLayout from '@/components/PageLayout.vue';
import { onShow } from '@dcloudio/uni-app';
import { useTicketStore, useUserStore } from '@/store';
import { TicketStatus, type Ticket } from '@/api/types';
import { getStatusText, getStatusTagType } from '@/utils/tag-helpers';

const ticketStore = useTicketStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();;
const userStore = useUserStore();

// 标签页
const tabs = [
  { key: 'all', label: '全部' },
  { key: String(TicketStatus.WAIT_ACCEPT), label: '待接单' },
  { key: String(TicketStatus.PROCESSING), label: '处理中' },
  { key: String(TicketStatus.COMPLETED), label: '已完成' },
];
const currentTab = ref('all');

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
 * 加载工单列表
 */
async function loadTickets(refresh = false) {
  const params: any = {
    assignedId: userStore.userInfo!.id,
  };

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
