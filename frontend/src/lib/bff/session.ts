import { NextResponse } from 'next/server';
import { isSessionEstablishingPath } from '@/lib/bff/security';

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
