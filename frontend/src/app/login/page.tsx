'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialLoginSection } from '@/components/auth/SocialLoginButtons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  validateLogin,
} from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';
import {
  clearRememberedEmail,
  getRememberedEmail,
  setRememberedEmail,
} from '@/lib/auth-storage';

function resolveReturnUrl(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/';
  if (from.startsWith('/login') || from.startsWith('/signup')) return '/';
  return from;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isReady, isLoggedIn, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnUrl = resolveReturnUrl(searchParams.get('from'));

  const sessionNotice =
    searchParams.get('reason') === 'session_expired'
      ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
      : searchParams.get('reason') === 'password_reset'
        ? '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.'
        : null;

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    router.replace(returnUrl);
  }, [isReady, isLoggedIn, router, returnUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateLogin({ email, password });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      if (rememberEmail) {
        setRememberedEmail(email);
      } else {
        clearRememberedEmail();
      }
      router.replace(returnUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenShell
      backHref="/"
      title="만나서 반가워요"
      subtitle="오늘도 담담하게."
    >
      {sessionNotice && (
        <div
          className="mt-5 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
          role="status"
        >
          {sessionNotice}
        </div>
      )}

      <SocialLoginSection returnUrl={returnUrl} mode="login" order="social-first" className="mt-7" />

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-7 flex flex-col gap-3.5">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="이메일을 입력해 주세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={EMAIL_MAX_LENGTH}
          error={fieldErrors.email}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해 주세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          maxLength={PASSWORD_MAX_LENGTH}
          error={fieldErrors.password}
        />

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[#5C645A]">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
            />
            이메일 저장
          </label>
          <Link href="/forgot-password" className="text-[12px] text-[#A6ABA0]">
            이메일/비밀번호 찾기
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>

      <p className="mt-auto pt-6 text-center text-[12.5px] text-[#9A9F94]">
        아직 계정이 없으신가요?{' '}
        <Link
          href={searchParams.get('from') ? `/signup?from=${encodeURIComponent(returnUrl)}` : '/signup'}
          className="font-semibold text-[#0B3B36]"
        >
          회원가입
        </Link>
      </p>

      <p className="mt-5 text-center text-[13px] leading-relaxed hf-text-subtle">
        로그인하면{' '}
        <Link href="/terms" className="underline underline-offset-2">
          이용약관
        </Link>
        {' · '}
        <Link href="/privacy" className="underline underline-offset-2">
          개인정보처리방침
        </Link>
        에 동의한 것으로 안내돼요.
      </p>
    </AuthScreenShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="불러오는 중…" />}>
      <LoginForm />
    </Suspense>
  );
}
