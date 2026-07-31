import type { PageData } from '@/domain/common/types';
import type { AdminNotice } from '@/domain/notice/types';
import { request } from '@/lib/api/client';
import type { AdminListQuery, NoticeCreateInput, NoticeCurationInput, NoticeUpdateInput } from './types';

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

export function updateNoticeCuration(postId: number, input: NoticeCurationInput): Promise<AdminNotice> {
  return request<AdminNotice>(`/api/admin/notices/${postId}/curation`, {
    method: 'PATCH',
    body: input,
  });
}
