/**
 * 标签辅助函数
 * 用于统一状态和优先级标签的显示逻辑
 */

import { TicketStatus, Priority } from '@/api/types';

// ==================== uView Tag 类型定义 ====================
export type UViewTagType = 'primary' | 'success' | 'warning' | 'error' | 'info';

// ==================== 状态标签 ====================

/**
 * 获取状态对应的 uView Tag 类型
 * @param status 工单状态
 * @returns uView Tag 类型
 */
export function getStatusTagType(status: string): UViewTagType {
  const statusMap: Record<string, UViewTagType> = {
    [TicketStatus.WAIT_ASSIGN]: 'warning',    // 待指派 - 警告色
    [TicketStatus.WAIT_ACCEPT]: 'primary',    // 待接单 - 主题色
    [TicketStatus.PROCESSING]: 'primary',     // 处理中 - 主题色
    [TicketStatus.COMPLETED]: 'success',      // 已完成 - 成功色
    [TicketStatus.CLOSED]: 'info',            // 已关闭 - 信息色
  };
  return statusMap[status] || 'info';
}

/**
 * 获取状态对应的文本
 * @param status 工单状态
 * @returns 状态文本
 */
export function getStatusText(status: string): string {
  const statusTextMap: Record<string, string> = {
    [TicketStatus.WAIT_ASSIGN]: '待指派',
    [TicketStatus.WAIT_ACCEPT]: '待接单',
    [TicketStatus.PROCESSING]: '处理中',
    [TicketStatus.COMPLETED]: '待评价',
    [TicketStatus.CLOSED]: '已关闭',
  };
  return statusTextMap[status] || status;
}

/**
 * 获取状态对应的 plain 属性值
 * @param status 工单状态
 * @returns 是否使用 plain 样式
 */
export function getStatusTagPlain(status: string): boolean {
  // 所有状态标签都使用 plain 样式
  return true;
}

// ==================== 优先级标签 ====================

/**
 * 获取优先级对应的 uView Tag 类型
 * @param priority 优先级
 * @returns uView Tag 类型
 */
export function getPriorityTagType(priority: string): UViewTagType {
  const priorityMap: Record<string, UViewTagType> = {
    [Priority.URGENT]: 'error',    // 紧急 - 错误色
    [Priority.HIGH]: 'warning',    // 高 - 警告色
    [Priority.NORMAL]: 'success',  // 普通 - 成功色
    [Priority.LOW]: 'info',        // 低 - 信息色
  };
  return priorityMap[priority] || 'info';
}

/**
 * 获取优先级对应的文本
 * @param priority 优先级
 * @returns 优先级文本
 */
export function getPriorityText(priority: string): string {
  const priorityTextMap: Record<string, string> = {
    [Priority.URGENT]: '紧急',
    [Priority.HIGH]: '高',
    [Priority.NORMAL]: '普通',
    [Priority.LOW]: '低',
  };
  return priorityTextMap[priority] || priority;
}

/**
 * 获取优先级对应的 plain 属性值
 * @param priority 优先级
 * @returns 是否使用 plain 样式
 */
export function getPriorityTagPlain(priority: string): boolean {
  // 普通和低优先级使用 plain 样式，高优先级和紧急使用实心样式
  return priority === Priority.NORMAL || priority === Priority.LOW;
}

// ==================== 评论类型标签 ====================

import { CommentType } from '@/api/types';

/**
 * 获取评论类型对应的文本
 * @param commentType 评论类型
 * @returns 评论类型文本
 */
export function getCommentTypeText(commentType: string): string {
  const commentTypeTextMap: Record<string, string> = {
    [CommentType.USER]: '用户',
    [CommentType.HANDLER]: '处理人',
    [CommentType.SYSTEM]: '系统',
  };
  return commentTypeTextMap[commentType] || commentType;
}

// ==================== 通知类型标签 ====================

import { NotificationType } from '@/api/types';

/**
 * 获取通知类型对应的文本
 * @param notificationType 通知类型
 * @returns 通知类型文本
 */
export function getNotificationTypeText(notificationType: string): string {
  const notificationTypeTextMap: Record<string, string> = {
    [NotificationType.TICKET_ASSIGNED]: '工单已指派',
    [NotificationType.TICKET_ACCEPTED]: '工单已接单',
    [NotificationType.TICKET_COMPLETED]: '工单已完成',
    [NotificationType.TICKET_OVERDUE]: '工单已超时',
    [NotificationType.TICKET_COMMENT]: '工单有新评论',
    [NotificationType.TICKET_RATED]: '工单已评价',
  };
  return notificationTypeTextMap[notificationType] || notificationType;
}
