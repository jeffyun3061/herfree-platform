import type { ApiEnvelope } from '@/domain/common/types';
import { clearAuth, getAccessToken } from '@/lib/auth-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// Error 하위 클래스 대신 status 필드를 덧붙인 객체를 사용한다 (함수형 컨벤션 준수)
export type ApiError = Error & { status: number };

function createApiError(status: number, message: string): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.status = status;
  return error;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && error.name === 'ApiError';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

// 401 처리 — 토큰이 만료·위조된 경우 세션을 비우고 로그인 화면으로 보낸다.
// 토큰 없이 받은 401(로그인 실패 등)은 화면에서 메시지로 처리해야 하므로 리다이렉트하지 않는다.
function handleUnauthorized(hadToken: boolean): void {
  if (!hadToken || typeof window === 'undefined') return;
  clearAuth();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }
}

// 모든 API 호출이 거치는 단일 진입점 — 인증 헤더 첨부와 공통 응답 해석을 책임진다
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw createApiError(0, '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
  }

  if (response.status === 401) {
    handleUnauthorized(Boolean(token));
  }

  // 204 No Content — 삭제 API는 본문이 없으므로 바로 반환한다
  if (response.status === 204) {
    return undefined as T;
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope || !envelope.success) {
    const message = envelope?.message ?? '요청 처리 중 오류가 발생했습니다.';
    throw createApiError(response.status, message);
  }

  return envelope.data;
}
