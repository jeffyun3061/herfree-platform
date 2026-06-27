import type { PageData } from '@/domain/common/types';
import type { AdminJournalStats } from '@/domain/journal/types';
import type { AdminUser, UserRole, UserStatus } from '@/domain/user/types';
import type { Content } from '@/domain/content/types';
import type { AdminNotice } from '@/domain/notice/types';
import type { Product } from '@/domain/product/types';
import type { Report, ReportProcessInput, ReportStatus } from '@/domain/report/types';
import type { Video } from '@/domain/video/types';
import { request } from '@/lib/api/client';

// 관리자 화면은 여러 도메인을 한 화면에서 다루므로 API 호출을 이 파일에 모아둔다.
// 새 운영 기능을 추가할 때는 권한 정책(SecurityConfig)과 docs/api-spec.md도 같이 갱신한다.
export type AdminEventCount = {
  eventName: string;
  count: number;
};

export type AdminStatsOverview = {
  totalUsers: number;
  newUsers7d: number;
  activePosts: number;
  newPosts7d: number;
  activeComments: number;
  pendingReports: number;
  journalRecords: number;
  journalRecords7d: number;
  contents: number;
  videos: number;
  eventsToday: number;
  events7d: number;
  topEvents7d: AdminEventCount[];
};

// 개인별 건강 기록이 아니라 운영 판단에 필요한 집계값만 내려받는다.
export function fetchAdminStatsOverview(): Promise<AdminStatsOverview> {
  return request<AdminStatsOverview>('/api/admin/stats/overview');
}

export function fetchReports(
  status: ReportStatus,
  page: number,
  size = 10,
): Promise<PageData<Report>> {
  return request<PageData<Report>>('/api/admin/reports', {
    query: { status, page, size, sort: 'createdAt,desc' },
  });
}

export function processReport(reportId: number, input: ReportProcessInput): Promise<Report> {
  return request<Report>(`/api/admin/reports/${reportId}/process`, {
    method: 'PATCH',
    body: input,
  });
}

export function hidePost(postId: number): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}/hide`, { method: 'PATCH' });
}

export function hideComment(commentId: number): Promise<void> {
  return request<void>(`/api/admin/comments/${commentId}/hide`, { method: 'PATCH' });
}

export function restorePost(postId: number): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}/restore`, { method: 'PATCH' });
}

export function restoreComment(commentId: number): Promise<void> {
  return request<void>(`/api/admin/comments/${commentId}/restore`, { method: 'PATCH' });
}

export type AdminPostUpdateInput = {
  title: string;
  content: string;
};

export function updateAdminPost(postId: number, input: AdminPostUpdateInput): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}`, { method: 'PATCH', body: input });
}

export type VideoCurationInput = {
  sortOrder?: number;
  isFeatured?: boolean;
  isVisible?: boolean;
};

export type ContentCurationInput = {
  sortOrder?: number;
  isPinned?: boolean;
};

export type NoticeCurationInput = {
  sortOrder?: number;
  isPinned?: boolean;
};

export function updateVideoCuration(videoId: number, input: VideoCurationInput): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}/curation`, { method: 'PATCH', body: input });
}

export function updateContentCuration(contentId: number, input: ContentCurationInput): Promise<Content> {
  return request<Content>(`/api/admin/contents/${contentId}/curation`, {
    method: 'PATCH',
    body: input,
  });
}

export function updateNoticeCuration(postId: number, input: NoticeCurationInput): Promise<AdminNotice> {
  return request<AdminNotice>(`/api/admin/notices/${postId}/curation`, {
    method: 'PATCH',
    body: input,
  });
}

export type AdminCommunityPost = {
  id: number;
  title: string;
  boardName: string;
  status: 'ACTIVE' | 'HIDDEN';
  authorNickname: string;
  createdAt: string;
};

export type AdminCommunityComment = {
  id: number;
  postId: number;
  postTitle: string;
  contentPreview: string;
  status: 'ACTIVE' | 'HIDDEN';
  authorNickname: string;
  createdAt: string;
};

export type AdminModerationStatus = 'ACTIVE' | 'HIDDEN';

export type AdminListQuery = {
  page?: number;
  size?: number;
  keyword?: string;
  status?: AdminModerationStatus;
  category?: string;
  visible?: boolean;
};

