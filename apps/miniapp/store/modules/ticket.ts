/**
 * 工单状态管理
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Ticket, TicketListParams } from '@/api/types';
import * as ticketApi from '@/api/ticket';

export const useTicketStore = defineStore('ticket', () => {
  // State
  const ticketList = ref<Ticket[]>([]);
  const currentTicket = ref<Ticket | null>(null);
  const loading = ref(false);
  const hasMore = ref(true);

  // 分页参数
  const page = ref(1);
  const limit = ref(20);
  const total = ref(0);

  // 缓存的查询参数
  let lastParams: TicketListParams | null = null;

  /**
   * 加载工单列表
   */
  async function loadTickets(params: TicketListParams = {}, refresh = false) {
    if (refresh) {
      page.value = 1;
      ticketList.value = [];
      hasMore.value = true;
    }

    if (loading.value || !hasMore.value) return;

    loading.value = true;

    console.log('[TicketStore] 开始加载工单列表:', { params, page: page.value, refresh });

    try {
      const response = await ticketApi.getTicketList({
        page: page.value,
        limit: limit.value,
        ...params,
      });

      console.log('[TicketStore] API 返回数据:', response);

      // 处理多种可能的响应格式
      let newData: Ticket[] = [];
      let totalCount = 0;

      // 格式1: 数组 (直接返回的数据)
      if (Array.isArray(response)) {
        newData = response;
        totalCount = response.length;
      }
      // 格式2: { data: [], total } (后端返回的分页对象，未包装)
      else if (response.data && Array.isArray(response.data) && !response.success) {
        newData = response.data;
        totalCount = response.total || 0;
      }
      // 格式3: TransformInterceptor包装后的格式 { data: { data: [], total } }
      else if (response.data?.data && Array.isArray(response.data.data)) {
        newData = response.data.data;
        totalCount = response.data.total || 0;
      }
      // 格式4: { items: [], total }
      else if (response.items && Array.isArray(response.items)) {
        newData = response.items;
        totalCount = response.total || 0;
      }
      // 兼容旧格式
      else {
        newData = response.data?.data || response.data || [];
        totalCount = response.data?.total || response.total || response.meta?.total || 0;
      }

      console.log('[TicketStore] 解析后的数据:', {
        newData,
        newDataLength: newData.length,
        totalCount,
      });

      if (refresh) {
        ticketList.value = newData;
      } else {
        ticketList.value.push(...newData);
      }

      total.value = totalCount;
      hasMore.value = ticketList.value.length < total.value;
      lastParams = params;

      console.log('[TicketStore] 更新后的状态:', {
        ticketList长度: ticketList.value.length,
        total: total.value,
        hasMore: hasMore.value,
      });

      page.value++;
    } catch (error) {
      console.error('加载工单列表失败', error);
      uni.showToast({
        title: '加载失败',
        icon: 'error',
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载更多工单
   */
  async function loadMore() {
    await loadTickets(lastParams || {});
  }

  /**
   * 刷新工单列表
   */
  async function refresh(params: TicketListParams = {}) {
    await loadTickets(params, true);
  }

  /**
   * 加载工单详情
   */
  async function loadTicketDetail(id: string) {
    loading.value = true;

    try {
      const ticket = await ticketApi.getTicketDetail(id);
      currentTicket.value = ticket;
      return ticket;
    } catch (error) {
      console.error('加载工单详情失败', error);
      uni.showToast({
        title: '加载失败',
        icon: 'error',
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建工单
   */
  async function createTicket(data: any) {
    loading.value = true;

    try {
      const ticket = await ticketApi.createTicket(data);
      // 添加到列表开头
      ticketList.value.unshift(ticket);
      total.value++;
      return ticket;
    } catch (error) {
      console.error('创建工单失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 接单
   */
  async function acceptTicket(ticketId: string) {
    loading.value = true;

    try {
      const ticket = await ticketApi.acceptTicket(ticketId);
      // 更新列表中的工单
      updateTicketInList(ticket);
      return ticket;
    } catch (error) {
      console.error('接单失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 完成工单
   */
  async function completeTicket(ticketId: string, data: any) {
    loading.value = true;

    try {
      const ticket = await ticketApi.completeTicket(ticketId, data);
      // 更新列表中的工单
      updateTicketInList(ticket);
      return ticket;
    } catch (error) {
      console.error('完成工单失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 评价工单
   */
  async function rateTicket(ticketId: string, rating: number, feedback?: string) {
    loading.value = true;

    try {
      const ticket = await ticketApi.rateTicket(ticketId, { rating, feedback });
      // 更新列表中的工单
      updateTicketInList(ticket);
      return ticket;
    } catch (error) {
      console.error('评价失败', error);
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 更新列表中的工单
   */
  function updateTicketInList(ticket: Ticket) {
    const index = ticketList.value.findIndex(t => t.id === ticket.id);
    if (index !== -1) {
      ticketList.value[index] = ticket;
    }
    // 如果是当前工单，也更新
    if (currentTicket.value?.id === ticket.id) {
      currentTicket.value = ticket;
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    ticketList.value = [];
    currentTicket.value = null;
    loading.value = false;
    hasMore.value = true;
    page.value = 1;
    total.value = 0;
    lastParams = null;
  }

  return {
    // State
    ticketList,
    currentTicket,
    loading,
    hasMore,
    page,
    total,

    // Actions
    loadTickets,
    loadMore,
    refresh,
    loadTicketDetail,
    createTicket,
    acceptTicket,
    completeTicket,
    rateTicket,
    reset,
  };
});
