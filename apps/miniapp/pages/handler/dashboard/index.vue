<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page p-nordic-6">
      <!-- 北欧风格用户信息卡片 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6 flex items-center gap-6">
        <image class="w-25 h-25 rounded-full border-4" style="border-color: rgba(123, 158, 168, 0.2)"
          :src="userStore.avatar" />
        <view class="flex-1 flex flex-col">
          <text class="text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-2">{{ userStore.displayName
            }}</text>
          <text class="text-nordic-base text-nordic-text-secondary">{{ roleName }}</text>
        </view>
      </view>

      <!-- 北欧风格统计卡片 -->
      <view class="grid grid-cols-2 gap-nordic-3 mb-nordic-6">
        <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 relative nordic-card-hover"
          @tap="goToTasks('pending')">
          <text class="block text-5xl font-bold text-nordic-text-primary mb-nordic-2">{{ stats.pendingCount || 0
            }}</text>
          <text class="block text-nordic-base text-nordic-text-secondary mb-nordic-4">待处理</text>
          <view
            class="absolute top-nordic-4 right-nordic-4 px-nordic-3 py-1 rounded-full text-nordic-xs font-medium bg-nordic-accent-rose text-nordic-bg-card">
            待接单
          </view>
        </view>

        <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 relative nordic-card-hover"
          @tap="goToTasks('processing')">
          <text class="block text-5xl font-bold text-nordic-text-primary mb-nordic-2">{{ stats.processingCount || 0
            }}</text>
          <text class="block text-nordic-base text-nordic-text-secondary mb-nordic-4">处理中</text>
          <view
            class="absolute top-nordic-4 right-nordic-4 px-nordic-3 py-1 rounded-full text-nordic-xs font-medium bg-primary text-nordic-bg-card">
            进行中
          </view>
        </view>

        <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 relative nordic-card-hover"
          @tap="goToTasks('completed')">
          <text class="block text-5xl font-bold text-nordic-text-primary mb-nordic-2">{{ stats.todayCompleted || 0
            }}</text>
          <text class="block text-nordic-base text-nordic-text-secondary mb-nordic-4">今日完工</text>
          <view
            class="absolute top-nordic-4 right-nordic-4 px-nordic-3 py-1 rounded-full text-nordic-xs font-medium bg-nordic-accent-sage text-nordic-bg-card">
            已完成
          </view>
        </view>

        <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 relative">
          <text class="block text-5xl font-bold text-nordic-text-primary mb-nordic-2">{{ stats.averageRating?.toFixed(1)
            || '0.0' }}</text>
          <text class="block text-nordic-base text-nordic-text-secondary mb-nordic-4">平均评分</text>
          <view
            class="absolute top-nordic-4 right-nordic-4 px-nordic-3 py-1 rounded-full text-nordic-xs font-medium bg-nordic-accent-sand text-nordic-bg-card">
            ⭐
          </view>
        </view>
      </view>

      <!-- 北欧风格快捷操作 -->
      <view class="flex gap-nordic-3 mb-nordic-6">
        <view
          class="flex-1 bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 flex flex-col items-center gap-nordic-3 nordic-card-hover"
          @tap="goToPool">
          <text class="text-5xl">📋</text>
          <text class="text-nordic-base text-nordic-text-primary">待接单池</text>
        </view>

        <view
          class="flex-1 bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 flex flex-col items-center gap-nordic-3 nordic-card-hover"
          @tap="goToTasks('all')">
          <text class="text-5xl">📝</text>
          <text class="text-nordic-base text-nordic-text-primary">我的任务</text>
        </view>
      </view>

      <!-- 北欧风格最近工单 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6">
        <view class="flex justify-between items-center mb-nordic-4">
          <text class="text-nordic-h3 font-medium text-nordic-text-primary">最近工单</text>
          <text class="text-nordic-base text-primary" @tap="goToTasks('all')">查看全部 →</text>
        </view>

        <scroll-view class="max-h-150" scroll-y v-if="recentTickets.length > 0">
          <view v-for="ticket in recentTickets" :key="ticket.id" class="py-nordic-4 border-b border-nordic-border"
            @tap="goToDetail(ticket.id)">
            <view class="flex justify-between items-center mb-nordic-3">
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
              <view class="px-nordic-3 py-1 rounded-full text-nordic-xs font-medium nordic-tag"
                :class="statusTagClass(ticket.status)">
                {{ TICKET_STATUS_TEXT[ticket.status] }}
              </view>
            </view>
            <text class="block text-nordic-base text-nordic-text-primary mb-nordic-2">{{ ticket.title }}</text>
            <text class="text-nordic-xs text-nordic-text-tertiary">{{ formatTime(ticket.createdAt) }}</text>
          </view>
        </scroll-view>

        <view v-else class="nordic-empty">
          <text class="text-6xl mb-nordic-3">📭</text>
          <text class="text-nordic-base text-nordic-text-secondary">暂无工单</text>
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
import { TICKET_STATUS_TEXT, TicketStatus, type Ticket } from '@/api/types';

const userStore = useUserStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();;
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

// 状态标签样式 - 北欧风格
function statusTagClass(status: string) {
  const statusMap: Record<string, string> = {
    'WAIT_ACCEPT': 'nordic-tag-primary',
    'PROCESSING': 'nordic-tag-primary',
    'COMPLETED': 'nordic-tag-success',
  };
  return statusMap[status] || 'bg-nordic-bg-input text-nordic-text-tertiary';
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
