import type { Comment, CommentCreateInput } from '@/domain/comment/types';
import type { PageData } from '@/domain/common/types';
import { request } from '@/lib/api/client';

export function fetchComments(postId: number, page: number, size = 20): Promise<PageData<Comment>> {
  return request<PageData<Comment>>(`/api/posts/${postId}/comments`, {
    query: { page, size, sort: 'createdAt,asc' },
  });
}

export function createComment(postId: number, input: CommentCreateInput): Promise<Comment> {
  return request<Comment>(`/api/posts/${postId}/comments`, { method: 'POST', body: input });
}

export function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
}
