import type { PageData } from '@/domain/common/types';
import type { Report, ReportProcessInput, ReportStatus } from '@/domain/report/types';
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
