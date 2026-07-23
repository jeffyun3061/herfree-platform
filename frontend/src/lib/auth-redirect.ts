/** 세션 만료 등 — SPA 내비게이션으로 이동 (staging Basic Auth 전체 새로고침 401 방지) */

export const AUTH_REDIRECT_EVENT = 'herfree:auth-redirect';

export function publishAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<string>(AUTH_REDIRECT_EVENT, { detail: path }));
}
