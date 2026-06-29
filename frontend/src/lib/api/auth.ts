import type {
  LoginRequest,
  LoginResult,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  SignupRequest,
} from '@/domain/auth/types';
import { request } from '@/lib/api/client';

export function signup(input: SignupRequest): Promise<void> {
  return request<void>('/api/auth/signup', { method: 'POST', body: input });
}

export function login(input: LoginRequest): Promise<LoginResult> {
  return request<LoginResult>('/api/auth/login', { method: 'POST', body: input });
}

export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' });
}

export async function requestPasswordReset(input: PasswordResetRequest): Promise<string> {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8080');
  const response = await fetch(`${base}/api/auth/password-reset/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const envelope = (await response.json()) as { success?: boolean; message?: string };
  if (!response.ok || envelope.success === false) {
    throw new Error(envelope.message ?? '요청을 처리하지 못했습니다.');
  }
  return envelope.message ?? '등록된 이메일이면 비밀번호 재설정 안내를 보냈습니다. 메일함을 확인해 주세요.';
}

export function confirmPasswordReset(input: PasswordResetConfirmRequest): Promise<void> {
  return request<void>('/api/auth/password-reset/confirm', { method: 'POST', body: input });
}
