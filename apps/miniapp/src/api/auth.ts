/**
 * 用户相关 API
 */
import { http } from '@/utils/http'
import { API_ENDPOINTS } from '@/config/api'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
}

export const authApi = {
  /**
   * 用户登录
   */
  login: (params: LoginParams) => {
    return http.post<{ token: string; user: UserInfo }>(API_ENDPOINTS.login, params)
  },

  /**
   * 用户注册
   */
  register: (params: RegisterParams) => {
    return http.post<{ token: string; user: UserInfo }>(API_ENDPOINTS.register, params)
  },

  /**
   * 用户登出
   */
  logout: () => {
    return http.post(API_ENDPOINTS.logout)
  },

  /**
   * 获取用户信息
   */
  getProfile: () => {
    return http.get<UserInfo>(API_ENDPOINTS.profile)
  },
}
