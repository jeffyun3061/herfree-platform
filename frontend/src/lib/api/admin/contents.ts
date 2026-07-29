import type { PageData } from '@/domain/common/types';
import type { Content } from '@/domain/content/types';
import { request } from '@/lib/api/client';
import type { AdminListQuery, ContentCreateInput, ContentCurationInput, ContentUpdateInput } from './types';

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

export function updateContentCuration(contentId: number, input: ContentCurationInput): Promise<Content> {
  return request<Content>(`/api/admin/contents/${contentId}/curation`, {
    method: 'PATCH',
    body: input,
  });
}
