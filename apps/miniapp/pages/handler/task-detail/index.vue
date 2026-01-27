<template>
  <view class="task-detail-page">
    <scroll-view scroll-y v-if="ticket">
      <!-- 工单信息 -->
      <view class="info-card">
        <!-- 工单标题和状态 -->
        <view class="ticket-header">
          <view class="title-row">
            <text class="ticket-title">{{ ticket.title }}</text>
            <view class="status-badge" :class="statusClass">
              <text>{{ getStatusText(ticket.status) }}</text>
            </view>
          </view>
          <text class="ticket-number">#{{ ticket.ticketNumber }}</text>
        </view>

        <text class="card-title">工单详情</text>

        <view class="info-row">
          <text class="info-label">详细描述</text>
          <text class="info-value">{{ ticket.description || '暂无描述' }}</text>
        </view>

        <!-- 报修人信息 -->
        <view class="info-row user-row">
          <text class="info-label">报修人</text>
          <view class="user-info-inline">
            <image
              class="user-avatar-small"
              :src="ticket.createdBy.wxAvatarUrl || ticket.createdBy.avatar || '/static/logo.png'"
              mode="aspectFill"
            />
            <view class="user-details-inline">
              <text class="user-name-inline">{{ ticket.createdBy.wxNickname || ticket.createdBy.username }}</text>
              <text v-if="ticket.createdBy.phone" class="user-phone-inline">{{ ticket.createdBy.phone }}</text>
            </view>
          </view>
        </view>

        <view class="info-row">
          <text class="info-label">问题分类</text>
          <text class="info-value">{{ ticket.category?.name || '未分类' }}</text>
        </view>

        <view v-if="ticket.location" class="info-row">
          <text class="info-label">位置信息</text>
          <view class="location-value">
            <u-icon name="map" size="16" color="#8E8E93"></u-icon>
            <text>{{ ticket.location }}</text>
          </view>
        </view>

        <view class="info-row">
          <text class="info-label">优先级</text>
          <view class="priority-tag" :class="priorityClass">
            <text>{{ getPriorityText(ticket.priority) }}</text>
          </view>
        </view>

        <view class="info-row">
          <text class="info-label">提交时间</text>
          <text class="info-value">{{ formatDateTime(ticket.createdAt) }}</text>
        </view>

        <!-- 附件 -->
        <view v-if="ticket.attachments && ticket.attachments.length > 0" class="attachments-section">
          <text class="section-label">报修图片</text>
          <scroll-view class="image-scroll" scroll-x>
            <view
              v-for="(img, index) in ticket.attachments"
              :key="index"
              class="attachment-image"
              @tap="previewImage(ticket.attachments!, index)"
            >
              <image :src="img.url" mode="aspectFill" />
            </view>
          </scroll-view>
        </view>

        <!-- 联系按钮 -->
        <view class="call-btn-inline" @tap="makeCall">
          <u-icon name="phone" size="18" color="#FFFFFF"></u-icon>
          <text>联系报修人</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <!-- 待接单状态 -->
        <view v-if="ticket.status === 'WAIT_ACCEPT'" class="action-btn primary" @tap="handleAccept">
          <text>立即接单</text>
        </view>

        <!-- 处理中状态 -->
        <view v-if="ticket.status === 'PROCESSING'" class="action-btn primary" @tap="handleComplete">
          <text>完成工单</text>
        </view>
      </view>

      <!-- 处理历史（暂时隐藏） -->
      <!-- <view v-if="ticket.statusHistory && ticket.statusHistory.length > 0" class="history-card">
        <text class="card-title">处理历史</text>
        <view class="history-list">
          <view
            v-for="(record, index) in ticket.statusHistory"
            :key="index"
            class="history-item"
            :class="{ 'has-timeline': index !== ticket.statusHistory.length - 1 }"
          >
            <view class="history-dot"></view>
            <view class="history-content">
              <text class="history-status">{{ getStatusText(record.toStatus) }}</text>
              <text class="history-user">{{ record.user.wxNickname || record.user.username }}</text>
              <text class="history-time">{{ formatDateTime(record.createdAt) }}</text>
              <text v-if="record.remark" class="history-remark">{{ record.remark }}</text>
            </view>
          </view>
        </view>
      </view> -->
    </scroll-view>

    <!-- 加载状态 -->
    <view v-else class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 完成工单弹窗 -->
    <uni-popup ref="completePopup" type="bottom" :safe-area="false">
      <view class="complete-modal">
        <view class="modal-header">
          <text class="modal-title">完成工单</text>
          <view class="close-btn" @tap="closeCompleteModal">
            <u-icon name="close" size="20" color="#8E8E93"></u-icon>
          </view>
        </view>

        <view class="modal-content">
          <!-- 处理说明 -->
          <view class="form-section">
            <text class="form-label">处理说明</text>
            <textarea
              v-model="completeForm.remark"
              class="form-textarea"
              placeholder="请描述处理结果..."
              :maxlength="500"
              :auto-height="true"
            />
          </view>

          <!-- 上传图片 -->
          <view class="form-section">
            <text class="form-label">现场图片</text>
            <scroll-view v-if="completeForm.images.length > 0" class="image-preview-scroll" scroll-x>
              <view
                v-for="(img, index) in completeForm.images"
                :key="index"
                class="preview-image-item"
              >
                <image :src="img.url" mode="aspectFill" />
                <view class="remove-image-btn" @tap="removeCompleteImage(index)">
                  <u-icon name="close" size="14" color="#FFFFFF"></u-icon>
                </view>
              </view>
            </scroll-view>
            <view class="upload-btn-group">
              <view class="upload-action-btn" @tap="chooseCompleteImage">
                <u-icon name="camera" size="20" color="#007AFF"></u-icon>
                <text>添加图片</text>
              </view>
            </view>
          </view>
        </view>

        <view class="modal-footer">
          <view class="modal-btn cancel" @tap="closeCompleteModal">
            <text>取消</text>
          </view>
          <view class="modal-btn confirm" @tap="confirmComplete">
            <text>完成工单</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useTicketStore } from '@/store';
