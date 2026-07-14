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
      <TopBar title="계정 찾기" showBack />
      <div className="mx-auto max-w-app px-5 py-8">
        <div className="mb-8 flex justify-center">
          <BrandMark variant="auth" size="md" />
        </div>
        <h2 className="text-xl font-bold text-ink">이메일로 비밀번호 재설정</h2>
        <p className="mt-2 text-sm leading-relaxed text-wrtn-muted">
          헤르프리 아이디는 가입 이메일입니다. 가입한 이메일을 입력하면 비밀번호 재설정 안내를 보내 드립니다.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-wrtn-muted">
          보안을 위해 가입 여부는 화면에 표시하지 않습니다. 메일이 오지 않으면 스팸함과 입력한 이메일을 확인해 주세요.
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
                재설정 링크는 일정 시간이 지나면 만료됩니다. 링크가 만료되면 다시 요청해 주세요.
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

        <div className="mt-6 rounded-2xl border border-[#ECE5D8] bg-[#FBF8F1] px-4 py-3">
          <p className="text-sm font-semibold text-ink">가입 이메일이 기억나지 않나요?</p>
          <p className="mt-1 text-xs leading-relaxed text-wrtn-muted">
            자동 조회는 계정 노출 위험이 있어 제공하지 않습니다. 가입 경로와 예상 이메일을 정리해 운영자에게 문의해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
