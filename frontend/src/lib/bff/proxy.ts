import { NextRequest, NextResponse } from 'next/server';
import {
  accessCookieName,
  csrfCookieName,
  hasValidCsrfToken,
  hasValidOrigin,
  isCsrfExemptPath,
  isUnsafeMethod,
  requestBodyLimit,
  resolveExternalOrigin,
  shouldAlwaysClearSession,
  shouldClearSession,
} from '@/lib/bff/security';
import { readBodyWithLimit } from '@/lib/bff/body-limit';
import { errorResponse } from '@/lib/bff/errors';
import { buildBackendRequestHeaders, buildBackendResponseHeaders } from '@/lib/bff/headers';
import {
  clearSessionCookies,
  createSessionResponse,
  type SessionCookieConfig,
} from '@/lib/bff/session';

const production = process.env.NODE_ENV === 'production';
const sessionConfig: SessionCookieConfig = {
  production,
  accessCookie: accessCookieName(production),
  csrfCookie: csrfCookieName(production),
};

function resolveApiTarget(): string | null {
  const configuredTarget = process.env.API_REWRITE_TARGET?.trim();
  if (!configuredTarget) return production ? null : 'http://127.0.0.1:8080';

  try {
    const target = new URL(configuredTarget);
    if (production && target.protocol !== 'https:') return null;
    return target.origin;
  } catch {
    return null;
  }
}

export async function proxyToBackend(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const apiTarget = resolveApiTarget();
  if (!apiTarget) {
    return errorResponse(503, 'API_REWRITE_TARGET must be a valid HTTPS origin in production.');
  }

  const accessToken = request.cookies.get(sessionConfig.accessCookie)?.value;
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
    if (
      accessToken &&
      !isCsrfExemptPath(path) &&
      !hasValidCsrfToken(
        request.cookies.get(sessionConfig.csrfCookie)?.value,
        request.headers.get('x-herfree-csrf'),
      )
    ) {
      return errorResponse(403, 'Invalid CSRF token.');
    }
  }

  const contentType = request.headers.get('content-type') ?? '';
  const limit = requestBodyLimit(path, contentType);
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    return errorResponse(413, 'Request body is too large.');
  }

  const init: RequestInit = {
    method: request.method,
    headers: buildBackendRequestHeaders(request, accessToken),
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
    backendResponse = await fetch(`${apiTarget}/api/${path}${request.nextUrl.search}`, init);
  } catch {
    const response = errorResponse(502, 'Unable to connect to the API server.');
    if (shouldAlwaysClearSession(path, request.method)) {
      clearSessionCookies(response, sessionConfig);
    }
    return response;
  }

  const established = await createSessionResponse(
    backendResponse.clone(),
    path,
    sessionConfig,
  );
  if (established) return established;

  const response = new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: buildBackendResponseHeaders(backendResponse),
  });
  if (
    (backendResponse.ok && shouldClearSession(path, request.method)) ||
    shouldAlwaysClearSession(path, request.method)
  ) {
    clearSessionCookies(response, sessionConfig);
  }
  return response;
}
