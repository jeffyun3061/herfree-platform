'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateSignup } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.replace('/login');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="회원가입" showBack />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          error={fieldErrors.passwordConfirm}
        />
        <Input
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          error={fieldErrors.nickname}
        />
        {error && <ErrorMessage message={error} />}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? '가입 중…' : '가입하기'}
        </Button>
        <p className="text-center text-sm text-muted">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary">
            로그인
          </Link>
        </p>
      </form>
    </>
  );
}
