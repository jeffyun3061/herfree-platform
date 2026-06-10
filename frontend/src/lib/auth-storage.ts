import type { SessionUser } from '@/domain/user/types';

// 토큰·세션 저장 키를 한곳에 모아 오타로 인한 키 불일치를 방지한다
const ACCESS_TOKEN_KEY = 'accessToken';
const SESSION_USER_KEY = 'sessionUser';

// SSR 환경에서는 localStorage가 없으므로 항상 브라우저 여부를 먼저 확인한다
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_USER_KEY);
}
