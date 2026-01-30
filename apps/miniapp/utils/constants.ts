/**
 * 常量定义
 */
import { TicketStatus, Priority, CommentType, NotificationType } from '@/api/types';

// ============================================
// 工单状态
// ============================================

export const TICKET_STATUS_OPTIONS = [
  { value: TicketStatus.WAIT_ASSIGN, label: '等待处理', color: '#1890ff' },
  { value: TicketStatus.PROCESSING, label: '处理中', color: '#597ef7' },
  { value: TicketStatus.COMPLETED, label: '待评价', color: '#52c41a' },
  { value: TicketStatus.CLOSED, label: '已关闭', color: '#999' },
];

export const TICKET_STATUS_TEXT: Record<TicketStatus, string> = {
  [TicketStatus.WAIT_ASSIGN]: '等待处理',
  [TicketStatus.PROCESSING]: '处理中',
  [TicketStatus.COMPLETED]: '待评价',
  [TicketStatus.CLOSED]: '已关闭',
};

export const TICKET_STATUS_COLOR: Record<TicketStatus, string> = {
  [TicketStatus.WAIT_ASSIGN]: '#1890ff',
  [TicketStatus.PROCESSING]: '#597ef7',
  [TicketStatus.COMPLETED]: '#52c41a',
  [TicketStatus.CLOSED]: '#999',
};

// ============================================
// 优先级
// ============================================

export const PRIORITY_OPTIONS = [
  { value: Priority.NORMAL, label: '普通', color: '#52c41a' },
  { value: Priority.URGENT, label: '紧急', color: '#ff4d4f' },
];

export const PRIORITY_TEXT: Record<Priority, string> = {
  [Priority.NORMAL]: '普通',
  [Priority.URGENT]: '紧急',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.NORMAL]: '#52c41a',
  [Priority.URGENT]: '#ff4d4f',
};

// ============================================
// 评论类型
// ============================================

export const COMMENT_TYPE_TEXT: Record<CommentType, string> = {
  [CommentType.USER]: '用户',
  [CommentType.HANDLER]: '处理人',
  [CommentType.SYSTEM]: '系统',
};

// ============================================
// 通知类型
// ============================================

export const NOTIFICATION_TYPE_TEXT: Record<NotificationType, string> = {
  [NotificationType.TICKET_ASSIGNED]: '工单已指派',
  [NotificationType.TICKET_ACCEPTED]: '工单已接单',
  [NotificationType.TICKET_COMPLETED]: '工单已完成',
  [NotificationType.TICKET_OVERDUE]: '工单已超时',
  [NotificationType.TICKET_COMMENT]: '工单有新评论',
  [NotificationType.TICKET_RATED]: '工单已评价',
};

// ============================================
// API 配置
// ============================================

export const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// 存储键名
// ============================================

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_INFO: 'userInfo',
};

// ============================================
// 分页配置
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// ============================================
// 文件上传配置
// ============================================

export const UPLOAD = {
  MAX_IMAGE_COUNT: 9,
  MAX_VIDEO_COUNT: 1,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif'],
  ALLOWED_VIDEO_TYPES: ['mp4', 'mov'],
};

// ============================================
// 其他配置
// ============================================

export const CONFIG = {
  // Token 自动刷新时间（提前5分钟）
  TOKEN_REFRESH_ADVANCE: 5 * 60 * 1000,
  // 请求超时时间
  REQUEST_TIMEOUT: 30000,
  // 图片压缩质量
  IMAGE_QUALITY: 80,
};
