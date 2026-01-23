<template>
  <view class="min-h-screen bg-nordic-bg-page">
    <scroll-view class="p-nordic-6" scroll-y v-if="ticket">
      <!-- 北欧风格状态卡片 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <view class="flex justify-between items-center mb-10">
          <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
          <u-tag
            :text="getStatusText(ticket.status)"
            :type="getStatusTagType(ticket.status)"
            size="mini"
            plain
          />
        </view>

        <!-- 北欧风格进度条 -->
        <view class="flex justify-between relative">
          <!-- 进度线 -->
          <view class="absolute top-4 left-4 right-4 h-0.5 bg-nordic-border">
            <view class="h-full bg-primary transition-all" :style="{ width: progressPercent + '%' }"></view>
          </view>

          <!-- 步骤点 -->
          <view
            v-for="(step, index) in steps"
            :key="index"
            class="flex flex-col items-center relative z-1"
          >
            <view
              class="w-8 h-8 rounded-full flex items-center justify-center border-2 mb-nordic-2"
              :class="currentIndex >= index ? 'bg-primary border-primary text-nordic-bg-card' : 'bg-nordic-bg-card border-nordic-border text-nordic-text-tertiary'"
            >
              <text v-if="currentIndex > index" class="text-sm">✓</text>
              <text v-else class="text-xs">{{ index + 1 }}</text>
            </view>
            <text class="text-nordic-xs" :class="currentIndex >= index ? 'text-primary' : 'text-nordic-text-tertiary'">{{ step.label }}</text>
          </view>
        </view>
      </view>

      <!-- 工单信息 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">工单信息</text>

        <view class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">问题标题</text>
          <text class="block text-nordic-base text-nordic-text-primary">{{ ticket.title }}</text>
        </view>

        <view class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">详细描述</text>
          <text class="block text-nordic-base text-nordic-text-primary leading-relaxed whitespace-pre-wrap">{{ ticket.description }}</text>
        </view>

        <view class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">问题分类</text>
          <text class="block text-nordic-base text-nordic-text-primary">{{ ticket.category?.name }}</text>
        </view>

        <view v-if="ticket.location" class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">位置信息</text>
          <text class="block text-nordic-base text-nordic-text-primary">{{ ticket.location }}</text>
        </view>

        <view class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">优先级</text>
          <u-tag
            :text="getPriorityText(ticket.priority)"
            :type="getPriorityTagType(ticket.priority)"
            size="mini"
            :plain="getPriorityTagPlain(ticket.priority)"
          />
        </view>

        <view class="mb-nordic-6">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-2">提交时间</text>
          <text class="block text-nordic-base text-nordic-text-primary">{{ formatDateTime(ticket.createdAt) }}</text>
        </view>

        <!-- 附件 -->
        <view v-if="ticket.attachments && ticket.attachments.length > 0" class="mt-nordic-6 pt-nordic-4 border-t border-nordic-border">
          <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-3">相关图片</text>
          <view class="flex flex-wrap gap-nordic-2">
            <image
              v-for="(img, index) in ticket.attachments"
              :key="index"
              :src="img.url"
              class="w-40 h-40 rounded-nordic-sm"
              mode="aspectFill"
              @tap="previewImage(ticket.attachments!, index)"
            />
          </view>
        </view>
      </view>

      <!-- 处理人信息 -->
      <view v-if="ticket.assignedTo" class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">处理人信息</text>
        <view class="flex gap-nordic-4 mb-nordic-6">
          <image
            class="w-25 h-25 rounded-full"
            :src="ticket.assignedTo.wxAvatarUrl || ticket.assignedTo.avatar || '/static/logo.png'"
          />
          <view class="flex flex-col justify-center">
            <text class="text-nordic-base font-medium text-nordic-text-primary mb-nordic-2">
              {{ ticket.assignedTo.wxNickname || ticket.assignedTo.username }}
            </text>
            <text v-if="ticket.assignedTo.position" class="text-nordic-sm text-nordic-text-secondary">
              {{ ticket.assignedTo.position }}
            </text>
          </view>
        </view>
        <u-button
          type="success"
          size="large"
          @click="makeCall"
        >
          📞 联系处理人
        </u-button>
      </view>

      <!-- 评价信息 -->
      <view v-if="ticket.rating" class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">我的评价</text>
        <view class="mb-nordic-3">
          <text v-for="i in 5" :key="i" class="text-5xl mr-1">
            {{ i <= ticket.rating ? '⭐' : '☆' }}
          </text>
        </view>
        <text v-if="ticket.feedback" class="block text-nordic-base text-nordic-text-secondary leading-relaxed">{{ ticket.feedback }}</text>
      </view>

      <!-- 操作按钮 -->
      <view class="flex gap-nordic-3">
        <u-button
          v-if="ticket.status === 'COMPLETED'"
          type="primary"
          size="large"
          @click="goToRate"
          :custom-style="{ flex: 1 }"
        >
          立即评价
        </u-button>

        <u-button
          v-if="ticket.status === 'COMPLETED' && !ticket.rating"
          type="primary"
          size="large"
          plain
          @click="closeTicket"
          :custom-style="{ flex: 1 }"
        >
          关闭工单
        </u-button>
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view v-else class="flex flex-col items-center justify-center h-screen">
      <u-loading-icon mode="circle" size="60" />
      <text class="mt-nordic-3 text-nordic-base text-nordic-text-secondary">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTicketStore } from '@/store';
