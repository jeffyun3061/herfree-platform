'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { safeInternalReturnPath } from '@/domain/auth/returnPath';
import { AuthEntryLink } from '@/components/auth/AuthEntryLink';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { EmailFieldWithCheck } from '@/components/auth/EmailFieldWithCheck';
import { SignupAgreementFields, isRequiredSignupAgreed, type SignupAgreementState } from '@/components/auth/SignupAgreementFields';
import { NicknameFieldWithCheck } from '@/components/auth/NicknameFieldWithCheck';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
  PASSWORD_HINT,
  PASSWORD_MAX_LENGTH,
  validateEmail,
  validatePassword,
  validateSignup,
} from '@/domain/auth/validate';
import { getErrorMessage, isApiError } from '@/lib/api/client';

function resolveReturnUrl(from: string | null): string {
  return safeInternalReturnPath(from, '/journal');
}

function withFieldError(
  errors: Record<string, string>,
  field: string,
  message: string | null,
): Record<string, string> {
  const next = { ...errors };
  if (message) next[field] = message;
  else delete next[field];
  return next;
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
    agreeSensitive: false,
    agreeAge: false,
    agreeMarketing: false,
    agreeHealthStatistics: false,
  });
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredAgreed = isRequiredSignupAgreed(agreements);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError(null);
    setFieldErrors((current) =>
      current.email ? withFieldError(current, 'email', validateEmail(value)) : current,
    );
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
    setFieldErrors((current) => {
      let next = current.password
        ? withFieldError(current, 'password', validatePassword(value))
        : current;
      if (current.passwordConfirm) {
        next = withFieldError(
          next,
          'passwordConfirm',
          passwordConfirm && value !== passwordConfirm ? '비밀번호가 일치하지 않습니다.' : null,
        );
      }
      return next;
    });
  };

  const handlePasswordConfirmChange = (value: string) => {
    setPasswordConfirm(value);
    setError(null);
    setFieldErrors((current) =>
      withFieldError(
        current,
        'passwordConfirm',
        value && password !== value ? '비밀번호가 일치하지 않습니다.' : null,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateSignup({ email, password, passwordConfirm, nickname });
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) {
      return;
    }
    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }
    if (emailAvailable !== true) {
      setError('이메일 중복확인을 먼저 해 주세요.');
      return;
    }
    if (nicknameAvailable !== true) {
      setError('닉네임 중복확인을 먼저 해 주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signup({ email, password, nickname, ...agreements });
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        if (err.message.includes('이메일')) {
          setFieldErrors((current) => withFieldError(
            current,
            'email',
            '이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해 주세요.',
          ));
          return;
        }
      }
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
        <EmailFieldWithCheck
          email={email}
          onEmailChange={handleEmailChange}
          error={fieldErrors.email}
          onAvailabilityChange={setEmailAvailable}
        />
        <Input
          label="비밀번호"
          type="password"
          required
          autoComplete="new-password"
          placeholder={`${PASSWORD_HINT} 입력`}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          maxLength={PASSWORD_MAX_LENGTH}
          hint={<span className="text-[11px] font-normal text-[#9A9F94]">{PASSWORD_HINT}</span>}
          error={fieldErrors.password}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          required
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => handlePasswordConfirmChange(e.target.value)}
          maxLength={PASSWORD_MAX_LENGTH}
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
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting || !allRequiredAgreed || emailAvailable !== true || nicknameAvailable !== true}>
          {isSubmitting ? '가입 중...' : '가입 완료'}
        </Button>
        <p className="text-center text-sm text-[#5C645A]">
          이미 계정이 있나요?{' '}
          <AuthEntryLink href="/login" className="font-semibold text-[#0B3B36]">
            로그인
          </AuthEntryLink>
        </p>
      </form>

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
