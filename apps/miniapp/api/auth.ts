/**
 * 认证相关 API
 */
import { post, del as requestDel } from './request';
import type { AuthResponse, LoginRequest, WxLoginRequest } from './types';

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/login', data);
}

/**
 * 微信小程序登录
 */
export function wxLogin(data: WxLoginRequest): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/wx-login', data, { showLoading: true, loadingText: '登录中...' });
}

/**
 * 刷新 token
 */
export function refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  return post('/auth/refresh', { refreshToken });
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): Promise<any> {
  return post('/auth/me');
}

/**
 * 用户登出
 */
export function logout(refreshToken: string): Promise<{ success: boolean }> {
  return requestDel('/auth/logout', { refreshToken });
}

/**
 * 用户注册
 */
export function register(data: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/register', data, { showLoading: true, loadingText: '注册中...' });
}
