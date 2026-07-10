'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialLoginBelowEmail } from '@/components/auth/SocialLoginButtons';
import { SignupAgreementFields, isRequiredSignupAgreed, type SignupAgreementState } from '@/components/auth/SignupAgreementFields';
import { NicknameFieldWithCheck } from '@/components/auth/NicknameFieldWithCheck';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateSignup } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

function resolveReturnUrl(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/journal';
  if (from.startsWith('/login') || from.startsWith('/signup')) return '/journal';
  return from;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }
    if (nicknameAvailable !== true) {
      setError('닉네임 중복확인을 먼저 해 주세요.');
      return;
    }
    const errors = validateSignup({ email, password, passwordConfirm, nickname });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ email, password, nickname });
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      backHref="/"
      title="헤르프리에 오신 걸 환영해요"
      subtitle="익명 커뮤니티와 개인 기록을 한 곳에서 관리할 수 있어요."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 flex flex-col gap-4">
        <Input
          label="이메일"
          type="email"
          required
          autoComplete="email"
          placeholder="이메일을 입력해 주세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="비밀번호"
          type="password"
          required
          autoComplete="new-password"
          placeholder="8자 이상 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={fieldErrors.passwordConfirm}
        />
        <NicknameFieldWithCheck
          nickname={nickname}
          onNicknameChange={setNickname}
          error={fieldErrors.nickname}
          onAvailabilityChange={setNicknameAvailable}
        />

        <SignupAgreementFields value={agreements} onChange={setAgreements} />

        {error && <ErrorMessage message={error} />}
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting || !allRequiredAgreed}>
          {isSubmitting ? '가입 중...' : '가입 완료'}
        </Button>
        <p className="text-center text-sm text-[#5C645A]">
          이미 계정이 있나요?{' '}
          <Link href="/login" className="font-semibold text-[#0B3B36]">
            로그인
          </Link>
        </p>
      </form>

      <SocialLoginBelowEmail
        returnUrl={resolveReturnUrl(searchParams.get('from'))}
        mode="signup"
        className="mt-7"
      />
    </AuthScreenShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