import { TicketStatus, type Ticket } from '@/api/types';
import {
  getStatusText,
  getStatusTagType,
  getPriorityText,
  getPriorityTagType,
  getPriorityTagPlain,
} from '@/utils/tag-helpers';

const ticketStore = useTicketStore();

const ticket = ref<Ticket | null>(null);
const ticketId = ref('');

// 进度步骤
const steps = [
  { key: TicketStatus.WAIT_ASSIGN, label: '已提交' },
  { key: TicketStatus.WAIT_ACCEPT, label: '已指派' },
  { key: TicketStatus.PROCESSING, label: '处理中' },
  { key: TicketStatus.COMPLETED, label: '已完成' },
  { key: TicketStatus.CLOSED, label: '已关闭' },
];

// 当前状态索引
const currentIndex = computed(() => {
  if (!ticket.value) return -1;
  return steps.findIndex(s => s.key === ticket.value?.status);
});

// 进度百分比
const progressPercent = computed(() => {
  if (currentIndex.value < 0) return 0;
  return (currentIndex.value / (steps.length - 1)) * 100;
});

/**
 * 加载工单详情
 */
async function loadDetail() {
  // 使用 uni.getCurrentInstance() 获取页面实例和参数
  const instance = getCurrentInstance()
  const options = instance?.page?.$page?.options || {}

  if (options.id) {
    ticketId.value = options.id;
    try {
      ticket.value = await ticketStore.loadTicketDetail(options.id);
    } catch (error) {
      console.error('加载工单详情失败', error);
      uni.showToast({
        title: '加载失败',
        icon: 'error',
      });
    }
  }
}

/**
 * 预览图片
 */
function previewImage(attachments: any[], index: number) {
  const urls = attachments.map(a => a.url);
  uni.previewImage({
    urls,
    current: index,
  });
}

/**
 * 拨打电话
 */
function makeCall() {
  if (ticket.value?.assignedTo?.phone) {
    uni.makePhoneCall({
      phoneNumber: ticket.value.assignedTo.phone,
    });
  } else {
    uni.showToast({
      title: '暂无联系方式',
      icon: 'none',
    });
  }
}

/**
 * 跳转评价页面
 */
function goToRate() {
  uni.navigateTo({
    url: `/pages/user/rate/index?id=${ticketId.value}`,
  });
}

/**
 * 关闭工单
 */
async function closeTicket() {
  uni.showModal({
    title: '确认关闭',
    content: '关闭后将无法再次评价，确定要关闭工单吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await ticketStore.rateTicket(ticketId.value, 0, '用户关闭工单');
          uni.showToast({
            title: '已关闭',
            icon: 'success',
          });
          loadDetail();
        } catch (error) {
          console.error('关闭失败', error);
        }
      }
    },
  });
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped>
.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
