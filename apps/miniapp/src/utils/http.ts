/**
 * HTTP 请求工具
 * 基于 uni.request 封装
 */

import type { ApiConfig } from '@/config/api'
import { API_CONFIG } from '@/config/api'

interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: unknown
  header?: Record<string, string>
  timeout?: number
}

interface Response<T = unknown> {
  data: T
  code: number
  message: string
}

class HttpClient {
  private config: ApiConfig

  constructor() {
    this.config = API_CONFIG
  }

  /**
   * 获取 token
   */
  private getToken(): string {
    return uni.getStorageSync('token') || ''
  }

  /**
   * 通用请求方法
   */
  private request<T = unknown>(config: RequestConfig): Promise<Response<T>> {
    const { url, method = 'GET', data, header = {}, timeout } = config

    return new Promise((resolve, reject) => {
      uni.request({
        url: this.config.baseURL + url,
        method,
        data,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.getToken() ? `Bearer ${this.getToken()}` : '',
          ...header,
        },
        timeout: timeout || this.config.timeout,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data as Response<T>)
          } else {
            uni.showToast({
              title: (res.data as Response).message || '请求失败',
              icon: 'none',
            })
            reject(res.data)
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络请求失败',
            icon: 'none',
          })
          reject(err)
        },
      })
    })
  }

  /**
   * GET 请求
   */
  get<T = unknown>(url: string, data?: unknown): Promise<Response<T>> {
    return this.request<T>({ url, method: 'GET', data })
  }

  /**
   * POST 请求
   */
  post<T = unknown>(url: string, data?: unknown): Promise<Response<T>> {
    return this.request<T>({ url, method: 'POST', data })
  }

  /**
   * PUT 请求
   */
  put<T = unknown>(url: string, data?: unknown): Promise<Response<T>> {
    return this.request<T>({ url, method: 'PUT', data })
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(url: string, data?: unknown): Promise<Response<T>> {
    return this.request<T>({ url, method: 'DELETE', data })
  }
}

export const http = new HttpClient()
export default http
