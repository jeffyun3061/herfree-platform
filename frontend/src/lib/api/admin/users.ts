import type { PageData } from '@/domain/common/types';
import type { AdminUser, UserRole, UserStatus } from '@/domain/user/types';
import { request } from '@/lib/api/client';
import type { RestrictUserInput } from './types';

export function fetchAdminUsers(page: number, size = 20, keyword?: string): Promise<PageData<AdminUser>> {
  return request<PageData<AdminUser>>('/api/admin/users', {
    query: {
      page,
      size,
      sort: 'createdAt,desc',
      ...(keyword ? { keyword } : {}),
    },
  });
}

export function updateAdminUserRole(userId: number, role: UserRole): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export function updateAdminUserStatus(userId: number, status: UserStatus): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function restrictAdminUser(userId: number, input: RestrictUserInput): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/restriction`, {
    method: 'PATCH',
    body: input,
  });
}

export function resetAdminUserNickname(
  userId: number,
  input: { reason: string; note?: string },
): Promise<AdminUser> {
  return request<AdminUser>(`/api/admin/users/${userId}/nickname/reset`, {
    method: 'PATCH',
    body: input,
  });
}
