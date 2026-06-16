'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
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
      router.replace('/journal');
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
        <h1 className="relative z-10 mt-2 text-2xl font-semibold">함께 시작해요</h1>
        <p className="relative z-10 mt-2 text-sm text-primary-foreground/80">
          이메일로 간단히 가입할 수 있어요.
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
        <p className="text-center text-[11px] leading-relaxed text-muted">
          가입 시{' '}
          <Link href="/terms" className="font-medium text-primary underline underline-offset-2">
            이용약관
          </Link>
          {' 및 '}
          <Link href="/privacy" className="font-medium text-primary underline underline-offset-2">
            개인정보처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
        <p className="text-center text-sm text-muted">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-primary">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
