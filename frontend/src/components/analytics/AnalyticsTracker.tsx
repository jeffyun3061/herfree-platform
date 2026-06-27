'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureEvent, type AnalyticsEventName } from '@/lib/analytics';

function eventForHref(href: string): AnalyticsEventName | null {
  if (href.includes('open.kakao.com')) return 'consult_click';
  if (href.startsWith('/signup')) return 'signup_click';
  if (href.startsWith('/login')) return 'login_click';
  if (href.startsWith('/journal')) return 'journal_start_click';
  if (href.startsWith('/community')) return 'community_open';
  if (href.startsWith('/qna')) return 'qna_open';
  if (href.startsWith('/contents')) return 'content_open';
  if (href.startsWith('/videos')) return 'video_open';
  return null;
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const route = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    captureEvent('page_view', route);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute('href') ?? '';
      const eventName = eventForHref(href);
      // 링크 클릭은 목적지만 남기고, 화면에 입력한 내용은 수집하지 않는다.
      if (eventName) captureEvent(eventName, href);
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
