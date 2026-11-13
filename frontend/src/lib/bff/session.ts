import { NextResponse } from 'next/server';
import { adminMfaCookieName, isSessionEstablishingPath } from '@/lib/bff/security';

export type SessionCookieConfig = {
  production: boolean;
  accessCookie: string;
  csrfCookie: string;
};

const DEFAULT_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const MAX_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function normalizeSessionMaxAge(expiresIn: unknown): number {
  if (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  return Math.min(Math.max(Math.floor(expiresIn), 1), MAX_SESSION_MAX_AGE_SECONDS);
}

export function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  maxAge: number,
  config: SessionCookieConfig,
) {
  const common = {
    secure: config.production,
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
  response.cookies.set(config.accessCookie, accessToken, { ...common, httpOnly: true });
  clearAdminMfaCookie(response, config);
  response.cookies.set(config.csrfCookie, crypto.randomUUID(), { ...common, httpOnly: false });
}

export function clearSessionCookies(
  response: NextResponse,
  config: SessionCookieConfig,
  clearBrowserStorage = true,
) {
  const options = { secure: config.production, sameSite: 'strict' as const, path: '/', maxAge: 0 };
  response.cookies.set(config.accessCookie, '', { ...options, httpOnly: true });
  response.cookies.set(config.csrfCookie, '', { ...options, httpOnly: false });
  clearAdminMfaCookie(response, config);
  if (clearBrowserStorage) {
    response.headers.set('Clear-Site-Data', '"cache", "storage"');
  }
}

export async function createSessionResponse(
  backendResponse: Response,
  path: string,
  config: SessionCookieConfig,
): Promise<NextResponse | null> {
  if (
    !isSessionEstablishingPath(path) ||
    !backendResponse.ok ||
    !(backendResponse.headers.get('content-type') ?? '').includes('application/json')
  ) {
    return null;
  }

  const payload = (await backendResponse.json()) as {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown> | null;
  };
  const accessToken = typeof payload.data?.accessToken === 'string'
    ? payload.data.accessToken
    : null;
  const maxAge = normalizeSessionMaxAge(payload.data?.expiresIn);

  if (payload.data) {
    delete payload.data.accessToken;
    delete payload.data.tokenType;
    delete payload.data.expiresIn;
  }

  const response = NextResponse.json(payload, { status: backendResponse.status });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  if (accessToken) setSessionCookies(response, accessToken, maxAge, config);
  return response;
}

export function clearAdminMfaCookie(response: NextResponse, config: SessionCookieConfig) {
  response.cookies.set(adminMfaCookieName(config.production), '', {
    secure: config.production, httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0,
  });
}

export async function createMfaSessionResponse(
  backendResponse: Response, path: string, config: SessionCookieConfig,
): Promise<NextResponse | null> {
  if (!/^auth\/admin-mfa\/(confirm|verify|recover)$/.test(path) || !backendResponse.ok
    || !(backendResponse.headers.get('content-type') ?? '').includes('application/json')) return null;
  const payload = await backendResponse.json() as { data?: { mfaToken?: unknown; expiresIn?: unknown } };
  const token = payload.data?.mfaToken;
  if (payload.data) delete payload.data.mfaToken;
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    const failed = NextResponse.json({ success: false, message: '추가 인증을 완료하지 못했습니다.' }, { status: 502 });
    failed.headers.set('Cache-Control', 'private, no-store');
    clearAdminMfaCookie(failed, config);
    return failed;
  }
  const response = NextResponse.json(payload, { status: backendResponse.status });
  response.headers.set('Cache-Control', 'private, no-store');
  if (typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)) {
    response.cookies.set(adminMfaCookieName(config.production), token, {
      secure: config.production, httpOnly: true, sameSite: 'strict', path: '/', maxAge: 900,
    });
  }
  return response;
}