import { useUpload } from '@/composables/useUpload';
import { TicketStatus, TICKET_STATUS_TEXT, type Ticket } from '@/api/types';

const ticketStore = useTicketStore();
const { chooseAndUploadImage } = useUpload();

const ticket = ref<Ticket | null>(null);
const ticketId = ref('');

// 完成工单弹窗相关
const completePopup = ref();
const completeForm = ref({
  remark: '',
  images: Array<{ url: string; attachmentId?: string }>(),
});

// 处理记录相关（保留旧逻辑以防兼容性问题，但不再使用）
const recordText = ref('');
const newImages = ref<string[]>([]);
const uploadedEvidence = ref<Array<{
  time: string;
  text?: string;
  images?: string[];
}>>([]);

// 状态样式类
const statusClass = computed(() => {
  if (!ticket.value) return '';
  const status = ticket.value.status;
  if (status === 'WAIT_ACCEPT') return 'pending';
  if (status === 'PROCESSING') return 'processing';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CLOSED') return 'closed';
  return '';
});

// 优先级样式类
const priorityClass = computed(() => {
  if (!ticket.value) return '';
  const priority = ticket.value.priority;
  if (priority === 'URGENT') return 'urgent';
  if (priority === 'HIGH') return 'high';
  if (priority === 'MEDIUM') return 'medium';
  return 'low';
});

/**
 * 加载工单详情
 */
async function loadDetail(id: string) {
  console.log('=== 加载工单详情 ===');
  console.log('工单 ID:', id);

  ticketId.value = id;

  try {
    console.log('开始调用 API 加载工单详情...');
    const ticketData = await ticketStore.loadTicketDetail(id);
    ticket.value = ticketData;
    console.log('工单详情加载成功:', ticket.value);
  } catch (error) {
    console.error('加载工单详情失败', error);
    uni.showToast({
      title: '加载失败',
      icon: 'error',
    });
  }
}

