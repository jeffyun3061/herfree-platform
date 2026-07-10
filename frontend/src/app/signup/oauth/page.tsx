'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { validateNickname } from '@/domain/auth/validate';
import { getErrorMessage } from '@/lib/api/client';

function resolveReturnUrl(from: string | null): string {
  if (!from || !from.startsWith('/') || from.startsWith('//')) return '/journal';
  if (from.startsWith('/login') || from.startsWith('/signup')) return '/journal';
  return from;
}

function OAuthSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeOAuthProfile } = useAuth();
  const profileCompletionToken = searchParams.get('token') ?? '';
  const [nickname, setNickname] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequiredAgreed = agreeTerms && agreePrivacy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileCompletionToken) {
      setError('소셜 가입을 이어서 진행할 수 없습니다. 다시 로그인해 주세요.');
      return;
    }

    if (!allRequiredAgreed) {
      setError('필수 약관에 동의해 주세요.');
      return;
    }

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      setFieldErrors({ nickname: nicknameError });
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);

    try {
      await completeOAuthProfile(profileCompletionToken, nickname.trim());
      router.replace(resolveReturnUrl(searchParams.get('from')));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profileCompletionToken) {
    return (
      <div className="min-h-screen bg-[#F3EDE3]">
        <TopBar title="프로필 설정" showBack />
        <div className="auth-screen !min-h-0 bg-transparent px-6 pt-10">
          <ErrorMessage message="소셜 가입을 이어서 진행할 수 없습니다. 다시 로그인해 주세요." />
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-primary">
            로그인 화면으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EDE3]">
      <TopBar title="프로필 설정" showBack />
      <div className="auth-screen !min-h-0 bg-transparent pt-6">
        <div className="flex flex-col items-center text-center">
          <BrandMark variant="auth" size="lg" />
          <h1 className="hf-display mt-8 text-[26px] font-extrabold leading-tight text-[#1E2621]">
            거의 다 됐어요
          </h1>
          <p className="mt-2 text-sm text-[#5C645A]">커뮤니티에 표시될 닉네임만 정해 주세요.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 flex flex-1 flex-col gap-4">
          <Input
            label="닉네임"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="커뮤니티에 표시될 이름"
            error={fieldErrors.nickname}
          />

          <div className="mt-2 space-y-3 rounded-[18px] border border-[#ECE5D8] bg-white p-4 shadow-card">
            <label className="flex items-start gap-3 text-sm text-[#1E2621]">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
              />
              <span>
                <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
                <Link href="/terms" className="underline underline-offset-2">
                  이용약관
                </Link>
                에 동의합니다.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-[#1E2621]">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#ECE5D8] text-[#0B3B36] focus:ring-[#0B3B36]"
              />
              <span>
                <span className="font-medium text-[#0B3B36]">[필수]</span>{' '}
                <Link href="/privacy" className="underline underline-offset-2">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>
          </div>

          {error && <ErrorMessage message={error} />}
          <Button type="submit" fullWidth size="lg" disabled={isSubmitting || !allRequiredAgreed}>
            {isSubmitting ? '가입 완료 중...' : '시작하기'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function OAuthSignupPage() {
  return (
    <Suspense fallback={null}>
      <OAuthSignupForm />
    </Suspense>
  );
}
