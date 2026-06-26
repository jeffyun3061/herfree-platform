'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredAgreed = agreeTerms && agreePrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
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
    <div className="auth-screen bg-[#F3EDE3]">
      <div className="flex flex-col items-center text-center">
        <BrandMark variant="auth" size="lg" />
        <h1 className="hf-display mt-8 text-[26px] font-extrabold leading-tight text-[#1E2621]">
          함께 시작해요
        </h1>
        <p className="mt-2 text-sm text-[#5C645A]">익명 커뮤니티와 개인 기록을 한 곳에서 관리할 수 있어요.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 flex flex-1 flex-col gap-4">
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
        <Input
          label="닉네임"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="커뮤니티에 표시될 이름"
          error={fieldErrors.nickname}
        />

        <div className="mt-2 space-y-3 rounded-[18px] border border-[#ECE5D8] bg-white p-4 shadow-card">
          <label className="flex items-start gap-3 text-sm text-[#1E2621]">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
            />
            <span>
              <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
              <Link href="/terms" className="underline underline-offset-2">
                이용약관
              </Link>
              에 동의합니다.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[#1E2621]">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
            />
            <span>
              <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
              <Link href="/privacy" className="underline underline-offset-2">
                개인정보처리방침
              </Link>
              에 동의합니다.
            </span>
          </label>
        </div>

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
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
