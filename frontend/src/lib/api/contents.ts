import type { PageData } from '@/domain/common/types';
import type { Content } from '@/domain/content/types';
import { request } from '@/lib/api/client';

export function fetchContents(params: {
  category?: string;
  page?: number;
  size?: number;
}): Promise<PageData<Content>> {
  return request<PageData<Content>>('/api/contents', {
    query: {
      category: params.category,
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: 'createdAt,desc',
    },
  });
}

export function fetchContent(contentId: number): Promise<Content> {
  return request<Content>(`/api/contents/${contentId}`);
}
