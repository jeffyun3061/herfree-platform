'use client';

import { getAccessToken } from '@/lib/auth-storage';

export type AnalyticsEventName =
  | 'page_view'
  | 'signup_click'
  | 'login_click'
  | 'consult_click'
  | 'journal_start_click'
  | 'community_open'
  | 'qna_open'
  | 'content_open'
  | 'video_open';

const SESSION_KEY = 'herfree_analytics_session';
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://app.posthog.com';

function canTrack(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.doNotTrack !== '1';
}

function getSessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

function currentRoute(): string {
  return `${window.location.pathname}${window.location.search}`;
}

async function sendBackendEvent(eventName: AnalyticsEventName, route: string, sessionId: string) {
  const token = getAccessToken();
  await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ eventName, route, sessionId }),
    keepalive: true,
  });
}

async function sendPostHogEvent(eventName: AnalyticsEventName, route: string, sessionId: string) {
  if (!POSTHOG_KEY) return;

  // 외부 분석 도구에는 쿼리스트링과 자유입력값을 보내지 않는다.
  await fetch(`${POSTHOG_HOST.replace(/\/$/, '')}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: POSTHOG_KEY,
      event: eventName,
      distinct_id: sessionId,
      properties: {
        route: route.split('?')[0],
        app: 'herfree',
      },
    }),
    keepalive: true,
  });
}

export function captureEvent(eventName: AnalyticsEventName, route = currentRoute()): void {
  if (!canTrack()) return;

  try {
    const sessionId = getSessionId();
    void sendBackendEvent(eventName, route, sessionId).catch(() => undefined);
    void sendPostHogEvent(eventName, route, sessionId).catch(() => undefined);
  } catch {
    // 분석 실패가 기록·상담 같은 핵심 흐름을 막으면 안 된다.
  }
}
