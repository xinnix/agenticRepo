/**
 * 统计相关 API
 */
import { get } from './request';

/**
 * 工单统计概览
 */
export function getTicketOverview(params?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  total: number;
  waitAssign: number;
  waitAccept: number;
  processing: number;
  completed: number;
  closed: number;
  overdue: number;
}> {
  return get('/statistics/tickets/overview', params);
}

/**
 * 处理人工作台统计
 */
export function getHandlerStats(handlerId: string, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  pendingCount: number;
  processingCount: number;
  todayCompleted: number;
  totalCompleted: number;
  averageRating: number;
}> {
  return get(`/statistics/handlers/${handlerId}`, params);
}

/**
 * 用户工单统计
 */
export function getUserStats(userId: string, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  totalSubmitted: number;
  processing: number;
  completed: number;
  averageRating: number;
}> {
  return get(`/statistics/users/${userId}`, params);
}

/**
 * 工单趋势统计
 */
export function getTicketTrend(params: {
  period: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}): Promise<{
  date: string;
  count: number;
}[]> {
  return get('/statistics/tickets/trend', params);
}

/**
 * 分类统计
 */
export function getCategoryStats(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
}[]> {
  return get('/statistics/categories', params);
}
