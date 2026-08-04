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

export type AccountSecurity = {
  passwordChangeAvailable: boolean;
};

export function fetchAccountSecurity(): Promise<AccountSecurity> {
  return request<AccountSecurity>('/api/users/me/account');
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return request<void>('/api/users/me/password', { method: 'PATCH', body: input });
}

export type HealthStatisticsConsent = {
  agreed: boolean;
};

export function fetchHealthStatisticsConsent(): Promise<HealthStatisticsConsent> {
  return request<HealthStatisticsConsent>('/api/users/me/consents/health-statistics');
}

export function updateHealthStatisticsConsent(agreed: boolean): Promise<HealthStatisticsConsent> {
  return request<HealthStatisticsConsent>('/api/users/me/consents/health-statistics', {
    method: 'PATCH',
    body: { agreed },
  });
}

export type HealthDataConsent = {
  agreed: boolean;
  policyVersion: string | null;
};

export function fetchHealthDataConsent(): Promise<HealthDataConsent> {
  return request<HealthDataConsent>('/api/users/me/consents/health-data');
}

export function updateHealthDataConsent(agreed: boolean): Promise<HealthDataConsent> {
  return request<HealthDataConsent>('/api/users/me/consents/health-data', {
    method: 'PATCH',
    body: { agreed },
  });
}

// api-spec.md 기준 회원 탈퇴 엔드포인트 — 백엔드 구현이 추가되면 그대로 동작한다
export function withdraw(): Promise<void> {
  return request<void>('/api/users/me', { method: 'DELETE' });
}

export type UserActivity = {
  totalPosts: number;
  symptomPosts: number;
  receivedReactions: number;
  bookmarkCount: number;
  lastPostAt: string | null;
  memberSince: string | null;
};

export function fetchMyActivity(): Promise<UserActivity> {
  return request<UserActivity>('/api/users/me/activity');
}

export function fetchMyPosts(
  page: number,
  size = 10,
  boardId?: number,
): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/users/me/posts', {
    query: { page, size, sort: 'createdAt,desc', boardId },
  });
}

export function fetchMyPostsWithReceivedReactions(
  page: number,
  size = 10,
): Promise<PageData<Post>> {
  return request<PageData<Post>>('/api/users/me/posts/received-reactions', {
    query: { page, size, sort: 'createdAt,desc' },
  });
}
