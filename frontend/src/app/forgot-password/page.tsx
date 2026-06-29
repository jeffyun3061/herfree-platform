'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateEmail } from '@/domain/auth/validate';
import { requestPasswordReset } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError(emailError);
      return;
    }
    setFieldError(null);
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const message = await requestPasswordReset({ email: email.trim() });
      setSuccessMessage(message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="비밀번호 찾기" showBack />
      <div className="mx-auto max-w-app px-5 py-8">
        <div className="mb-8 flex justify-center">
          <BrandMark variant="auth" size="md" />
        </div>
        <h2 className="text-xl font-bold text-ink">비밀번호를 잊으셨나요?</h2>
        <p className="mt-2 text-sm leading-relaxed text-wrtn-muted">
          가입한 이메일을 입력해 주세요. 비밀번호 재설정 링크를 보내 드립니다.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
          <Input
            label="이메일"
            type="email"
            required
            autoComplete="email"
            placeholder="이메일을 입력해 주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError ?? undefined}
          />

          {successMessage && (
            <div
              className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-ink"
              role="status"
            >
              {successMessage}
              <p className="mt-2 text-xs text-wrtn-muted">
                로컬 개발 환경에서는 백엔드 콘솔 로그에 재설정 링크가 출력됩니다.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorMessage message={error} />
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            className="mt-4"
            disabled={!email.trim() || isSubmitting}
          >
            {isSubmitting ? '요청 중…' : '재설정 링크 받기'}
          </Button>
        </form>

        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-primary">
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
