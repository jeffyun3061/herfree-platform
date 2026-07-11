export type OAuthProvider = 'kakao' | 'google' | 'naver';

const OAUTH_STATE_PREFIX = 'herfree_oauth_state_';
const OAUTH_RETURN_URL_KEY = 'herfree_oauth_return_url';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  kakao: '카카오',
  google: 'Google',
  naver: '네이버',
};

export function getOAuthProviderLabel(provider: OAuthProvider): string {
  return PROVIDER_LABELS[provider];
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'kakao' || value === 'google' || value === 'naver';
}

export function getOAuthRedirectUri(provider: OAuthProvider): string {
  if (typeof window === 'undefined') {
    return `http://localhost:3000/auth/callback/${provider}`;
  }
  return `${window.location.origin}/auth/callback/${provider}`;
}

function getOAuthClientId(provider: OAuthProvider): string {
  const envMap: Record<OAuthProvider, string | undefined> = {
    kakao: process.env.NEXT_PUBLIC_OAUTH_KAKAO_CLIENT_ID,
    google: process.env.NEXT_PUBLIC_OAUTH_GOOGLE_CLIENT_ID,
    naver: process.env.NEXT_PUBLIC_OAUTH_NAVER_CLIENT_ID,
  };
  return envMap[provider]?.trim() ?? '';
}

export function isOAuthClientConfigured(provider: OAuthProvider): boolean {
  return Boolean(getOAuthClientId(provider));
}

export function buildOAuthAuthorizeUrl(provider: OAuthProvider, state: string): string {
  const clientId = getOAuthClientId(provider);
  const redirectUri = getOAuthRedirectUri(provider);

  if (!clientId) {
    throw new Error(`${PROVIDER_LABELS[provider]} 로그인 키가 설정되지 않았습니다.`);
  }

  if (provider === 'kakao') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
  }

  if (provider === 'naver') {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function rememberOAuthReturnUrl(returnUrl: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(OAUTH_RETURN_URL_KEY, returnUrl);
}

export function consumeOAuthReturnUrl(): string {
  if (typeof window === 'undefined') return '/';
  const value = sessionStorage.getItem(OAUTH_RETURN_URL_KEY) ?? '/';
  sessionStorage.removeItem(OAUTH_RETURN_URL_KEY);
  return value;
}

export function storeOAuthState(provider: OAuthProvider, state: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${OAUTH_STATE_PREFIX}${provider}`, state);
}

export function peekOAuthState(provider: OAuthProvider): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(`${OAUTH_STATE_PREFIX}${provider}`);
}

export function clearOAuthState(provider: OAuthProvider): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${OAUTH_STATE_PREFIX}${provider}`);
}

export function consumeOAuthState(provider: OAuthProvider): string | null {
  if (typeof window === 'undefined') return null;
  const key = `${OAUTH_STATE_PREFIX}${provider}`;
  const value = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  return value;
}

export function startOAuthLogin(provider: OAuthProvider, returnUrl: string): void {
  const state = crypto.randomUUID();
  storeOAuthState(provider, state);
  rememberOAuthReturnUrl(returnUrl);
  window.location.assign(buildOAuthAuthorizeUrl(provider, state));
}
