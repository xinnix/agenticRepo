/**
 * 分类相关 API
 */
import { get } from './request';
import type { Category } from './types';

/**
 * 获取分类列表
 */
export function getCategoryList(params?: {
  parentId?: string;
  level?: number;
  status?: string;
}): Promise<Category[]> {
  return get<Category[]>('/categories', params);
}

/**
 * 获取分类详情
 */
export function getCategoryDetail(id: string): Promise<Category> {
  return get<Category>(`/categories/${id}`);
}

/**
 * 获取分类树
 */
export function getCategoryTree(): Promise<Category[]> {
  return get<Category[]>('/categories/tree');
}
