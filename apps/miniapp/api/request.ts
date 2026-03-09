/**
 * HTTP 请求封装
 * 提供 uni.request 的封装，支持拦截器、Token 管理和自动刷新
 */

// const BASE_URL = 'http://localhost:3000/api';
const BASE_URL = 'https://feedback.classmaster.cn/api';

interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
  showLoading?: boolean;
  loadingText?: string;
}

interface RequestResponse<T = any> {
  data: T;
  statusCode: number;
  header: Record<string, string>;
}

// 是否正在刷新 token
let isRefreshing = false;
// 等待刷新的请求队列
let refreshQueue: Array<{ token: string; resolve: (value: any) => void; reject: (reason: any) => void }> = [];

/**
 * 处理 token 刷新
 */
async function handleTokenRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    refreshQueue.push({ token: '', resolve, reject });

    if (!isRefreshing) {
      isRefreshing = true;

      const refreshToken = uni.getStorageSync('refreshToken');

      uni.request({
        url: `${BASE_URL}/auth/refresh`,
        method: 'POST',
        data: { refreshToken },
        success: (res: any) => {
          // 后端使用 TransformInterceptor 包装响应，提取 data 字段
          const responseData = res.data?.data !== undefined ? res.data.data : res.data;
          const { accessToken, refreshToken: newRefreshToken } = responseData;

          // 存储新 token
          uni.setStorageSync('accessToken', accessToken);
          uni.setStorageSync('refreshToken', newRefreshToken);

          // 处理等待队列
          refreshQueue.forEach(item => {
            item.token = accessToken;
            item.resolve(accessToken);
          });
          refreshQueue = [];
        },
        fail: (err) => {
          // 刷新失败，清空 token 并跳转登录页
          uni.removeStorageSync('accessToken');
          uni.removeStorageSync('refreshToken');

          refreshQueue.forEach(item => {
            item.reject(err);
          });
          refreshQueue = [];

          // 跳转登录页
          uni.reLaunch({
            url: '/pages/auth/login/index',
          });
        },
        complete: () => {
          isRefreshing = false;
        },
      });
    }
  });
}

/**
 * 核心请求方法
 */
export function request<T = any>(config: RequestConfig): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
    loadingText = '加载中...',
  } = config;

  // 显示 loading
  if (showLoading) {
    uni.showLoading({ title: loadingText, mask: true });
  }

  return new Promise<T>((resolve, reject) => {
    const token = uni.getStorageSync('accessToken');

    // 调试日志
    console.log('[Request] ========================================');
    console.log('[Request] URL:', url);
    console.log('[Request] Token exists:', !!token);
    console.log('[Request] Token length:', token?.length);
    console.log('[Request] Token prefix:', token?.substring(0, 30) + '...');
    console.log('[Request] Authorization header:', token ? `Bearer ${token.substring(0, 20)}...` : 'NONE');
    console.log('[Request] ========================================');

    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header,
      },
      success: (res: RequestResponse) => {
        if (showLoading) {
          uni.hideLoading();
        }

        console.log('[Request Response] ========================================');
        console.log('[Request Response] Status:', res.statusCode);
        console.log('[Request Response] Raw data:', res.data);
        console.log('[Request Response] ========================================');

        // 2xx 状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 后端使用 TransformInterceptor 包装响应
          // 如果响应包含 data 属性，则提取 data 字段作为实际数据
          const actualData = res.data?.data !== undefined ? res.data.data : res.data;
          console.log('[Request Actual Data]:', actualData);
          resolve(actualData as T);
          return;
        }

        // 401 未授权
        if (res.statusCode === 401) {
          // 尝试刷新 token
          handleTokenRefresh()
            .then(newToken => {
              // 重新发起请求
              uni.request({
                url: BASE_URL + url,
                method,
                data,
                header: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newToken}`,
                  ...header,
                },
                success: (retryRes: any) => {
                  if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
                    const actualData = retryRes.data?.data !== undefined ? retryRes.data.data : retryRes.data;
                    resolve(actualData as T);
                  } else {
                    reject(new Error(retryRes.data?.message || '请求失败'));
                  }
                },
                fail: reject,
              });
            })
            .catch(() => {
              reject(new Error('登录已过期，请重新登录'));
            });
          return;
        }

        // 其他错误
        reject(new Error(res.data?.message || '请求失败'));
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading();
        }
        reject(new Error('网络请求失败，请检查网络连接'));
      },
    });
  });
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  // 对于 GET 请求，将参数转换为查询字符串
  let finalUrl = url;
  if (data && Object.keys(data).length > 0) {
    const queryParams = Object.keys(data)
      .filter(key => data[key] !== undefined && data[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
    finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
    console.log('[GET Request] URL:', finalUrl);
    console.log('[GET Request] Params:', data);
  }

  return request<T>({ url: finalUrl, method: 'GET', ...config });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({ url, method: 'POST', data, ...config });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({ url, method: 'PUT', data, ...config });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request<T>({ url, method: 'DELETE', data, ...config });
}

export default request;
