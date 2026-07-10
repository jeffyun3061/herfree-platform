'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SocialLoginSection } from '@/components/auth/SocialLoginButtons';
import { validateLogin } from '@/domain/auth/validate';
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
    <div className="min-h-screen bg-[#F3EDE3]">
      <TopBar title="로그인" showBack />
      <div className="auth-screen !min-h-0 bg-transparent px-5 pb-10 pt-4">
        <div className="flex flex-col items-center text-center">
          <BrandMark variant="auth" size="lg" />
          <h1 className="hf-display mt-7 text-[26px] font-extrabold leading-tight text-[#1E2621]">
            어서오세요
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#5C645A]">
            간편 로그인으로 바로 시작하거나
            <br />
            이메일로 로그인할 수 있어요.
          </p>
        </div>

        {sessionNotice && (
          <div
            className="mt-5 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
            role="status"
          >
            {sessionNotice}
          </div>
        )}

        <SocialLoginSection returnUrl={returnUrl} mode="login" className="mt-7" />

        <section className="rounded-[20px] border border-[#ECE5D8] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,.04),0_12px_28px_-22px_rgba(20,30,25,.18)]">
          <h2 className="mb-4 text-[13px] font-extrabold text-[#15695E]">이메일 로그인</h2>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
            <Input
              label="이메일"
              type="email"
              autoComplete="email"
              placeholder="이메일을 입력해 주세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
            />
            <div className="mt-4">
              <Input
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[13px] text-[#5C645A]">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
                />
                아이디 저장
              </label>
              <Link href="/forgot-password" className="text-[13px] font-semibold text-[#0B3B36]">
                비밀번호 찾기
              </Link>
            </div>

            {error && (
              <div className="mt-4">
                <ErrorMessage message={error} />
              </div>
            )}

            <Button type="submit" fullWidth size="lg" className="mt-5" disabled={isSubmitting}>
              {isSubmitting ? '로그인 중…' : '이메일로 로그인'}
            </Button>
          </form>
        </section>

        <p className="mt-6 text-center text-[13px] text-[#5C645A]">
          계정이 없으신가요?{' '}
          <Link
            href={searchParams.get('from') ? `/signup?from=${encodeURIComponent(returnUrl)}` : '/signup'}
            className="font-bold text-[#0B3B36]"
          >
            회원가입
          </Link>
        </p>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#9A9F94]">
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="불러오는 중…" />}>
      <LoginForm />
    </Suspense>
  );
}
