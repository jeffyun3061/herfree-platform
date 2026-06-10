import type { PageData } from '@/domain/common/types';
import type { Post } from '@/domain/post/types';
import type { User } from '@/domain/user/types';
import { request } from '@/lib/api/client';

export function fetchMe(): Promise<User> {
  return request<User>('/api/users/me');
}

export function updateProfile(input: { nickname: string; bio?: string }): Promise<User> {
  return request<User>('/api/users/me/profile', { method: 'PATCH', body: input });
}

// api-spec.md 기준 회원 탈퇴 엔드포인트 — 백엔드 구현이 추가되면 그대로 동작한다
export function withdraw(): Promise<void> {
  return request<void>('/api/users/me', { method: 'DELETE' });
}

export function fetchMyPosts(page: number, size = 10): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/users/me/posts', {
    query: { page, size, sort: 'createdAt,desc' },
  });
}
