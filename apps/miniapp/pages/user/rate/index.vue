<template>
  <view class="min-h-screen bg-nordic-bg-page p-nordic-6 flex items-center justify-center">
    <view class="bg-nordic-bg-card rounded-nordic-xl shadow-nordic-md p-10 w-full">
      <!-- 星级评分 -->
      <view class="text-center pb-nordic-6 border-b border-nordic-border">
        <u-text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4" text="请为服务评分"></u-text>
        <u-rate
          v-model="rating"
          :count="5"
          :active-color="'#FFC107'"
          :inactive-color="'#E5E4E2'"
          :size="50"
          :gutter="12"
          @change="setRating"
        />
        <u-text class="block text-nordic-base text-primary font-medium mt-nordic-4" :text="ratingText"></u-text>
      </view>

      <!-- 反馈意见 -->
      <view class="pt-nordic-6">
        <u-text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-3" text="反馈意见（可选）"></u-text>
        <u-textarea
          v-model="feedback"
          placeholder="请描述您的满意或不满意之处，帮助我们改进服务..."
          :border="none"
          :custom-style="{ background: '#FAFAFA', borderRadius: '4rpx', minHeight: '200rpx', padding: '16rpx' }"
          :maxlength="200"
        />
        <u-text class="block text-right text-nordic-xs text-nordic-text-tertiary mt-nordic-2" :text="`${feedback.length}/200`"></u-text>

        <!-- 提交按钮 -->
        <u-button
          type="primary"
          :loading="submitting"
          :disabled="rating === 0"
          @click="handleSubmit"
          :custom-style="{ width: '100%', marginTop: '32rpx' }"
          :class="{ 'opacity-50': rating === 0 }"
          text="提交评价"
        />
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
