/**
 * 区域相关 API
 */
import { get } from './request';
import type { PresetArea } from './types';

/**
 * 获取区域列表
 */
export function getAreaList(params?: {
  isActive?: boolean;
  departmentId?: string;
}): Promise<PresetArea[]> {
  return get<PresetArea[]>('/areas', params);
}

/**
 * 获取区域详情
 */
export function getAreaDetail(id: string): Promise<PresetArea> {
  return get<PresetArea>(`/areas/${id}`);
}
