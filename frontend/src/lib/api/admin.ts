import type { PageData } from '@/domain/common/types';
import type { AdminJournalStats } from '@/domain/journal/types';
import type { Content } from '@/domain/content/types';
import type { Product } from '@/domain/product/types';
import type { Report, ReportProcessInput, ReportStatus } from '@/domain/report/types';
import type { Video } from '@/domain/video/types';
import { request } from '@/lib/api/client';

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

export function fetchAdminJournalStats(): Promise<AdminJournalStats> {
  return request<AdminJournalStats>('/api/admin/journal/stats');
}