onLoad((options) => {
  console.log('=== 页面 onLoad ===');
  console.log('页面参数:', options);

  if (options?.id) {
    loadDetail(options.id);
  } else {
    console.error('未找到工单 ID 参数');
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
 * 预览证据图片
 */
function previewEvidenceImages(images: string[], index: number) {
  uni.previewImage({
    urls: images,
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
          loadDetail(ticketId.value);
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
 * 选择图片（旧函数，保留兼容性）
 */
function chooseImage() {
  const count = 9 - newImages.value.length;
  if (count <= 0) {
    uni.showToast({
      title: '最多上传9张图片',
      icon: 'none',
    });
    return;
  }

  uni.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      newImages.value.push(...res.tempFilePaths);
    },
  });
}

/**
 * 选择视频（旧函数，保留兼容性）
 */
function chooseVideo() {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    success: (res) => {
      newImages.value.push(res.thumbTempFilePath);
      uni.showToast({
        title: '视频已添加',
        icon: 'success',
      });
    },
  });
}

/**
 * 移除新选择的图片（旧函数，保留兼容性）
 */
function removeNewImage(index: number) {
  newImages.value.splice(index, 1);
}

/**
 * 删除已上传的证据（旧函数，保留兼容性）
 */
function deleteEvidence(index: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: (res) => {
      if (res.confirm) {
        uploadedEvidence.value.splice(index, 1);
      }
    },
  });
}

/**
 * 提交记录（旧函数，保留兼容性）
 */
function submitRecord() {
  if (!recordText.value.trim() && newImages.value.length === 0) {
    uni.showToast({
      title: '请添加文字或图片',
      icon: 'none',
    });
    return;
  }

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  uploadedEvidence.value.unshift({
    time,
    text: recordText.value || undefined,
    images: newImages.value.length > 0 ? [...newImages.value] : undefined,
  });

  recordText.value = '';
  newImages.value = [];

  uni.showToast({
    title: '记录已添加',
    icon: 'success',
  });
}

/**
 * 完成工单 - 打开弹窗
 */
function handleComplete() {
  completePopup.value?.open();
}

/**
 * 关闭完成弹窗
 */
function closeCompleteModal() {
  completePopup.value?.close();
}

/**
 * 选择完成工单的图片
 */
async function chooseCompleteImage() {
  const count = 9 - completeForm.value.images.length;
  if (count <= 0) {
    uni.showToast({
      title: '最多上传9张图片',
      icon: 'none',
    });
    return;
  }

  try {
    // 使用 OSS 直传
    const attachments = await chooseAndUploadImage(count);
    completeForm.value.images.push(...attachments.map(a => ({ url: a.url, attachmentId: a.id })));
  } catch (error) {
    console.error('选择图片失败', error);
  }
}

/**
 * 移除完成工单的图片
 */
function removeCompleteImage(index: number) {
  completeForm.value.images.splice(index, 1);
}

/**
 * 确认完成工单
 */
async function confirmComplete() {
  if (completeForm.value.images.length === 0 && !completeForm.value.remark.trim()) {
    uni.showToast({
      title: '请添加处理说明或图片',
      icon: 'none',
    });
    return;
  }

  try {
    // 收集 attachmentIds
    const attachmentIds = completeForm.value.images
      .map(img => img.attachmentId)
      .filter((id): id is string => !!id);

    // 完成工单
    await ticketStore.completeTicket(ticketId.value, {
      attachmentIds,
      remark: completeForm.value.remark || '处理完成',
    });

    closeCompleteModal();
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

/**
 * 获取状态文本
 */
function getStatusText(status: TicketStatus) {
  return TICKET_STATUS_TEXT[status];
}

/**
 * 获取优先级文本
 */
function getPriorityText(priority: string) {
  const priorityMap: Record<string, string> = {
    URGENT: '紧急',
    HIGH: '高',
    MEDIUM: '中',
    LOW: '低',
  };
  return priorityMap[priority] || priority;
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
</script>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background: #F2F2F7;
  padding-bottom: 32rpx;
}

/* 状态卡片 */
.status-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.card-header {
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

.status-badge.pending {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.status-badge.processing {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.status-badge.completed {
  background: rgba(52, 199, 89, 0.1);
  color: #34C759;
}

.status-badge.closed {
  background: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
}

.ticket-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1C1C1E;
  line-height: 1.4;
}

/* 信息卡片 */
.info-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

/* 工单头部 */
.ticket-header {
  margin-bottom: 24rpx;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.ticket-title {
  flex: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #1C1C1E;
  line-height: 1.4;
}

.ticket-number {
  font-size: 24rpx;
  color: #AEAEB2;
  font-weight: 500;
}

/* 用户信息内联样式 */
.user-row {
  flex-direction: column;
  align-items: flex-start;
}

.user-info-inline {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.user-avatar-small {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid #F2F2F7;
}

.user-details-inline {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user-name-inline {
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
}

.user-phone-inline {
  font-size: 24rpx;
  color: #8E8E93;
}

.call-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #34C759;
  color: #FFFFFF;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  margin-top: 16rpx;
}

.card-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 24rpx;
}

.info-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F2F2F7;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #8E8E93;
  font-weight: 500;
  flex-shrink: 0;
  width: 160rpx;
}

.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #1C1C1E;
  text-align: right;
  word-break: break-all;
}

.location-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8rpx;
  font-size: 28rpx;
  color: #1C1C1E;
}

/* 优先级标签 */
.priority-tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 700;
}

.priority-tag.urgent {
  background: rgba(255, 59, 48, 0.1);
  color: #FF3B30;
}

.priority-tag.high {
  background: rgba(255, 149, 0, 0.1);
  color: #FF9500;
}

.priority-tag.medium {
  background: rgba(0, 122, 255, 0.1);
  color: #007AFF;
}

.priority-tag.low {
  background: rgba(142, 142, 147, 0.1);
  color: #8E8E93;
}

/* 附件 */
.attachments-section {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #F2F2F7;
}

.section-label {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #AEAEB2;
  margin-bottom: 16rpx;
}

.image-scroll {
  white-space: nowrap;
}

.attachment-image {
  display: inline-block;
  width: 160rpx;
  height: 160rpx;
  margin-right: 16rpx;
  border-radius: 16rpx;
  overflow: hidden;
  vertical-align: top;
}

.attachment-image:last-child {
  margin-right: 0;
}

.attachment-image image {
  width: 100%;
  height: 100%;
}

/* 完成工单弹窗 */
.complete-modal {
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #F2F2F7;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1C1C1E;
}

.close-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F2F2F7;
  border-radius: 50%;
}

