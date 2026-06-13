'use client';

import { Suspense, useState } from 'react';
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="hero-panel mx-4 mt-6 rounded-[1.75rem] px-6 py-10 text-center">
        <div className="relative z-10 flex justify-center">
          <BrandMark variant="onPrimary" />
        </div>
        <h1 className="relative z-10 mt-2 text-2xl font-semibold">다시 만나서 반가워요</h1>
        <p className="relative z-10 mt-2 text-sm text-primary-foreground/80">
          이메일로 로그인해 주세요.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 py-8">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
        />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs font-medium text-primary">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
        {error && <ErrorMessage message={error} />}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
        <p className="text-center text-sm text-muted">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-primary">
            회원가입
          </Link>
        </p>
        <p className="text-center text-[11px] leading-relaxed text-muted">
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
