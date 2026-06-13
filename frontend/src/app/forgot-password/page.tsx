'use client';

import Link from 'next/link';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  return (
    <>
      <TopBar title="비밀번호 찾기" showBack className="lg:hidden" />
      <div className="page-container max-w-lg py-10">
        <h1 className="hidden text-2xl font-semibold text-ink lg:block">비밀번호 찾기</h1>
        <div className="mt-6 rounded-2xl border border-border/80 bg-card p-6">
          <p className="text-sm leading-relaxed text-cream-foreground">
            비밀번호 재설정 기능은 현재 준비 중입니다. 계정 이메일을 기억하지 못하시거나 로그인에
            어려움이 있으시면 아래 이메일로 문의해 주세요.
          </p>
          <p className="mt-4 text-sm">
            <span className="text-muted">문의: </span>
            <a href="mailto:support@herfree.kr" className="font-medium text-primary">
              support@herfree.kr
            </a>
          </p>
          <p className="mt-2 text-xs text-muted">
            닉네임과 가입 이메일을 함께 보내주시면 확인 후 안내드립니다.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="flex-1">
              <Button fullWidth variant="secondary">
                로그인으로 돌아가기
              </Button>
            </Link>
            <a href="mailto:support@herfree.kr" className="flex-1">
              <Button fullWidth>이메일 문의하기</Button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