export function fetchAdminCommunityPosts(
  params: AdminListQuery = {},
): Promise<PageData<AdminCommunityPost>> {
  return request<PageData<AdminCommunityPost>>('/api/admin/posts', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'createdAt,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
}

export function fetchAdminCommunityComments(
  params: AdminListQuery = {},
): Promise<PageData<AdminCommunityComment>> {
  return request<PageData<AdminCommunityComment>>('/api/admin/comments', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'createdAt,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
}

export type ContentCreateInput = {
  title: string;
  content: string;
  category: string;
  contentType: string;
};

export type ContentUpdateInput = {
  title: string;
  content: string;
  category: string;
};

export function createContent(input: ContentCreateInput): Promise<Content> {
  return request<Content>('/api/admin/contents', { method: 'POST', body: input });
}

export function updateContent(contentId: number, input: ContentUpdateInput): Promise<Content> {
  return request<Content>(`/api/admin/contents/${contentId}`, { method: 'PATCH', body: input });
}

export function hideContent(contentId: number): Promise<void> {
  return request<void>(`/api/admin/contents/${contentId}/hide`, { method: 'PATCH' });
}

export function fetchAdminContents(params: AdminListQuery = {}): Promise<PageData<Content>> {
  return request<PageData<Content>>('/api/admin/contents', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'sortOrder,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
    },
  });
}

export function setContentVisibility(contentId: number, isVisible: boolean): Promise<Content> {
  return request<Content>(`/api/admin/contents/${contentId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function deleteContent(contentId: number): Promise<void> {
  return request<void>(`/api/admin/contents/${contentId}`, { method: 'DELETE' });
}

export type VideoCreateInput = {
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  description?: string;
  relatedBoardId?: number;
};

export type VideoUpdateInput = {
  title: string;
  youtubeUrl: string;
  thumbnailUrl?: string;
  description?: string;
};

export function createVideo(input: VideoCreateInput): Promise<Video> {
  return request<Video>('/api/admin/videos', { method: 'POST', body: input });
}

export function updateVideo(videoId: number, input: VideoUpdateInput): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}`, { method: 'PATCH', body: input });
}

export function setVideoVisibility(videoId: number, isVisible: boolean): Promise<Video> {
  return request<Video>(`/api/admin/videos/${videoId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function fetchAdminVideos(params: AdminListQuery = {}): Promise<PageData<Video>> {
  return request<PageData<Video>>('/api/admin/videos', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'sortOrder,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.visible !== undefined ? { visible: params.visible } : {}),
    },
  });
}

export function deleteVideo(videoId: number): Promise<void> {
  return request<void>(`/api/admin/videos/${videoId}`, { method: 'DELETE' });
}

export type ProductCreateInput = {
  name: string;
  category: string;
  imageUrl?: string;
  description?: string;
  price?: number;
  externalUrl?: string;
};

export type ProductUpdateInput = ProductCreateInput;

export function createProduct(input: ProductCreateInput): Promise<Product> {
  return request<Product>('/api/admin/products', { method: 'POST', body: input });
}

export function updateProduct(productId: number, input: ProductUpdateInput): Promise<Product> {
  return request<Product>(`/api/admin/products/${productId}`, { method: 'PATCH', body: input });
}

export function setProductVisibility(productId: number, isVisible: boolean): Promise<Product> {
  return request<Product>(`/api/admin/products/${productId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function deleteProduct(productId: number): Promise<void> {
  return request<void>(`/api/admin/products/${productId}`, { method: 'DELETE' });
}

export type NoticeCreateInput = {
  title: string;
  content: string;
};

export type NoticeUpdateInput = NoticeCreateInput;

export function fetchAdminNotices(params: AdminListQuery = {}): Promise<PageData<AdminNotice>> {
  return request<PageData<AdminNotice>>('/api/admin/notices', {
    query: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'sortOrder,desc',
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
}

export function createNotice(input: NoticeCreateInput): Promise<AdminNotice> {
  return request<AdminNotice>('/api/admin/notices', { method: 'POST', body: input });
}

export function updateNotice(postId: number, input: NoticeUpdateInput): Promise<AdminNotice> {
  return request<AdminNotice>(`/api/admin/notices/${postId}`, { method: 'PATCH', body: input });
}

export function setNoticeVisibility(postId: number, isVisible: boolean): Promise<AdminNotice> {
  return request<AdminNotice>(`/api/admin/notices/${postId}/visibility`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export function deleteNotice(postId: number): Promise<void> {
  return request<void>(`/api/admin/notices/${postId}`, { method: 'DELETE' });
}

export function fetchAdminJournalStats(): Promise<AdminJournalStats> {
  return request<AdminJournalStats>('/api/admin/journal/stats');
}

export function fetchAdminUsers(page: number, size = 20): Promise<PageData<AdminUser>> {
  return request<PageData<AdminUser>>('/api/admin/users', {
    query: { page, size, sort: 'createdAt,desc' },
  });
}

export function updateAdminUserRole(userId: number, role: UserRole): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export function updateAdminUserStatus(userId: number, status: UserStatus): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
