import type { PageData } from '@/domain/common/types';
import { request } from '@/lib/api/client';
import type {
  AdminCommunityComment,
  AdminCommunityPost,
  AdminListQuery,
  AdminPostUpdateInput,
} from './types';

export function hidePost(postId: number): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}/hide`, { method: 'PATCH' });
}

export function restorePost(postId: number): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}/restore`, { method: 'PATCH' });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}`, { method: 'DELETE' });
}

export function updateAdminPost(postId: number, input: AdminPostUpdateInput): Promise<void> {
  return request<void>(`/api/admin/posts/${postId}`, { method: 'PATCH', body: input });
}

export function hideComment(commentId: number): Promise<void> {
  return request<void>(`/api/admin/comments/${commentId}/hide`, { method: 'PATCH' });
}

export function restoreComment(commentId: number): Promise<void> {
  return request<void>(`/api/admin/comments/${commentId}/restore`, { method: 'PATCH' });
}

export function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/api/admin/comments/${commentId}`, { method: 'DELETE' });
}

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
