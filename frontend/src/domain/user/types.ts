// 백엔드 UserRole enum과 동기화
export type UserRole =
  | 'USER'
  | 'CREATOR'
  | 'DOCTOR'
  | 'MODERATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

// GET /api/users/me 응답 (UserResponse)
export type User = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  role: UserRole;
};

// 로그인 후 클라이언트가 유지하는 최소 세션 정보
export type SessionUser = {
  userId: number;
  nickname: string;
  role: UserRole;
};

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type AdminUser = {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: '일반 회원',
  CREATOR: '크리에이터',
  DOCTOR: '전문가',
  MODERATOR: '모더레이터',
  ADMIN: '관리자',
  SUPER_ADMIN: '최고 관리자',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DELETED: '탈퇴',
};

export function isStaff(role: UserRole | undefined | null): boolean {
  return role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isModerator(role: UserRole | undefined | null): boolean {
  return role === 'MODERATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isAdmin(role: UserRole | undefined | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function isSuperAdmin(role: UserRole | undefined | null): boolean {
  return role === 'SUPER_ADMIN';
}

export const ASSIGNABLE_ROLES: UserRole[] = ['USER', 'MODERATOR', 'ADMIN'];
