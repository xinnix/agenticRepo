<template>
  <view class="rate-page">
    <!-- 工单信息卡片 -->
    <view v-if="ticket" class="ticket-info-card">
      <view class="ticket-header">
        <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
        <view class="status-badge completed">
          <text>已完成</text>
        </view>
      </view>
      <text class="ticket-title">{{ ticket.title }}</text>
      <view class="ticket-meta">
        <view class="meta-item">
          <u-icon name="grid" size="14" color="#8E8E93"></u-icon>
          <text>{{ ticket.category?.name || '未分类' }}</text>
        </view>
        <view class="meta-item">
          <u-icon name="clock" size="14" color="#8E8E93"></u-icon>
          <text>{{ formatTime(ticket.createdAt) }}</text>
        </view>
      </view>
    </view>

    <!-- 评价表单卡片 -->
    <view class="rate-card">
      <!-- 评分标题 -->
      <view class="rate-header">
        <u-icon name="star-fill" size="24" color="#FF9500"></u-icon>
        <text class="rate-title">服务评价</text>
      </view>

      <!-- 星级评分 -->
      <view class="rating-section">
        <text class="section-label">请为本次服务评分</text>
        <view class="stars-container">
          <view
            v-for="index in 5"
            :key="index"
            class="star-item"
            :class="{ active: index <= rating }"
            @tap="setRating(index)"
          >
            <u-icon
              :name="index <= rating ? 'star-fill' : 'star'"
              size="50"
              :color="index <= rating ? '#FFC107' : '#E5E4E2'"
            ></u-icon>
          </view>
        </view>
        <text class="rating-text" v-if="rating > 0">{{ ratingText }}</text>
      </view>

      <!-- 反馈意见 -->
      <view class="feedback-section">
        <text class="section-label">反馈意见（可选）</text>
        <u-textarea
          v-model="feedback"
          placeholder="请描述您的满意或不满意之处，帮助我们改进服务..."
          :border="none"
          :custom-style="textareaStyle"
          :maxlength="200"
        />
        <text class="char-count">{{ feedback.length }}/200</text>
      </view>

      <!-- 提交按钮 -->
      <u-button
        type="primary"
        :loading="submitting"
        :disabled="rating === 0"
        @click="handleSubmit"
        :custom-style="buttonStyle"
        text="提交评价"
      />
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !ticket" class="loading-container">
      <u-loading-icon mode="circle" size="60"></u-loading-icon>
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTicketStore } from '@/store/modules/ticket';
import type { Ticket } from '@/api/types';

const ticketStore = useTicketStore();

const ticketId = ref('');
const ticket = ref<Ticket | null>(null);
const rating = ref(0);
const feedback = ref('');
const submitting = ref(false);
const loading = ref(false);

// 评分文案
const ratingText = computed(() => {
  const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意'];
  return texts[rating.value] || '';
});

// 文本框样式
const textareaStyle = {
  background: '#F2F2F7',
  borderRadius: '12rpx',
  minHeight: '200rpx',
  padding: '24rpx',
  fontSize: '28rpx',
};

// 按钮样式
const buttonStyle = computed(() => ({
  width: '100%',
  marginTop: '48rpx',
  height: '96rpx',
  fontSize: '32rpx',
  fontWeight: '700',
  borderRadius: '24rpx',
  opacity: rating.value === 0 ? 0.5 : 1,
}));

/**
 * 设置评分
 */
function setRating(value: number) {
  rating.value = value;

  // 震动反馈
  if (value <= 2) {
    uni.vibrateShort({ type: 'heavy' });
  } else {
    uni.vibrateShort({ type: 'light' });
  }
}

/**
 * 提交评价
 */
async function handleSubmit() {
  if (rating.value === 0) {
    uni.showToast({
      title: '请选择评分',
      icon: 'none',
    });
    return;
  }

  submitting.value = true;

  try {
    await ticketStore.rateTicket(ticketId.value, rating.value, feedback.value);

    uni.showToast({
      title: '评价成功',
      icon: 'success',
    });

    // 延迟返回
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error: any) {
    console.error('评价失败', error);
    uni.showToast({
      title: error.message || '评价失败',
      icon: 'none',
    });
  } finally {
    submitting.value = false;
  }
}

/**
 * 加载工单详情
 */
async function loadTicketDetail() {
  if (!ticketId.value) return;

  loading.value = true;
  try {
    const detail = await ticketStore.loadTicketDetail(ticketId.value);
    ticket.value = detail;
  } catch (error) {
    console.error('加载工单详情失败', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } finally {
    loading.value = false;
  }
}

/**
 * 格式化时间
 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 获取工单ID
onLoad((options: any) => {
  if (options.id) {
    ticketId.value = options.id;
    loadTicketDetail();
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style scoped>
.rate-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding: 32rpx;
}

/* 工单信息卡片 */
.ticket-info-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.ticket-header {
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

.status-badge {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.status-badge.completed {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.ticket-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
  line-height: 1.5;
}

.ticket-meta {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #8E8E93;
}

/* 评价卡片 */
.rate-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.rate-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 32rpx;
  padding-bottom: 24rpx;
  border-bottom: 2rpx solid #F2F2F7;
}

.rate-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
}

/* 评分区域 */
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 0;
  margin-bottom: 32rpx;
}

.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

.stars-container {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.star-item {
  transition: transform 0.2s;
}

.star-item:active {
  transform: scale(0.9);
}

.star-item.active {
  transform: scale(1.1);
}

.rating-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #007AFF;
  min-height: 40rpx;
}

/* 反馈区域 */
.feedback-section {
  position: relative;
  margin-bottom: 24rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #AEAEB2;
  margin-top: 12rpx;
}

/* 加载中 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #8E8E93;
  margin-top: 24rpx;
}
</style>
