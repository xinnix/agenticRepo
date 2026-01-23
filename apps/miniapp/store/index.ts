/**
 * Pinia 状态管理入口
 */
import { createPinia } from 'pinia';

const pinia = createPinia();

export { pinia };
export * from './modules/user';
export * from './modules/ticket';
