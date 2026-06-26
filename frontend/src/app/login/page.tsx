'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
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
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

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
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="flex flex-col items-center text-center">
        <BrandMark variant="auth" size="lg" />
        <h1 className="mt-8 text-2xl font-bold text-ink">다시 만나서 반가워요</h1>
        <p className="mt-2 text-sm text-wrtn-muted">이메일로 로그인해 주세요.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-10 flex flex-1 flex-col">
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
        <label className="mt-3 flex items-center gap-2 text-sm text-wrtn-muted">
          <input
            type="checkbox"
            checked={rememberEmail}
            onChange={(e) => setRememberEmail(e.target.checked)}
          />
          아이디 저장
        </label>
        <div className="mt-3 text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-primary">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
        <Button type="submit" fullWidth size="lg" className="mt-6" disabled={isSubmitting}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
        <p className="mt-6 text-center text-sm text-wrtn-muted">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-semibold text-primary">
            회원가입
          </Link>
        </p>
        <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-wrtn-muted">
          로그인 시{' '}
          <Link href="/terms" className="underline underline-offset-2">
            이용약관
          </Link>
          {' 및 '}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </form>
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
