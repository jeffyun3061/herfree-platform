import type { SessionUser } from '@/domain/user/types';

// 토큰·세션 저장 키를 한곳에 모아 오타로 인한 키 불일치를 방지한다
const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const SESSION_USER_KEY = 'sessionUser';
const REMEMBERED_EMAIL_KEY = 'rememberedEmail';

// 로그인·가입 직후 이전 API 응답이 새 세션을 덮어쓰지 않도록 세대를 추적한다
let authEpoch = 0;

export function getAuthEpoch(): number {
  return authEpoch;
}

export function bumpAuthEpoch(): number {
  authEpoch += 1;
  return authEpoch;
}

// accessToken/sessionUser는 브라우저 종료 뒤 남지 않도록 sessionStorage에만 둔다.
// rememberedEmail처럼 민감도가 낮은 편의 값만 localStorage에 남긴다.
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getSessionUser(): SessionUser | null {
  if (!isBrowser()) return null;
  const raw = window.sessionStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function getRememberedEmail(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
}

export function setRememberedEmail(email: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
}

export function clearRememberedEmail(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

export function clearAuth(): void {
  if (!isBrowser()) return;
  bumpAuthEpoch();
  window.sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(SESSION_USER_KEY);
  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_USER_KEY);
  window.dispatchEvent(new CustomEvent('herfree:auth-cleared'));
}