.modal-content {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 32rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 16rpx;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1C1C1E;
  line-height: 1.5;
}

.image-preview-scroll {
  white-space: nowrap;
  margin-bottom: 16rpx;
}

.preview-image-item {
  position: relative;
  display: inline-block;
  width: 140rpx;
  height: 140rpx;
  margin-right: 12rpx;
  border-radius: 12rpx;
  overflow: hidden;
  vertical-align: top;
}

.preview-image-item image {
  width: 100%;
  height: 100%;
}

.remove-image-btn {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
}

.upload-btn-group {
  display: flex;
  gap: 16rpx;
}

.upload-action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  border: 2rpx dashed #C5C5C7;
}

.upload-action-btn text {
  font-size: 24rpx;
  color: #8E8E93;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 2rpx solid #F2F2F7;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.modal-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.modal-btn.cancel {
  background: #F2F2F7;
  color: #8E8E93;
}

.modal-btn.confirm {
  background: #007AFF;
  color: #FFFFFF;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 24rpx;
}

.action-btn {
  flex: 1;
  text-align: center;
  padding: 28rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.action-btn.primary {
  background: #007AFF;
  color: #FFFFFF;
}

/* 处理历史 */
.history-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 0 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.history-list {
  display: flex;
  flex-direction: column;
}

.history-item {
  display: flex;
  gap: 24rpx;
  padding-bottom: 32rpx;
  position: relative;
}

.history-item.has-timeline {
  padding-bottom: 48rpx;
}

.history-item.has-timeline::before {
  content: '';
  position: absolute;
  left: 12rpx;
  top: 32rpx;
  bottom: 0;
  width: 2rpx;
  background: #F2F2F7;
}

.history-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #007AFF;
  flex-shrink: 0;
  margin-top: 4rpx;
  border: 4rpx solid #FFFFFF;
  box-shadow: 0 0 0 2rpx #F2F2F7;
}

.history-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.history-status {
  font-size: 28rpx;
  font-weight: 700;
  color: #1C1C1E;
}

.history-user {
  font-size: 24rpx;
  color: #8E8E93;
}

.history-time {
  font-size: 22rpx;
  color: #AEAEB2;
}

.history-remark {
  margin-top: 8rpx;
  padding: 16rpx;
  background: #F2F2F7;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #1C1C1E;
  line-height: 1.5;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 24rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #F2F2F7;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 28rpx;
  color: #8E8E93;
}
</style>
