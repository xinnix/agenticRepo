<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page flex flex-col bg-texture-dots">
    <!-- 有机风格分段控件 -->
    <view class="bg-nordic-bg-card p-nordic-6 border-b border-nordic-border-subtle">
      <view class="flex bg-nordic-bg-input rounded-nordic-xl p-1.5">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="flex-1 flex items-center justify-center py-3 rounded-nordic-lg transition-all nordic-button-animate"
          :class="currentTab === tab.key ? 'bg-nordic-bg-card shadow-nordic-sm text-primary font-semibold' : 'text-nordic-text-secondary'"
          @tap="switchTab(tab.key)"
        >
          <text class="text-nordic-sm">{{ tab.label }}</text>
        </view>
      </view>
    </view>

    <!-- 申请成为办事员卡片 -->
    <view class="bg-nordic-bg-card p-nordic-6 pb-0">
      <view class="bg-gradient-warm rounded-nordic-2xl p-nordic-5 flex items-center justify-between nordic-button-animate card-organic" @tap="goToApplyHandler">
        <view class="flex items-center">
          <view class="w-12 h-12 bg-white bg-opacity-20 rounded-nordic-lg flex items-center justify-center mr-3">
            <text class="text-xl text-white">✦</text>
          </view>
          <view>
            <text class="text-nordic-base font-semibold text-white block">申请成为办事员</text>
            <text class="text-nordic-xs text-white text-opacity-80 mt-1">加入我们，提供更好的服务</text>
          </view>
        </view>
        <view class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <text class="text-white text-sm">›</text>
        </view>
      </view>
    </view>

    <!-- 工单列表 -->
    <scroll-view
      class="flex-1 p-nordic-6"
      scroll-y
      @scrolltolower="loadMore"
    >
      <!-- 空状态 -->
      <u-empty
        v-if="ticketList.length === 0 && !loading"
        mode="list"
        text="暂无工单"
      />

      <!-- 工单卡片 - 有机现代风格 -->
      <view
        v-for="(ticket, index) in ticketList"
        :key="ticket.id"
        class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-5 mb-nordic-5 nordic-card-hover relative card-organic animate-fade-in-up"
        :style="{ animationDelay: `${(index % 5) * 0.05}s` }"
        @tap="goToDetail(ticket.id)"
      >
        <!-- 卡片头部 -->
        <view class="flex justify-between items-center mb-nordic-3">
          <view class="flex items-center gap-2">
            <view class="w-1 h-4 rounded-full" :class="getStatusDotColor(ticket.status)"></view>
            <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
          </view>
          <view class="nordic-tag" :class="getStatusTagClass(ticket.status)">
            {{ getStatusText(ticket.status) }}
          </view>
        </view>

        <!-- 卡片内容 -->
        <view class="mb-nordic-4">
          <text class="block text-nordic-lg font-semibold text-nordic-text-primary mb-nordic-2">{{ ticket.title }}</text>
          <text class="block text-nordic-base text-nordic-text-secondary leading-relaxed line-clamp-2">{{ ticket.description }}</text>

          <!-- 附件预览 -->
          <view v-if="ticket.attachments && ticket.attachments.length > 0" class="flex gap-2 mt-nordic-3">
            <view
              v-for="(img, i) in ticket.attachments.slice(0, 3)"
              :key="i"
              class="relative"
              style="width: 80rpx; height: 80rpx;"
            >
              <image
                :src="img.url"
                class="w-full h-full rounded-nordic-md"
                mode="aspectFill"
              />
              <view class="absolute inset-0 bg-nordic-text-primary opacity-0 rounded-nordic-md transition-opacity"></view>
            </view>
            <view
              v-if="ticket.attachments.length > 3"
              class="w-20 h-20 flex items-center justify-center bg-nordic-bg-input rounded-nordic-md border border-nordic-border-subtle"
            >
              <text class="text-nordic-xs text-nordic-text-tertiary font-medium">+{{ ticket.attachments.length - 3 }}</text>
            </view>
          </view>
        </view>

        <!-- 卡片底部 -->
        <view class="flex gap-6">
          <view class="flex items-center gap-2">
            <view class="w-5 h-5 flex items-center justify-center">
              <text class="text-nordic-sm text-nordic-accent-sage">◆</text>
            </view>
            <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.category?.name }}</text>
          </view>
          <view class="flex items-center gap-2">
            <view class="w-5 h-5 flex items-center justify-center">
              <text class="text-nordic-sm text-nordic-accent-sand">◷</text>
            </view>
            <text class="text-nordic-xs text-nordic-text-tertiary">{{ formatDate(ticket.createdAt) }}</text>
          </view>
        </view>

        <!-- 优先级标记 -->
        <view
          v-if="ticket.priority === 'URGENT'"
          class="absolute top-nordic-4 right-nordic-4 px-2 py-1 bg-nordic-error bg-opacity-10 rounded-nordic-sm"
        >
          <text class="text-nordic-xs text-nordic-error font-medium">紧急</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loading" class="flex justify-center py-nordic-4">
        <u-loading-icon mode="circle" />
        <text class="ml-nordic-2 text-nordic-base text-nordic-text-secondary">加载中...</text>
      </view>

      <!-- 没有更多 -->
      <view v-if="!hasMore && ticketList.length > 0" class="flex justify-center py-nordic-4">
        <text class="text-nordic-base text-nordic-text-secondary">没有更多了</text>
      </view>
    </scroll-view>

    <!-- 有机风格悬浮按钮 -->
    <view
      class="fixed right-10 bottom-28 w-28 h-28 bg-primary rounded-full flex items-center justify-center shadow-nordic-xl nordic-button-animate card-organic"
      @tap="goToSubmit"
    >
      <text class="text-5xl text-nordic-bg-card font-light">+</text>
    </view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTicketStore } from '@/store';
