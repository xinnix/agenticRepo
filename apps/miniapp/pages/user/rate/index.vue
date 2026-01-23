<template>
  <view class="min-h-screen bg-nordic-bg-page p-nordic-6 flex items-center justify-center">
    <view class="bg-nordic-bg-card rounded-nordic-xl shadow-nordic-md p-10 w-full">
      <!-- 星级评分 -->
      <view class="text-center pb-nordic-6 border-b border-nordic-border">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">请为服务评分</text>
        <view class="flex justify-center gap-nordic-3 mb-nordic-4">
          <text
            v-for="i in 5"
            :key="i"
            class="text-7xl transition-transform"
            :class="{ 'scale-110': i <= rating }"
            @tap="setRating(i)"
          >
            {{ i <= rating ? '⭐' : '☆' }}
          </text>
        </view>
        <text class="block text-nordic-base text-primary font-medium">{{ ratingText }}</text>
      </view>

      <!-- 反馈意见 -->
      <view class="pt-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-3">反馈意见（可选）</text>
        <textarea
          v-model="feedback"
          class="w-full min-h-50 bg-nordic-bg-input rounded-nordic-sm p-nordic-4 text-nordic-base text-nordic-text-primary leading-relaxed"
          placeholder="请描述您的满意或不满意之处，帮助我们改进服务..."
          placeholder-class="text-nordic-text-tertiary"
          maxlength="200"
        />
        <text class="block text-right text-nordic-xs text-nordic-text-tertiary mt-nordic-2">{{ feedback.length }}/200</text>

        <!-- 提交按钮 -->
        <button
          class="w-full h-22 bg-primary text-nordic-bg-card rounded-nordic-lg text-nordic-base font-medium flex items-center justify-center shadow-nordic-sm nordic-button-animate mt-nordic-4"
          :class="{ 'opacity-50': rating === 0 }"
          @tap="handleSubmit"
          :loading="submitting"
          :disabled="rating === 0"
        >
          <text>提交评价</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTicketStore } from '@/store';

const ticketStore = useTicketStore();

const ticketId = ref('');
const rating = ref(0);
const feedback = ref('');
const submitting = ref(false);

// 评分文案
const ratingText = computed(() => {
  const texts = ['', '非常不满意', '不满意', '一般', '满意', '非常满意'];
  return texts[rating.value] || '';
});

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
      icon: 'error',
    });
  } finally {
    submitting.value = false;
  }
}

// 获取工单ID
onLoad((options: any) => {
  if (options.id) {
    ticketId.value = options.id;
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'error',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style scoped>
.scale-110 {
  transform: scale(1.1);
}
</style>
