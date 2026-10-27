import { request } from '@/lib/api/client';
import type { PageData } from '@/domain/common/types';

export type CommunityDeletionRequest = {
  id: number;
  status: 'RECEIVED' | 'IN_REVIEW';
  postCount: number;
  commentCount: number;
  receivedAt: string;
  acknowledgedAt: string | null;
  policyVersion: string;
  purpose: string;
  items: Array<{ targetType: 'POST' | 'COMMENT'; targetId: number }>;
};

export function fetchCommunityDeletionRequests(page = 0) {
  return request<PageData<CommunityDeletionRequest>>('/api/admin/community-deletion-requests', { query: { page, size: 20 } });
}
export function fetchCommunityDeletionRequest(id: number) {
  return request<CommunityDeletionRequest>(`/api/admin/community-deletion-requests/${id}`);
}
export function acknowledgeCommunityDeletionRequest(id: number) {
  return request<CommunityDeletionRequest>(`/api/admin/community-deletion-requests/${id}/acknowledge`, { method: 'PATCH' });
}