import { useTabBarStore } from '@/store/modules/tabbar';
import PageLayout from '@/components/PageLayout.vue';
import { TicketStatus, type Ticket } from '@/api/types';
import { getStatusText, getStatusTagType } from '@/utils/tag-helpers';

const ticketStore = useTicketStore();
const tabBarStore = useTabBarStore();

// 标签页
const tabs = [
  { key: 'all', label: '全部' },
  { key: String(TicketStatus.WAIT_ASSIGN), label: '待指派' },
  { key: String(TicketStatus.PROCESSING), label: '处理中' },
  { key: String(TicketStatus.COMPLETED), label: '待评价' },
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
 * 页面显示时初始化TabBar状态
 */
onShow(() => {
  // 设置当前Tab为'my-tickets'
  tabBarStore.setActiveTab('my-tickets');
});

/**
 * 页面挂载时初始化数据
 */
onMounted(() => {
  // 页面挂载时刷新数据
  refresh();
});

/**
 * 获取状态圆点颜色
 */
function getStatusDotColor(status: string): string {
  const dotColors: Record<string, string> = {
    'WAIT_ASSIGN': 'bg-nordic-accent-sand',
    'WAIT_ACCEPT': 'bg-nordic-accent-sky',
    'PROCESSING': 'bg-nordic-accent-sage',
    'COMPLETED': 'bg-nordic-success',
    'CLOSED': 'bg-nordic-text-tertiary',
  };
  return dotColors[status] || 'bg-nordic-text-tertiary';
}

/**
 * 获取状态标签样式
 */
function getStatusTagClass(status: string): string {
  const tagClasses: Record<string, string> = {
    'WAIT_ASSIGN': 'nordic-tag-warning',
    'WAIT_ACCEPT': 'nordic-tag-info',
    'PROCESSING': 'nordic-tag-sage',
    'COMPLETED': 'nordic-tag-success',
    'CLOSED': 'nordic-tag-outline',
  };
  return tagClasses[status] || 'nordic-tag-outline';
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

onMounted(() => {
  loadTickets(true);
});

// 页面显示时刷新
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
