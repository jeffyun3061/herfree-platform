import type { PageData } from '@/domain/common/types';
import type { Post, PostCreateInput, PostDetail, PostUpdateInput } from '@/domain/post/types';
import { request } from '@/lib/api/client';

// 백엔드 @PageableDefault 정렬이 오름차순이므로 항상 최신순 정렬을 명시한다
export function fetchPosts(boardId: number, page: number, size = 10): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/posts', {
    query: { boardId, page, size, sort: 'createdAt,desc' },
  });
}

export function fetchPost(postId: number): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`);
}

export function createPost(input: PostCreateInput): Promise<PostDetail> {
  return request<PostDetail>('/api/posts', { method: 'POST', body: input });
}

export function updatePost(postId: number, input: PostUpdateInput): Promise<PostDetail> {
  return request<PostDetail>(`/api/posts/${postId}`, { method: 'PATCH', body: input });
}

export function deletePost(postId: number): Promise<void> {
  return request<void>(`/api/posts/${postId}`, { method: 'DELETE' });
}
