/** 앱 전역 일회성 알림 — sessionStorage + CustomEvent */

export type AppNoticeKind = 'session_expired' | 'login_required';

const SESSION_NOTICE_KEY = 'herfree:session-notice';
export const APP_NOTICE_EVENT = 'herfree:app-notice';

export function publishAppNotice(kind: AppNoticeKind): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_NOTICE_KEY, kind);
  window.dispatchEvent(new CustomEvent<AppNoticeKind>(APP_NOTICE_EVENT, { detail: kind }));
}

export function consumeAppNotice(): AppNoticeKind | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(SESSION_NOTICE_KEY);
  if (!value) return null;
  sessionStorage.removeItem(SESSION_NOTICE_KEY);
  if (value === 'session_expired' || value === 'login_required') {
    return value;
  }
  return null;
}

export function getAppNoticeMessage(kind: AppNoticeKind): string {
  switch (kind) {
    case 'session_expired':
      return '로그인이 만료됐어요. 다시 로그인해 주세요.';
    case 'login_required':
      return '로그인이 필요합니다.';
    default:
      return '';
  }
}
