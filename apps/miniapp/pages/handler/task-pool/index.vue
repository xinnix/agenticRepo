<template>
  <PageLayout>
    <view class="min-h-screen bg-nordic-bg-page flex flex-col bg-texture-dots">
      <!-- 有机风格筛选栏 -->
      <view class="bg-nordic-bg-card p-nordic-6 flex gap-nordic-3 border-b border-nordic-border-subtle">
        <picker mode="selector" :range="categories" range-key="name" @change="onCategoryChange">
          <view class="flex-1 h-16 bg-nordic-bg-input rounded-nordic-lg flex items-center justify-center nordic-button-animate"
            :class="filter.categoryId ? 'bg-primary-bg text-primary border border-nordic-border' : ''">
            <text class="text-nordic-base">{{ selectedCategory }}</text>
          </view>
        </picker>

        <picker mode="selector" :range="priorities" range-key="label" @change="onPriorityChange">
          <view class="flex-1 h-16 bg-nordic-bg-input rounded-nordic-lg flex items-center justify-center nordic-button-animate"
            :class="filter.priority ? 'bg-primary-bg text-primary border border-nordic-border' : ''">
            <text class="text-nordic-base">{{ selectedPriority }}</text>
          </view>
        </picker>
      </view>

      <!-- 工单列表 -->
      <scroll-view class="flex-1 p-nordic-6" scroll-y @scrolltolower="loadMore">
        <!-- 空状态 -->
        <u-empty
          v-if="ticketList.length === 0 && !loading"
          mode="list"
          text="暂无待接工单"
        />

        <!-- 工单卡片 - 有机现代风格 -->
        <view v-for="(ticket, index) in ticketList" :key="ticket.id"
          class="bg-nordic-bg-card rounded-nordic-2xl shadow-nordic-md p-nordic-5 mb-nordic-5 nordic-card-hover card-organic animate-fade-in-up"
          :style="{ animationDelay: `${(index % 5) * 0.05}s` }">
          <!-- 卡片头部 -->
          <view class="flex justify-between items-center mb-nordic-3" @tap="goToDetail(ticket.id)">
            <view class="flex items-center gap-2">
              <view class="w-1 h-4 rounded-full" :class="getPriorityDotColor(ticket.priority)"></view>
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
            </view>
            <view class="nordic-tag" :class="getPriorityTagClass(ticket.priority)">
              {{ getPriorityText(ticket.priority) }}
            </view>
          </view>

          <!-- 卡片内容 -->
          <view class="mb-nordic-4" @tap="goToDetail(ticket.id)">
            <text class="block text-nordic-lg font-semibold text-nordic-text-primary mb-nordic-2">{{ ticket.title
              }}</text>
            <text class="block text-nordic-base text-nordic-text-secondary leading-relaxed line-clamp-2">{{
              ticket.description }}</text>

            <!-- 附件预览 -->
            <view v-if="ticket.attachments && ticket.attachments.length > 0" class="flex gap-2 mt-nordic-3">
              <view v-for="(img, i) in ticket.attachments.slice(0, 3)" :key="i"
                class="relative" style="width: 80rpx; height: 80rpx;">
                <image :src="img.url" class="w-full h-full rounded-nordic-md" mode="aspectFill" />
              </view>
            </view>
          </view>

          <!-- 卡片底部 -->
          <view class="flex gap-6 mb-nordic-4" @tap="goToDetail(ticket.id)">
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
              <text class="text-nordic-xs text-nordic-text-tertiary">{{ formatTime(ticket.createdAt) }}</text>
            </view>
          </view>

          <!-- 接单按钮 -->
          <u-button
            type="primary"
            size="large"
            @click.stop="handleAccept(ticket.id)"
          >
            立即接单
          </u-button>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="nordic-loading">
          <text class="text-nordic-base text-nordic-text-secondary">加载中...</text>
        </view>

        <!-- 没有更多 -->
        <view v-if="!hasMore && ticketList.length > 0" class="nordic-loading">
          <text class="text-nordic-base text-nordic-text-secondary">没有更多了</text>
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
import {
  getPriorityText,
  getPriorityTagType,
  getPriorityTagPlain,
} from '@/utils/tag-helpers';
import * as categoryApi from '@/api/category';

const ticketStore = useTicketStore();
const tabBarStore = useTabBarStore();
const { updateTabBarSelected } = useTabBarUpdate();;

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

/**
 * 获取优先级圆点颜色
 */
function getPriorityDotColor(priority: string): string {
  const dotColors: Record<string, string> = {
    'URGENT': 'bg-nordic-error',
    'NORMAL': 'bg-nordic-accent-sage',
  };
  return dotColors[priority] || 'bg-nordic-text-tertiary';
}

/**
 * 获取优先级标签样式
 */
function getPriorityTagClass(priority: string): string {
  const tagClasses: Record<string, string> = {
    'URGENT': 'nordic-tag-error',
    'NORMAL': 'nordic-tag-sage',
  };
  return tagClasses[priority] || 'nordic-tag-outline';
}

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
