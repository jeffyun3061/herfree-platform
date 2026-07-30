import { NextRequest, NextResponse } from 'next/server';
import {
  accessCookieName,
  csrfCookieName,
  hasValidCsrfToken,
  hasValidOrigin,
  isCsrfExemptPath,
  isSessionEstablishingPath,
  isUnsafeMethod,
  requestBodyLimit,
  resolveExternalOrigin,
  shouldClearSession,
} from '@/lib/bff/security';

const REQUEST_HEADER_ALLOWLIST = new Set([
  'accept',
  'accept-language',
  'content-type',
  'user-agent',
  'x-request-id',
]);
const RESPONSE_HEADER_ALLOWLIST = new Set([
  'cache-control',
  'content-disposition',
  'content-length',
  'content-type',
  'etag',
  'expires',
  'last-modified',
  'pragma',
  'x-request-id',
]);
const production = process.env.NODE_ENV === 'production';
const ACCESS_COOKIE = accessCookieName(production);
const CSRF_COOKIE = csrfCookieName(production);

function resolveApiTarget(): string | null {
  const configuredTarget = process.env.API_REWRITE_TARGET?.trim();
  if (!configuredTarget) {
    return production ? null : 'http://127.0.0.1:8080';
  }
  try {
    const target = new URL(configuredTarget);
    if (production && target.protocol !== 'https:') return null;
    return target.origin;
  } catch {
    return null;
  }
}

function errorResponse(status: number, message: string) {
  return NextResponse.json({ success: false, message, data: null }, { status });
}

async function readBodyWithLimit(
  body: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<ArrayBuffer | undefined> {
  if (!body) return undefined;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error('BODY_TOO_LARGE');
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer;
}

function setSessionCookies(response: NextResponse, accessToken: string) {
  const common = {
    secure: production,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60,
  };
  response.cookies.set(ACCESS_COOKIE, accessToken, { ...common, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), { ...common, httpOnly: false });
}

function clearSessionCookies(response: NextResponse) {
  const options = { secure: production, sameSite: 'strict' as const, path: '/', maxAge: 0 };
  response.cookies.set(ACCESS_COOKIE, '', { ...options, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, '', { ...options, httpOnly: false });
  response.headers.set('Clear-Site-Data', '"cache", "storage"');
}

async function sessionResponse(backendResponse: Response, path: string): Promise<NextResponse | null> {
  if (!isSessionEstablishingPath(path)
      || !backendResponse.ok
      || !(backendResponse.headers.get('content-type') ?? '').includes('application/json')) {
    return null;
  }
  const payload = await backendResponse.json() as {
    success?: boolean;
    message?: string;
    data?: Record<string, unknown> | null;
  };
  const accessToken = typeof payload.data?.accessToken === 'string'
    ? payload.data.accessToken
    : null;
  if (payload.data) {
    delete payload.data.accessToken;
    delete payload.data.tokenType;
    delete payload.data.expiresIn;
  }
  const response = NextResponse.json(payload, { status: backendResponse.status });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Pragma', 'no-cache');
  if (accessToken) setSessionCookies(response, accessToken);
  return response;
}

async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const apiTarget = resolveApiTarget();
  if (!apiTarget) {
    return errorResponse(503, 'API_REWRITE_TARGET must be a valid HTTPS origin in production.');
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (isUnsafeMethod(request.method)) {
    const externalOrigin = resolveExternalOrigin(
      request.nextUrl.origin,
      request.headers.get('host'),
      request.headers.get('x-forwarded-proto'),
      production,
    );
    if (!externalOrigin || !hasValidOrigin(request.headers.get('origin'), externalOrigin)) {
      return errorResponse(403, 'Invalid request origin.');
    }
    if (accessToken && !isCsrfExemptPath(path)
        && !hasValidCsrfToken(
          request.cookies.get(CSRF_COOKIE)?.value,
          request.headers.get('x-herfree-csrf'),
        )) {
      return errorResponse(403, 'Invalid CSRF token.');
    }
  }

  const contentType = request.headers.get('content-type') ?? '';
  const limit = requestBodyLimit(path, contentType);
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    return errorResponse(413, 'Request body is too large.');
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (REQUEST_HEADER_ALLOWLIST.has(key.toLowerCase())) headers.set(key, value);
  });
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  };
  if (isUnsafeMethod(request.method)) {
    try {
      init.body = await readBodyWithLimit(request.body, limit);
    } catch {
      return errorResponse(413, 'Request body is too large.');
    }
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(
      `${apiTarget}/api/${path}${request.nextUrl.search}`,
      init,
    );
  } catch {
    return errorResponse(502, 'Unable to connect to the API server.');
  }

  const established = await sessionResponse(backendResponse.clone(), path);
  if (established) return established;

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (RESPONSE_HEADER_ALLOWLIST.has(key.toLowerCase())) responseHeaders.set(key, value);
  });
  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
  if (backendResponse.ok && shouldClearSession(path, request.method)) {
    clearSessionCookies(response);
  }
  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function resolvePath(context: RouteContext): Promise<string[]> {
  const params = await context.params;
  return params.path ?? [];
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
export async function POST(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyToBackend(request, await resolvePath(context));
}
