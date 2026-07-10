'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import * as authApi from '@/lib/api/auth';
import {
  consumeOAuthReturnUrl,
  consumeOAuthState,
  getOAuthRedirectUri,
  isOAuthProvider,
} from '@/domain/auth/oauth';
import { getErrorMessage } from '@/lib/api/client';

function OAuthCallbackForm() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

      const expectedState = consumeOAuthState(providerParam);
      if (!expectedState || expectedState !== state) {
        setError('소셜 로그인 보안 검증에 실패했습니다. 다시 시도해 주세요.');
        return;
      }

      try {
        const result = await authApi.oauthLogin(
          providerParam,
          code,
          getOAuthRedirectUri(providerParam),
        );

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
        setError(getErrorMessage(err));
      }
    };

    void run();
  }, [completeOAuthLogin, params.provider, router, searchParams]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-app flex-col items-center justify-center bg-cream px-6">
        <ErrorMessage message={error} />
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
    <div className="mx-auto flex min-h-screen max-w-app items-center justify-center bg-cream px-6">
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
