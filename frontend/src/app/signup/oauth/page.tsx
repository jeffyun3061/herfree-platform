'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SignupAgreementFields, isRequiredSignupAgreed, type SignupAgreementState } from '@/components/auth/SignupAgreementFields';
import { NicknameFieldWithCheck } from '@/components/auth/NicknameFieldWithCheck';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateNickname } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

function resolveReturnUrl(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/journal';
  if (from.startsWith('/login') || from.startsWith('/signup')) return '/journal';
  return from;
}

function OAuthSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuthProfile } = useAuth();
  const profileCompletionToken = searchParams.get('token') ?? '';
  const [nickname, setNickname] = useState('');
  const [agreements, setAgreements] = useState<SignupAgreementState>({
    agreeTerms: false,
    agreePrivacy: false,
    agreeAge: false,
    agreeMarketing: false,
  });
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredAgreed = isRequiredSignupAgreed(agreements);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileCompletionToken) {
      setError('소셜 가입을 이어서 진행할 수 없습니다. 다시 로그인해 주세요.');
      return;
    }

    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }

    if (nicknameAvailable !== true) {
      setError('닉네임 중복확인을 먼저 해 주세요.');
      return;
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setFieldErrors({ nickname: nicknameError });
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);

    try {
      await completeOAuthProfile(profileCompletionToken, nickname.trim(), agreements);
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profileCompletionToken) {
    return (
      <AuthScreenShell
        backHref="/login"
        title="프로필 설정"
        subtitle="소셜 가입을 이어서 진행할 수 없습니다."
      >
        <div className="mt-8">
          <ErrorMessage message="소셜 가입을 이어서 진행할 수 없습니다. 다시 로그인해 주세요." />
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary">
            로그인 화면으로
          </Link>
        </div>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell
      backHref="/login"
      title="거의 다 됐어요"
      subtitle="커뮤니티에 표시될 닉네임과 약관 동의만 남았어요."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 flex flex-col gap-4">
        <NicknameFieldWithCheck
          nickname={nickname}
          onNicknameChange={setNickname}
          error={fieldErrors.nickname}
          onAvailabilityChange={setNicknameAvailable}
        />

        <SignupAgreementFields value={agreements} onChange={setAgreements} />

        {error && <ErrorMessage message={error} />}
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting || !allRequiredAgreed}>
          {isSubmitting ? '가입 완료 중...' : '시작하기'}
        </Button>
      </form>
    </AuthScreenShell>
  );
}

export default function OAuthSignupPage() {
  return (
    <Suspense fallback={null}>
      <OAuthSignupForm />
    </Suspense>
  );
}
