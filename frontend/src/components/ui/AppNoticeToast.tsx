'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthEntryLink } from '@/components/auth/AuthEntryLink';
import {
  APP_NOTICE_EVENT,
  consumeAppNotice,
  getAppNoticeMessage,
  type AppNoticeKind,
} from '@/lib/app-notice';
import { cn } from '@/lib/cn';

const AUTO_DISMISS_MS = 6000;

export function AppNoticeToast() {
  const [notice, setNotice] = useState<AppNoticeKind | null>(null);

  const showNotice = useCallback((kind: AppNoticeKind) => {
    setNotice(kind);
  }, []);

  useEffect(() => {
    const pending = consumeAppNotice();
    if (pending) showNotice(pending);

    const onEvent = (event: Event) => {
      const detail = (event as CustomEvent<AppNoticeKind>).detail;
      if (detail) showNotice(detail);
    };

    window.addEventListener(APP_NOTICE_EVENT, onEvent);
    return () => window.removeEventListener(APP_NOTICE_EVENT, onEvent);
  }, [showNotice]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  const message = getAppNoticeMessage(notice);
  const showLoginLink = notice === 'session_expired' || notice === 'login_required';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+3.75rem)] z-[200] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex max-w-app items-start gap-3 rounded-xl border border-amber-200',
          'bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 shadow-lg',
        )}
      >
        <p className="flex-1">{message}</p>
        {showLoginLink && (
          <AuthEntryLink
            href="/login"
            className="shrink-0 font-semibold text-primary underline-offset-2 hover:underline"
            onClick={() => setNotice(null)}
          >
            로그인
          </AuthEntryLink>
        )}
        <button
          type="button"
          className="shrink-0 text-amber-700/70 hover:text-amber-900"
          aria-label="닫기"
          onClick={() => setNotice(null)}
        >
          ×
        </button>
      </div>
    </div>
  );
}
