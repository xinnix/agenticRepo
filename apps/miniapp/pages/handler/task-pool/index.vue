<template>
  <PageLayout>
    <view class="min-h-screen bg-page flex flex-col">
      <!-- 极简筛选栏 -->
      <view class="px-xl py-md border-b">
        <view class="flex gap-md">
          <picker mode="selector" :range="categories" range-key="name" @change="onCategoryChange">
            <view :class="['filter-item', { active: filter.categoryId }]">
              <text class="filter-text">{{ selectedCategory }}</text>
            </view>
          </picker>

          <picker mode="selector" :range="priorities" range-key="label" @change="onPriorityChange">
            <view :class="['filter-item', { active: filter.priority }]">
              <text class="filter-text">{{ selectedPriority }}</text>
            </view>
          </picker>
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
          text="暂无待接工单"
        />

        <!-- 极简工单列表 -->
        <view
          v-for="(ticket, index) in ticketList"
          :key="ticket.id"
          :class="['ticket-list-item animate-fade-in-up', { 'pl-xl pr-xl': true }]"
          :style="{ animationDelay: `${(index % 5) * 0.05}s` }"
        >
          <!-- 内容区域 -->
          <view @tap="goToDetail(ticket.id)">
            <!-- 优先级行 -->
            <view class="ticket-status mb-sm">
              <view class="flex items-center gap-xs">
                <view class="priority-dot" :class="ticket.priority === 'URGENT' ? 'urgent' : ''"></view>
                <text class="ticket-number">{{ ticket.ticketNumber }}</text>
              </view>
              <view :class="['priority-badge', getPriorityClass(ticket.priority)]">
                {{ getPriorityText(ticket.priority) }}
              </view>
            </view>

            <!-- 标题和描述 -->
            <text class="ticket-title mb-sm">{{ ticket.title }}</text>
            <text class="ticket-description mb-md">{{ ticket.description }}</text>

            <!-- 附件预览 -->
            <view v-if="ticket.attachments && ticket.attachments.length > 0" class="flex gap-sm mb-md">
              <view
                v-for="(img, i) in ticket.attachments.slice(0, 3)"
                :key="i"
                class="attachment-preview"
              >
                <image
                  :src="img.url"
                  class="w-full h-full"
                  mode="aspectFill"
                />
              </view>
            </view>

            <!-- 元信息 -->
            <view class="flex gap-lg mb-md">
              <view class="flex items-center gap-xs">
                <text class="meta-icon">◆</text>
                <text class="meta-text">{{ ticket.category?.name }}</text>
              </view>
              <view class="flex items-center gap-xs">
                <text class="meta-icon">◷</text>
                <text class="meta-text">{{ formatTime(ticket.createdAt) }}</text>
              </view>
            </view>
          </view>

          <!-- 接单按钮 -->
          <button class="accept-btn" @tap.stop="handleAccept(ticket.id)">
            立即接单
          </button>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="flex justify-center py-xl">
          <u-loading-icon mode="circle" />
          <text class="ml-sm text-body text-secondary">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ticketList.length > 0" class="flex justify-center py-xl">
          <text class="text-caption text-secondary">没有更多了</text>
        </view>
      </scroll-view>
    </view>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useTabBarStore } from '@/store/modules/tabbar';
import { useTabBarUpdate } from '@/composables/useTabBarUpdate';
import PageLayout from '@/components/PageLayout.vue';
import { useTicketStore } from '@/store';
import { Priority, type Ticket } from '@/api/types';
import * as categoryApi from '@/api/category';

const ticketStore = useTicketStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();

// 筛选条件
const filter = ref({
  categoryId: '',
  priority: '',
});

// 分类列表
const categories = ref([{ id: '', name: '全部分类' }]);
const selectedCategory = ref('全部分类');

