'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateLogin } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
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
      router.replace('/');
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
      </form>
    </div>
  );
}
