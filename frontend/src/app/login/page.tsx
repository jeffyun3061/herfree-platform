'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
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
    <>
      <TopBar title="로그인" showBack />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-4 py-6">
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
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-primary">
            회원가입
          </Link>
        </p>
      </form>
    </>
  );
}
