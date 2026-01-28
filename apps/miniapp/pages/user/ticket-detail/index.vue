<template>
  <view class="min-h-screen bg-nordic-bg-page">
    <scroll-view class="p-nordic-6" scroll-y v-if="ticket">
      <!-- 北欧风格状态卡片 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <view class="flex justify-between items-center mb-10">
          <u-text class="text-nordic-xs text-nordic-text-tertiary" :text="ticket.ticketNumber"></u-text>
          <u-tag
            :text="getStatusText(ticket.status)"
            :type="getStatusTagType(ticket.status)"
            size="mini"
            plain
          />
        </view>

        <!-- 北欧风格进度条 -->
        <u-steps :current="currentIndex" :list="steps" direction="row" />
      </view>

      <!-- 工单信息 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <u-text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4" text="工单信息"></u-text>

        <u-cell-group :border="false">
          <u-cell title="问题标题" :value="ticket.title"></u-cell>
          <u-cell title="详细描述" :value="ticket.description" :label="ticket.description"></u-cell>
          <u-cell title="问题分类" :value="ticket.category?.name"></u-cell>
          <u-cell v-if="ticket.location" title="位置信息" :value="ticket.location"></u-cell>
          <u-cell title="优先级">
            <template #value>
              <u-tag
                :text="getPriorityText(ticket.priority)"
                :type="getPriorityTagType(ticket.priority)"
                size="mini"
                :plain="getPriorityTagPlain(ticket.priority)"
              />
            </template>
          </u-cell>
          <u-cell title="提交时间" :value="formatDateTime(ticket.createdAt)"></u-cell>
        </u-cell-group>

        <!-- 附件 -->
        <view v-if="ticket.attachments && ticket.attachments.length > 0" class="mt-nordic-6 pt-nordic-4 border-t border-nordic-border">
          <u-text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-3" text="相关图片"></u-text>
          <u-scroll-list>
            <view class="flex flex-wrap gap-nordic-2">
              <u-image
                v-for="(img, index) in ticket.attachments"
                :key="index"
                :src="img.url"
                width="160rpx"
                height="160rpx"
                :radius="8"
                @click="previewImage(ticket.attachments!, index)"
              />
            </view>
          </u-scroll-list>
        </view>
      </view>

      <!-- 处理人信息 -->
      <view v-if="ticket.assignedTo" class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <u-text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4" text="处理人信息"></u-text>
        <view class="flex gap-nordic-4 mb-nordic-6">
          <u-avatar
            :src="ticket.assignedTo.wxAvatarUrl || ticket.assignedTo.avatar || '/static/logo.png'"
            size="100rpx"
          />
          <view class="flex flex-col justify-center">
            <u-text class="text-nordic-base font-medium text-nordic-text-primary mb-nordic-2"
              :text="ticket.assignedTo.wxNickname || ticket.assignedTo.username">
            </u-text>
            <u-text v-if="ticket.assignedTo.position" class="text-nordic-sm text-nordic-text-secondary"
              :text="ticket.assignedTo.position">
            </u-text>
          </view>
        </view>
        <u-button
          type="success"
          size="large"
          @click="makeCall"
          text="联系处理人"
          :icon="'phone'"
        />
      </view>

      <!-- 评价信息 -->
      <view v-if="ticket.rating" class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <u-text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4" text="我的评价"></u-text>
        <u-rate v-model="ticket.rating" :readonly="true" />
        <u-text v-if="ticket.feedback" class="block text-nordic-base text-nordic-text-secondary leading-relaxed mt-nordic-3"
          :text="ticket.feedback">
        </u-text>
      </view>

      <!-- 操作按钮 -->
      <view class="flex gap-nordic-3">
        <u-button
          v-if="ticket.status === 'COMPLETED'"
          type="primary"
          size="large"
          @click="goToRate"
          :custom-style="{ flex: 1 }"
          text="立即评价"
        />

        <u-button
          v-if="ticket.status === 'COMPLETED' && !ticket.rating"
          type="primary"
          size="large"
          plain
          @click="closeTicket"
          :custom-style="{ flex: 1 }"
          text="关闭工单"
        />
      </view>
    </scroll-view>

    <!-- 加载状态 -->
    <view v-else class="flex flex-col items-center justify-center h-screen">
      <u-loading-icon mode="circle" size="60" />
      <u-text class="mt-nordic-3 text-nordic-base text-nordic-text-secondary" text="加载中..."></u-text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
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
async function loadDetail(id: string) {
  try {
    console.log('[TicketDetail] 开始加载工单详情, ID:', id);
    ticket.value = await ticketStore.loadTicketDetail(id);
    console.log('[TicketDetail] 工单详情加载成功:', ticket.value);
  } catch (error) {
    console.error('[TicketDetail] 加载工单详情失败', error);
    uni.showToast({
      title: '加载失败',
      icon: 'error',
    });
  }
}

// 使用 onLoad 获取页面参数
onLoad((options) => {
  console.log('[TicketDetail] 页面参数:', options);

  if (options?.id) {
    ticketId.value = options.id;
    loadDetail(options.id);
  } else {
    console.error('[TicketDetail] 缺少工单ID参数');
    uni.showToast({
      title: '参数错误',
      icon: 'error',
    });
  }
});

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
