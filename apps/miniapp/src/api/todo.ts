/**
 * Todo 相关 API
 */
import { http } from '@/utils/http'
import { API_ENDPOINTS } from '@/config/api'

export interface Todo {
  id: string
  title: string
  description?: string
  isCompleted: boolean
  priority: number
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CreateTodoParams {
  title: string
  description?: string
  priority?: number
  dueDate?: string
}

export interface UpdateTodoParams {
  title?: string
  description?: string
  isCompleted?: boolean
  priority?: number
  dueDate?: string
}

export interface TodoListParams {
  page?: number
  pageSize?: number
  search?: string
  isCompleted?: boolean
}

export const todoApi = {
  /**
   * 获取 Todo 列表
   */
  getList: async (params?: TodoListParams) => {
    const res = await http.get<Todo[]>(API_ENDPOINTS.todos, params)
    return { data: { data: res.data, total: res.data.length } }
  },

  /**
   * 获取 Todo 详情
   */
  getDetail: (id: string) => {
    return http.get<Todo>(API_ENDPOINTS.todoDetail(id))
  },

  /**
   * 创建 Todo
   */
  create: (params: CreateTodoParams) => {
    return http.post<Todo>(API_ENDPOINTS.todos, params)
  },

  /**
   * 更新 Todo
   */
  update: (id: string, params: UpdateTodoParams) => {
    return http.put<Todo>(API_ENDPOINTS.todoDetail(id), params)
  },

  /**
   * 删除 Todo
   */
  delete: (id: string) => {
    return http.delete(API_ENDPOINTS.todoDetail(id))
  },

  /**
   * 切换 Todo 完成状态
   */
  toggleComplete: (id: string, isCompleted: boolean) => {
    return http.put<Todo>(API_ENDPOINTS.todoDetail(id), { isCompleted })
  },
}