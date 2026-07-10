import type { UserRole } from '@/domain/user/types';

export type SignupRequest = {
  email: string;
  password: string;
  nickname: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
};

// POST /api/auth/login 응답 (LoginResponse)
export type LoginResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  nickname: string;
  role: UserRole;
};

export type OAuthLoginResult = {
  needsProfile: boolean;
  profileCompletionToken?: string | null;
  accessToken?: string | null;
  tokenType?: string | null;
  expiresIn?: number | null;
  userId?: number | null;
  nickname?: string | null;
  role?: UserRole | null;
};

export type OAuthCompleteProfileRequest = {
  profileCompletionToken: string;
  nickname: string;
};
