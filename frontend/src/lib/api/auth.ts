import type { LoginRequest, LoginResult, SignupRequest } from '@/domain/auth/types';
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
