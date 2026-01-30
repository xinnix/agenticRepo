/**
 * TypeScript 类型定义
 * 与后端 API 保持一致
 */

// ============================================
// 枚举类型
// ============================================

export enum TicketStatus {
  WAIT_ASSIGN = 'WAIT_ASSIGN',   // 等待处理（可接单或派单）
  PROCESSING = 'PROCESSING',     // 处理中
  COMPLETED = 'COMPLETED',       // 待评价
  CLOSED = 'CLOSED',            // 已关闭
}

export enum Priority {
  NORMAL = 'NORMAL',             // 普通
  URGENT = 'URGENT',             // 紧急
}

export enum LocationType {
  MANUAL = 'MANUAL',             // 手动输入
  PRESET = 'PRESET',             // 预设区域
}

export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum CommentType {
  USER = 'USER',
  HANDLER = 'HANDLER',
  SYSTEM = 'SYSTEM',
}

export enum NotificationType {
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_ACCEPTED = 'TICKET_ACCEPTED',
  TICKET_COMPLETED = 'TICKET_COMPLETED',
  TICKET_OVERDUE = 'TICKET_OVERDUE',
  TICKET_COMMENT = 'TICKET_COMMENT',
  TICKET_RATED = 'TICKET_RATED',
}

// ============================================
// 用户相关类型
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;

  // 微信相关
  phone?: string;
  wxOpenId?: string;
  wxNickname?: string;
  wxAvatarUrl?: string;

  // 部门信息
  departmentId?: string;
  department?: Department;
  position?: string;

  // 角色权限
  roles?: UserRole[];
  permissions?: string[];

  // 办事员申请信息
  realName?: string;           // 真实姓名
  handlerStatus?: 'pending' | 'approved' | 'rejected' | null;  // 申请状态
  handlerAppliedAt?: string;   // 申请时间
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  level: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
  role?: Role;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 工单相关类型
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  sortOrder?: number;
  status: string;
  level: number;
  assignType: 'MANUAL' | 'AUTO';
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  categoryId: string;
  category?: Category;
  locationType: LocationType;
  location?: string;
  presetAreaId?: string;
  presetArea?: PresetArea;
  createdById: string;
  createdBy: User;
  assignedId?: string;
  assignedTo?: User;
  deadlineAt?: string;
  completedAt?: string;
  closedAt?: string;
  rating?: number;
  feedback?: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;

  // 关联数据
  attachments?: Attachment[];
  comments?: Comment[];
  statusHistory?: StatusHistory[];
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  ticketId: string;
  uploadedById: string;
  uploadedBy: User;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  ticketId: string;
  userId: string;
  user: User;
  commentType: CommentType;
  attachments?: Attachment[];  // 关联的附件（处理记录的图片/视频）
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  ticketId: string;
  fromStatus?: TicketStatus;
  toStatus: TicketStatus;
  userId: string;
  user: User;
  remark?: string;
  createdAt: string;
}

export interface PresetArea {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  ticketId: string;
  ticket: Ticket;
  userId: string;
  user: User;
  title: string;
  content: string;
  wxMsgId?: string;
  wxTemplateId?: string;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
}

// ============================================
// 请求/响应类型
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface WxLoginRequest {
  code: string;
  phoneCode: string;
  userInfo?: {
    nickName: string;
    avatarUrl: string;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  assignedId?: string;
  createdById?: string;
  priority?: Priority;
  categoryId?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTicketDto {
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  location?: string;
  presetAreaId?: string; // 预设区域ID
  attachmentIds?: string[]; // 通过后端上传的附件ID
  attachmentUrls?: string[]; // 直接上传到OSS的URLs
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  priority?: Priority;
  location?: string;
}

export interface TicketActionDto {
  attachmentIds?: string[];
  remark?: string;
}

// ============================================
// 状态文本映射
// ============================================

export const TICKET_STATUS_TEXT: Record<TicketStatus, string> = {
  [TicketStatus.WAIT_ASSIGN]: '等待处理',
  [TicketStatus.PROCESSING]: '处理中',
  [TicketStatus.COMPLETED]: '待评价',
  [TicketStatus.CLOSED]: '已关闭',
};

export const PRIORITY_TEXT: Record<Priority, string> = {
  [Priority.NORMAL]: '普通',
  [Priority.URGENT]: '紧急',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  [Priority.NORMAL]: '#52c41a',
  [Priority.URGENT]: '#ff4d4f',
};
