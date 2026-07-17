'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as authApi from '@/lib/api/auth';
import {
  clearOAuthState,
  consumeOAuthReturnUrl,
  getOAuthRedirectUri,
  isOAuthProvider,
  peekOAuthState,
} from '@/domain/auth/oauth';
import { getErrorMessage } from '@/lib/api/client';

function oauthCallbackGuardKey(provider: string, code: string) {
  return `herfree_oauth_handled_${provider}_${code}`;
}

function OAuthCallbackForm() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      const providerParam = params.provider;
      if (!isOAuthProvider(providerParam)) {
        setError('지원하지 않는 소셜 로그인입니다.');
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error');

      if (oauthError) {
        setError('소셜 로그인이 취소되었거나 실패했습니다.');
        return;
      }

      if (!code || !state) {
        setError('소셜 로그인 정보가 올바르지 않습니다.');
        return;
      }

      const guardKey = oauthCallbackGuardKey(providerParam, code);
      if (sessionStorage.getItem(guardKey)) {
        return;
      }
      sessionStorage.setItem(guardKey, '1');

      const expectedState = peekOAuthState(providerParam);
      if (!expectedState || expectedState !== state) {
        setError('소셜 로그인 보안 검증에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      try {
        const result = await authApi.oauthLogin(
          providerParam,
          code,
          getOAuthRedirectUri(providerParam),
          state,
        );

        clearOAuthState(providerParam);

        if (result.needsProfile && result.profileCompletionToken) {
          const returnUrl = consumeOAuthReturnUrl();
          const next = new URL('/signup/oauth', window.location.origin);
          next.searchParams.set('token', result.profileCompletionToken);
          next.searchParams.set('from', returnUrl);
          router.replace(next.pathname + next.search);
          return;
        }

        completeOAuthLogin(result);
        router.replace(consumeOAuthReturnUrl());
      } catch (err) {
        sessionStorage.removeItem(guardKey);
        const message = getErrorMessage(err);
        const redirectUri = getOAuthRedirectUri(providerParam);
        setError(
          `${message}\n\n콘솔 Redirect URI가 아래와 정확히 일치하는지 확인해 주세요:\n${redirectUri}`,
        );
      }
    };

    void run();
  }, [completeOAuthLogin, params.provider, router, searchParams]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-app flex-col items-center justify-center bg-cream px-6 lg:min-h-[min(844px,calc(100vh-4rem))]">
        <ErrorMessage message={error} className="whitespace-pre-wrap text-left" />
        <button
          type="button"
          onClick={() => router.replace('/login')}
          className="mt-6 text-sm font-semibold text-primary"
        >
          로그인 화면으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-app items-center justify-center bg-cream px-6 lg:min-h-[min(844px,calc(100vh-4rem))]">
      <LoadingSpinner label="소셜 로그인 처리 중..." />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="불러오는 중..." />}>
      <OAuthCallbackForm />
    </Suspense>
  );
}
