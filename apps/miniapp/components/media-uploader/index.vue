<template>
  <view class="media-uploader">
    <view class="media-list">
      <!-- 已上传的文件 -->
      <view v-for="(media, index) in mediaList" :key="index" class="media-item">
        <image v-if="media.type === 'IMAGE'" :src="media.url" class="media-thumb" mode="aspectFill" />
        <video v-else-if="media.type === 'VIDEO'" :src="media.url" class="media-thumb" />

        <!-- 上传进度 -->
        <view v-if="media.uploading" class="upload-progress">
          <view class="progress-bar" :style="{ width: media.progress + '%' }"></view>
        </view>

        <!-- 删除按钮 -->
        <view class="delete-btn" @click="removeMedia(index)">×</view>
      </view>

      <!-- 添加按钮 -->
      <view v-if="mediaList.length < maxCount" class="add-btns">
        <view class="add-btn" @click="chooseImage">
          <text class="add-icon">📷</text>
          <text class="add-text">图片</text>
        </view>
        <view v-if="allowVideo" class="add-btn" @click="chooseVideo">
          <text class="add-icon">🎬</text>
          <text class="add-text">视频</text>
        </view>
      </view>
    </view>

    <text v-if="tip" class="tip-text">{{ tip }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface MediaItem {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  file?: File;
  uploading?: boolean;
  progress?: number;
  attachmentId?: string;
}

interface Props {
  modelValue: MediaItem[];
  maxCount?: number;
  allowVideo?: boolean;
  tip?: string;
}

interface Emits {
  (e: 'update:modelValue', value: MediaItem[]): void;
  (e: 'upload', files: MediaItem[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 9,
  allowVideo: false,
  tip: '',
});

const emit = defineEmits<Emits>();

const mediaList = ref<MediaItem[]>([...props.modelValue]);

/**
 * 选择图片
 */
function chooseImage() {
  const count = props.maxCount - mediaList.value.length;

  uni.chooseImage({
    count,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const newMedia: MediaItem[] = res.tempFilePaths.map(filePath => ({
        type: 'IMAGE',
        url: filePath,
        uploading: true,
        progress: 0,
      }));

      mediaList.value.push(...newMedia);
      emitValue();

      // 触发上传事件
      emit('upload', newMedia);
    },
  });
}

/**
 * 选择视频
 */
function chooseVideo() {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    camera: 'back',
    success: (res) => {
      const newMedia: MediaItem = {
        type: 'VIDEO',
        url: res.tempFilePath,
        uploading: true,
        progress: 0,
      };

      mediaList.value.push(newMedia);
      emitValue();

      // 触发上传事件
      emit('upload', [newMedia]);
    },
  });
}

/**
 * 移除媒体
 */
function removeMedia(index: number) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个文件吗？',
    success: (res) => {
      if (res.confirm) {
        mediaList.value.splice(index, 1);
        emitValue();
      }
    },
  });
}

/**
 * 更新上传进度
 */
function updateProgress(index: number, progress: number) {
  if (mediaList.value[index]) {
    mediaList.value[index].progress = progress;
  }
}

/**
 * 标记上传完成
 */
function uploadComplete(index: number, attachmentId: string) {
  if (mediaList.value[index]) {
    mediaList.value[index].uploading = false;
    mediaList.value[index].attachmentId = attachmentId;
  }
}

/**
 * 上传失败
 */
function uploadFailed(index: number) {
  if (mediaList.value[index]) {
    mediaList.value[index].uploading = false;
  }
}

/**
 * 触发更新
 */
function emitValue() {
  emit('update:modelValue', [...mediaList.value]);
}

// 暴露方法给父组件
defineExpose({
  updateProgress,
  uploadComplete,
  uploadFailed,
});
</script>

<style scoped lang="scss">
.media-uploader {
  width: 100%;
}

.media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.media-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
}

.media-thumb {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 0 0 8rpx 8rpx;
  display: flex;
  align-items: center;
  padding: 0 8rpx;
}

.progress-bar {
  height: 8rpx;
  background: #667eea;
  border-radius: 4rpx;
  transition: width 0.3s;
}

.delete-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff4d4f;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  z-index: 1;
}

.add-btns {
  display: flex;
  gap: 16rpx;
}

.add-btn {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 48rpx;
}

.add-text {
  font-size: 24rpx;
  color: #999;
}

.tip-text {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}
</style>
