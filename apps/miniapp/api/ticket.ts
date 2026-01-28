/**
 * 工单相关 API
 */
import { get, post, put, del as requestDel } from './request';
import type {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  TicketActionDto,
  TicketListParams,
  PaginatedResponse,
  Comment,
} from './types';

/**
 * 获取工单列表
 */
export function getTicketList(params: TicketListParams): Promise<PaginatedResponse<Ticket>> {
  return get<PaginatedResponse<Ticket>>('/tickets', params);
}

/**
 * 获取工单详情
 */
export function getTicketDetail(id: string): Promise<Ticket> {
  return get<Ticket>(`/tickets/${id}`);
}

/**
 * 创建工单
 */
export function createTicket(data: CreateTicketDto): Promise<Ticket> {
  return post<Ticket>('/tickets', data, { showLoading: true, loadingText: '提交中...' });
}

/**
 * 更新工单
 */
export function updateTicket(id: string, data: UpdateTicketDto): Promise<Ticket> {
  return put<Ticket>(`/tickets/${id}`, data, { showLoading: true, loadingText: '更新中...' });
}

/**
 * 删除工单
 */
export function deleteTicket(id: string): Promise<{ success: boolean }> {
  return requestDel(`/tickets/${id}`);
}

/**
 * 批量删除工单
 */
export function deleteTickets(ids: string[]): Promise<{ success: boolean }> {
  return requestDel('/tickets', { ids });
}

/**
 * 接单（处理人接单）
 */
export function acceptTicket(id: string): Promise<Ticket> {
  return post<Ticket>(`/tickets/${id}/accept`, {}, { showLoading: true, loadingText: '接单中...' });
}

/**
 * 开始处理工单
 */
export function startTicket(id: string, data?: TicketActionDto): Promise<Ticket> {
  return post<Ticket>(`/tickets/${id}/start`, data, { showLoading: true, loadingText: '处理中...' });
}

/**
 * 完成工单
 */
export function completeTicket(id: string, data: TicketActionDto): Promise<Ticket> {
  return post<Ticket>(`/tickets/${id}/complete`, data, { showLoading: true, loadingText: '提交中...' });
}

/**
 * 评价工单
 */
export function rateTicket(id: string, data: { rating: number; feedback?: string }): Promise<Ticket> {
  return post<Ticket>(`/tickets/${id}/rate`, data, { showLoading: true, loadingText: '评价中...' });
}

/**
 * 关闭工单
 */
export function closeTicket(id: string): Promise<Ticket> {
  return post<Ticket>(`/tickets/${id}/close`, {}, { showLoading: true, loadingText: '关闭中...' });
}

/**
 * 获取工单评论列表
 */
export function getTicketComments(ticketId: string): Promise<Comment[]> {
  return get<Comment[]>(`/tickets/${ticketId}/comments`);
}

/**
 * 添加工单评论/处理记录
 */
export function addTicketComment(
  ticketId: string,
  data: {
    content?: string;
    attachmentUrls?: string[];
  }
): Promise<Comment> {
  return post<Comment>(`/tickets/${ticketId}/comments`, data, { showLoading: true, loadingText: '提交中...' });
}

/**
 * 获取工单状态历史
 */
export function getTicketStatusHistory(ticketId: string): Promise<any[]> {
  return get(`/tickets/${ticketId}/history`);
}
