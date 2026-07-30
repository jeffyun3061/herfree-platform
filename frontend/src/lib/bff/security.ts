export const JSON_BODY_LIMIT = 1024 * 1024;
export const IMAGE_BODY_LIMIT = 10 * 1024 * 1024;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = [
  'auth/login',
  'auth/signup',
  'auth/oauth/',
  'auth/password-reset/',
  'events',
];

export function accessCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-herfree-access' : 'herfree-access';
}

export function csrfCookieName(isProduction: boolean): string {
  return isProduction ? '__Host-herfree-csrf' : 'herfree-csrf';
}

export function isUnsafeMethod(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function isCsrfExemptPath(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((candidate) =>
    candidate.endsWith('/') ? path.startsWith(candidate) : path === candidate,
  );
}

export function requestBodyLimit(path: string, contentType: string): number {
  return path === 'posts/images/upload' && contentType.includes('multipart/form-data')
    ? IMAGE_BODY_LIMIT
    : JSON_BODY_LIMIT;
}

export function hasValidOrigin(requestOrigin: string | null, expectedOrigin: string): boolean {
  if (!requestOrigin) return false;
  try {
    return new URL(requestOrigin).origin === new URL(expectedOrigin).origin;
  } catch {
    return false;
  }
}

export function resolveExternalOrigin(
  requestUrlOrigin: string,
  hostHeader: string | null,
  forwardedProtoHeader: string | null,
  isProduction: boolean,
): string | null {
  if (!hostHeader) return null;

  try {
    const requestProtocol = new URL(requestUrlOrigin).protocol.replace(':', '');
    const forwardedProtocol = forwardedProtoHeader?.split(',')[0]?.trim().toLowerCase();
    const protocol = isProduction
      ? 'https'
      : (forwardedProtocol === 'http' || forwardedProtocol === 'https'
        ? forwardedProtocol
        : requestProtocol);
    return new URL(`${protocol}://${hostHeader}`).origin;
  } catch {
    return null;
  }
}

export function hasValidCsrfToken(
  cookieToken: string | undefined,
  headerToken: string | null,
): boolean {
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

export function isSessionEstablishingPath(path: string): boolean {
  return path === 'auth/login'
    || path === 'auth/oauth/complete-profile'
    || /^auth\/oauth\/(kakao|google|naver)$/.test(path);
}

export function shouldClearSession(path: string, method: string): boolean {
  return (path === 'auth/logout' && method.toUpperCase() === 'POST')
    || (path === 'users/me' && method.toUpperCase() === 'DELETE')
    || path === 'users/me/password';
}

export function shouldAlwaysClearSession(path: string, method: string): boolean {
  return path === 'auth/logout' && method.toUpperCase() === 'POST';
}
