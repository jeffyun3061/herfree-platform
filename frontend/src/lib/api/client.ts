import type { ApiEnvelope } from '@/domain/common/types';
import { publishAuthRedirect } from '@/lib/auth-redirect';
import { publishAppNotice } from '@/lib/app-notice';
import { clearAuth, getAccessToken } from '@/lib/auth-storage';

/**
 * 브라우저에서는 항상 현재 페이지 origin + /api 프록시를 사용한다.
 * (모바일/LAN/ngrok에서 localhost:8080 직접 호출·CORS 403 방지)
 */
function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured || 'http://localhost:8080';
}

function buildRequestHeaders(path: string, tokenAtRequest: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  const attachAuth = Boolean(tokenAtRequest) && !isPublicAuthPath(path);

  if (attachAuth) {
    headers.Authorization = `Bearer ${tokenAtRequest}`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = '1';
    }
  }

  return headers;
}

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

function authPathErrorMessage(status: number, serverMessage?: string): string {
  if (serverMessage) return serverMessage;
  if (status === 401) return '이메일 또는 비밀번호를 확인해 주세요.';
  if (status === 403) {
    return '서버 연결이 거부됐습니다. PC와 폰이 같은 Wi-Fi인지, 백엔드가 실행 중인지 확인해 주세요.';
  }
  if (status === 409) return '이미 가입된 이메일이거나 사용 중인 닉네임입니다.';
  if (status === 400) return '입력값을 확인해 주세요.';
  if (status === 429) return '로그인 시도 횟수를 초과했습니다. 30분 후 다시 시도해 주세요.';
  if (status >= 500) return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  return '요청을 처리하지 못했습니다.';
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error) return error;
  if (isApiError(error)) {
    if (error.status === 0) return error.message;
    if (error.message) return error.message;
    if (error.status === 401) return '로그인이 필요합니다.';
    if (error.status === 403) return '접근 권한이 없습니다.';
    if (error.status === 404) return '요청한 내용을 찾을 수 없습니다.';
    if (error.status === 409) return error.message || '이미 처리된 요청입니다.';
    if (error.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    if (error.status >= 500) {
      return '잠시 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
    }
    return error.message || '요청을 처리하지 못했습니다.';
  }
  if (error instanceof Error && error.message) return error.message;
  return '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

type QueryValue = string | number | boolean | undefined | null;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
};

const API_TIMEOUT_MS = 15_000;
const MULTIPART_TIMEOUT_MS = 30_000;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(path, `${resolveApiBaseUrl()}/`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function handleUnauthorized(hadToken: boolean, tokenAtRequest: string | null): void {
  if (!hadToken || typeof window === 'undefined') return;
  if (tokenAtRequest && getAccessToken() !== tokenAtRequest) return;

  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/signup')) return;

  const publicPath =
    path === '/' ||
    path.startsWith('/community') ||
    path.startsWith('/contents') ||
    path.startsWith('/videos') ||
    path.startsWith('/qna') ||
    path.startsWith('/notice') ||
    path.startsWith('/terms') ||
    path.startsWith('/privacy') ||
    path.startsWith('/consult');

  clearAuth();

  if (publicPath) {
    return;
  }

  publishAppNotice('session_expired');

  if (!path.startsWith('/login')) {
    const from = encodeURIComponent(path + window.location.search);
    publishAuthRedirect(`/login?reason=session_expired&from=${from}`);
  }
}

function shouldInvalidateSessionOn401(path: string): boolean {
  return path !== '/api/users/me/password';
}

function isPublicAuthPath(path: string): boolean {
  return (
    path.startsWith('/api/auth/signup') ||
    path.startsWith('/api/auth/login') ||
    path.startsWith('/api/auth/oauth') ||
    path.startsWith('/api/auth/password-reset')
  );
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const tokenAtRequest = getAccessToken();
  const headers = buildRequestHeaders(path, tokenAtRequest);

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw createApiError(0, '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw createApiError(0, '서버에 연결할 수 없습니다. Wi-Fi·서버 실행 상태를 확인해 주세요.');
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (response.status === 401 && !isPublicAuthPath(path) && shouldInvalidateSessionOn401(path)) {
    handleUnauthorized(Boolean(tokenAtRequest), tokenAtRequest);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  let envelope: ApiEnvelope<T> | null = null;

  if (contentType.includes('application/json')) {
    try {
      envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
      envelope = null;
    }
  }

  if (!response.ok || !envelope || envelope.success === false) {
    const serverMessage = envelope?.message;
    const message = isPublicAuthPath(path)
      ? authPathErrorMessage(response.status, serverMessage)
      : (serverMessage ??
        (response.status === 401
          ? '인증이 필요합니다.'
          : response.status === 403
            ? '접근 권한이 없습니다.'
            : getErrorMessage(createApiError(response.status, ''))));
    throw createApiError(response.status || 500, message);
  }

  return envelope.data;
}

/** multipart/form-data 업로드 — Content-Type은 브라우저가 boundary 포함해 설정 */
export async function requestMultipart<T>(path: string, formData: FormData): Promise<T> {
  const tokenAtRequest = getAccessToken();
  const headers = buildRequestHeaders(path, tokenAtRequest);

  let response: Response;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), MULTIPART_TIMEOUT_MS);
  try {
    response = await fetch(buildUrl(path), {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw createApiError(0, '파일 전송 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해 주세요.');
    }
    throw createApiError(0, '서버에 연결할 수 없습니다. Wi-Fi·서버 실행 상태를 확인해 주세요.');
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (response.status === 401 && shouldInvalidateSessionOn401(path)) {
    handleUnauthorized(Boolean(tokenAtRequest), tokenAtRequest);
  }

  const contentType = response.headers.get('content-type') ?? '';
  let envelope: ApiEnvelope<T> | null = null;

  if (contentType.includes('application/json')) {
    try {
      envelope = (await response.json()) as ApiEnvelope<T>;
    } catch {
      envelope = null;
    }
  }

  if (!response.ok || !envelope || envelope.success === false) {
    const serverMessage = envelope?.message;
    const message =
      serverMessage ??
      (response.status === 401
        ? '인증이 필요합니다.'
        : response.status === 403
          ? '접근 권한이 없습니다.'
          : getErrorMessage(createApiError(response.status, '')));
    throw createApiError(response.status || 500, message);
  }

  return envelope.data;
}
