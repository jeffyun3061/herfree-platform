'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BrandMark } from '@/components/brand/BrandMark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="비밀번호 찾기" showBack centerTitle />
      <div className="mx-auto max-w-app px-5 py-8">
        <div className="mb-8 flex justify-center">
          <BrandMark variant="wrtn" size="md" />
        </div>
        <h2 className="text-xl font-bold text-ink">비밀번호를 잊으셨나요?</h2>
        <p className="mt-2 text-sm leading-relaxed text-wrtn-muted">
          가입한 이메일을 입력해 주세요. 비밀번호 재설정 기능은 준비 중이며, 아래 이메일로 문의해 주시면
          확인 후 안내드립니다.
        </p>

        <div className="mt-6">
          <Input
            label="이메일"
            type="email"
            required
            placeholder="이메일을 입력해 주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button
          type="button"
          fullWidth
          size="lg"
          className="mt-4"
          disabled={!email.trim()}
          onClick={() => {
            window.location.href = `mailto:support@herfree.kr?subject=비밀번호 찾기 문의&body=가입 이메일: ${encodeURIComponent(email)}`;
          }}
        >
          인증 요청
        </Button>

        <div className="mt-8 rounded-xl bg-wrtn-bg p-4 text-sm text-ink-soft">
          <p className="font-medium text-ink">문의 안내</p>
          <p className="mt-2">
            <a href="mailto:support@herfree.kr" className="font-semibold text-primary">
              support@herfree.kr
            </a>
          </p>
          <p className="mt-1 text-xs text-wrtn-muted">닉네임과 가입 이메일을 함께 보내주세요.</p>
        </div>

        <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-primary">
          로그인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
