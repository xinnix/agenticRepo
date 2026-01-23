<template>
  <view class="min-h-screen bg-nordic-bg-page">
    <scroll-view class="p-nordic-6" scroll-y v-if="ticket">
      <!-- 北欧风格状态卡片 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <view class="flex justify-between items-center mb-nordic-3">
          <text class="text-nordic-xs text-nordic-text-tertiary">{{ ticket.ticketNumber }}</text>
          <u-tag
            :text="getStatusText(ticket.status)"
            :type="getStatusTagType(ticket.status)"
            size="mini"
            plain
          />
        </view>
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary leading-relaxed">{{ ticket.title }}</text>
      </view>

      <!-- 工单信息 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">工单详情</text>

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

      <!-- 报修人信息 -->
      <view class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mb-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">报修人信息</text>
        <view class="flex gap-nordic-4 mb-nordic-6">
          <image
            class="w-25 h-25 rounded-full"
            :src="ticket.createdBy.wxAvatarUrl || ticket.createdBy.avatar || '/static/logo.png'"
          />
          <view class="flex flex-col justify-center">
            <text class="text-nordic-base font-medium text-nordic-text-primary mb-nordic-2">
              {{ ticket.createdBy.wxNickname || ticket.createdBy.username }}
            </text>
            <text v-if="ticket.createdBy.phone" class="text-nordic-sm text-nordic-text-secondary">
              {{ ticket.createdBy.phone }}
            </text>
          </view>
        </view>
        <u-button
          type="success"
          size="large"
          @click="makeCall"
        >
          📞 联系报修人
        </u-button>
      </view>

      <!-- 操作按钮 -->
      <view class="flex gap-nordic-3 p-nordic-6">
        <!-- 待接单状态 -->
        <u-button
          v-if="ticket.status === 'WAIT_ACCEPT'"
          type="primary"
          size="large"
          @click="handleAccept"
          :custom-style="{ flex: 1 }"
        >
          立即接单
        </u-button>

        <!-- 处理中状态 -->
        <template v-if="ticket.status === 'PROCESSING'">
          <u-button
            type="primary"
            size="large"
            @click="handleComplete"
            :custom-style="{ flex: 1 }"
          >
            完成工单
          </u-button>
          <u-button
            type="primary"
            size="large"
            plain
            @click="uploadEvidence"
            :custom-style="{ flex: 1 }"
          >
            上传处理证据
          </u-button>
        </template>
      </view>

      <!-- 处理记录 -->
      <view v-if="ticket.statusHistory && ticket.statusHistory.length > 0" class="bg-nordic-bg-card rounded-nordic-lg shadow-nordic-sm p-nordic-6 mt-nordic-6">
        <text class="block text-nordic-h3 font-medium text-nordic-text-primary mb-nordic-4">处理记录</text>
        <view
          v-for="(record, index) in ticket.statusHistory"
          :key="index"
          class="flex gap-nordic-3 py-nordic-4 relative"
          :class="index !== ticket.statusHistory.length - 1 ? 'border-l-2 border-nordic-border ml-3 -pl-3' : ''"
        >
          <view class="w-6 h-6 rounded-full bg-primary flex-shrink-0 mt-1"></view>
          <view class="flex-1 -mt-1">
            <text class="block text-nordic-base font-medium text-nordic-text-primary mb-nordic-2">{{ getStatusText(record.toStatus) }}</text>
            <text class="block text-nordic-sm text-nordic-text-secondary mb-nordic-1">{{ record.user.wxNickname || record.user.username }}</text>
            <text class="block text-nordic-xs text-nordic-text-tertiary mb-nordic-2">{{ formatDateTime(record.createdAt) }}</text>
            <text v-if="record.remark" class="block text-nordic-base text-nordic-text-secondary leading-relaxed p-nordic-4 bg-nordic-bg-input rounded-nordic-sm">{{ record.remark }}</text>
          </view>
        </view>
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
import { ref } from 'vue';
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
const evidenceImages = ref<string[]>([]);

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
  if (ticket.value?.createdBy?.phone) {
    uni.makePhoneCall({
      phoneNumber: ticket.value.createdBy.phone,
    });
  } else {
    uni.showToast({
      title: '暂无联系方式',
      icon: 'none',
    });
  }
}

/**
 * 接单
 */
async function handleAccept() {
  uni.showModal({
    title: '确认接单',
    content: '确定要接单吗？接单后需要及时处理。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await ticketStore.acceptTicket(ticketId.value);
          uni.showToast({
            title: '接单成功',
            icon: 'success',
          });
          loadDetail();
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
 * 完成工单
 */
async function handleComplete() {
  if (evidenceImages.value.length === 0) {
    uni.showToast({
      title: '请先上传处理证据',
      icon: 'none',
    });
    return;
  }

  uni.showModal({
    title: '确认完成',
    content: '确定完成工单吗？完成后将等待用户评价。',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 上传证据
          const uploadPromises = evidenceImages.value.map(async (filePath) => {
            const token = uni.getStorageSync('accessToken');
            return new Promise((resolve, reject) => {
              uni.uploadFile({
                url: 'http://localhost:3000/api/v1/attachments/upload',
                filePath,
                name: 'file',
                formData: {
                  type: 'IMAGE',
                  ticketId: ticketId.value,
                },
                header: {
                  'Authorization': `Bearer ${token}`,
                },
                success: (uploadRes) => {
                  if (uploadRes.statusCode === 201) {
                    const data = JSON.parse(uploadRes.data);
                    resolve(data.id);
                  } else {
                    reject(new Error('上传失败'));
                  }
                },
                fail: reject,
              });
            });
          });

          const attachmentIds = await Promise.all(uploadPromises) as string[];

          // 完成工单
          await ticketStore.completeTicket(ticketId.value, {
            attachmentIds,
            remark: '处理完成',
          });

          uni.showToast({
            title: '已完成',
            icon: 'success',
          });

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } catch (error: any) {
          uni.showToast({
            title: error.message || '操作失败',
            icon: 'error',
          });
        }
      }
    },
  });
}

/**
 * 上传处理证据
 */
function uploadEvidence() {
  // 打开弹窗选择图片
  uni.chooseImage({
    count: 9 - evidenceImages.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      evidenceImages.value.push(...res.tempFilePaths);
    },
  });
}

/**
 * 选择证据图片
 */
function chooseEvidenceImage() {
  uni.chooseImage({
    count: 9 - evidenceImages.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      evidenceImages.value.push(...res.tempFilePaths);
    },
  });
}

/**
 * 删除证据图片
 */
function removeEvidenceImage(index: number) {
  evidenceImages.value.splice(index, 1);
}

/**
 * 提交证据
 */
function submitEvidence() {
  // 关闭弹窗
  uni.showToast({
    title: '图片已添加，请点击"完成工单"提交',
    icon: 'none',
  });
}

/**
 * 获取状态文本
 */
function getStatusText(status: TicketStatus) {
  return TICKET_STATUS_TEXT[status];
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 组件挂载时加载数据
loadDetail();
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