// 优先级列表
const priorities = ref([
  { value: '', label: '全部优先级' },
  { value: Priority.NORMAL, label: '普通' },
  { value: Priority.URGENT, label: '紧急' },
]);
const selectedPriority = ref('全部优先级');

// 列表数据
const ticketList = computed(() => ticketStore.ticketList);
const loading = computed(() => ticketStore.loading);
const hasMore = computed(() => ticketStore.hasMore);

/**
 * 加载分类列表
 */
async function loadCategories() {
  try {
    const data = await categoryApi.getCategoryList({ status: 'ACTIVE' });
    categories.value = [
      { id: '', name: '全部分类' },
      ...data,
    ];
  } catch (error) {
    console.error('加载分类失败', error);
  }
}

/**
 * 分类选择
 */
function onCategoryChange(e: any) {
  const index = e.detail.value;
  const category = categories.value[index];
  filter.value.categoryId = category.id;
  selectedCategory.value = category.name;
  refresh();
}

/**
 * 优先级选择
 */
function onPriorityChange(e: any) {
  const index = e.detail.value;
  const priority = priorities.value[index];
  filter.value.priority = priority.value;
  selectedPriority.value = priority.label;
  refresh();
}

/**
 * 加载工单列表
 */
async function loadTickets(refresh = false) {
  const params: any = {
    status: 'WAIT_ACCEPT',
  };

  if (filter.value.categoryId) {
    params.categoryId = filter.value.categoryId;
  }

  if (filter.value.priority) {
    params.priority = filter.value.priority;
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
 * 接单
 */
async function handleAccept(id: string) {
  uni.showModal({
    title: '确认接单',
    content: '确定要接单吗？接单后需要及时处理。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await ticketStore.acceptTicket(id);
          uni.showToast({
            title: '接单成功',
            icon: 'success',
          });
          refresh();
        } catch (error: any) {
          uni.showToast({
            title: error.message || '接单失败',
            icon: 'error',
          });
        }
      }
    },
  });
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
 * 获取优先级文本
 */
function getPriorityText(priority: string): string {
  const priorityTexts: Record<string, string> = {
    'URGENT': '紧急',
    'NORMAL': '普通',
  };
  return priorityTexts[priority] || '普通';
}

/**
 * 获取优先级样式
 */
function getPriorityClass(priority: string): string {
  const priorityClasses: Record<string, string> = {
    'URGENT': 'priority-urgent',
    'NORMAL': 'priority-normal',
  };
  return priorityClasses[priority] || 'priority-normal';
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
  loadCategories();
  loadTickets(true);
});

onShow(() => {
  refresh();
});
</script>

<style scoped>
/* 筛选栏 */
.filter-item {
  flex: 1;
  padding: 16rpx;
  background: var(--bg-subtle);
  text-align: center;
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.filter-item.active {
  background: var(--color-black);
  color: var(--color-white);
}

/* 工单列表项 */
.ticket-list-item {
  padding: 48rpx 32rpx;
  border-bottom: 1rpx solid var(--border);
}

.ticket-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.priority-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background: var(--color-black);
}

.priority-dot.urgent {
  background: var(--color-black);
}

.ticket-number {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
  letter-spacing: 1rpx);
}

.priority-badge {
  font-size: var(--text-tiny);
  letter-spacing: 1rpx;
  text-transform: uppercase;
  padding: 6rpx 12rpx;
  font-weight: 500;
}

.priority-normal {
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.priority-urgent {
  background: var(--color-black);
  color: var(--color-white);
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

.meta-icon {
  font-size: 16rpx;
  color: var(--text-tertiary);
}

.meta-text {
  font-size: var(--text-tiny);
  color: var(--text-tertiary);
}

/* 接单按钮 */
.accept-btn {
  width: 100%;
  padding: 24rpx;
  background: var(--color-black);
  color: var(--color-white);
  font-size: var(--text-body);
  font-weight: 400;
  letter-spacing: 2rpx;
  text-align: center;
  border: none;
}
</style>
