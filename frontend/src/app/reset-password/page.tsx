'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { validatePassword } from '@/domain/auth/validate';
import { confirmPasswordReset } from '@/lib/api/auth';
import { getErrorMessage } from '@/lib/api/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('유효하지 않거나 만료된 재설정 링크입니다.');
      return;
    }

    const errors: Record<string, string> = {};
    const passwordError = validatePassword(newPassword);
    if (passwordError) errors.newPassword = passwordError;
    else if (newPassword !== newPasswordConfirm) {
      errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);
    try {
      await confirmPasswordReset({ token, newPassword });
      router.replace('/login?reason=password_reset');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="비밀번호 재설정" showBack />
      <div className="mx-auto max-w-app px-5 py-8">
        <div className="mb-8 flex justify-center">
          <BrandMark variant="auth" size="md" />
        </div>
        <h2 className="text-xl font-bold text-ink">새 비밀번호 설정</h2>
        <p className="mt-2 text-sm leading-relaxed text-wrtn-muted">
          새로 사용할 비밀번호를 입력해 주세요. 최소 8자 이상이어야 합니다.
        </p>

        {!token && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            재설정 링크가 올바르지 않습니다. 메일의 링크를 다시 확인하거나 비밀번호 찾기를 요청해 주세요.
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6">
          <Input
            label="새 비밀번호"
            type="password"
            required
            autoComplete="new-password"
            placeholder="새 비밀번호를 입력해 주세요"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={fieldErrors.newPassword}
          />
          <div className="mt-4">
            <Input
              label="새 비밀번호 확인"
              type="password"
              required
              autoComplete="new-password"
              placeholder="새 비밀번호를 다시 입력해 주세요"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              error={fieldErrors.newPasswordConfirm}
            />
          </div>

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
            disabled={!token || isSubmitting}
          >
            {isSubmitting ? '변경 중…' : '비밀번호 변경'}
          </Button>
        </form>

        <Link href="/forgot-password" className="mt-6 block text-center text-sm font-semibold text-primary">
          재설정 링크 다시 받기
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="불러오는 중…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
