'use client';

import Link from 'next/link';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

function LockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F0C778" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

type LoggedOutFeaturePromptProps = {
  title: string;
  subtitle: string;
  body: string;
  signupFrom: string;
  headerActions?: React.ReactNode;
  showHeaderActions?: boolean;
};

export function LoggedOutFeaturePrompt({
  title,
  subtitle,
  body,
  signupFrom,
  headerActions,
  showHeaderActions = false,
}: LoggedOutFeaturePromptProps) {
  return (
    <div className="flex min-h-[calc(100dvh-5rem)] flex-col pb-10">
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        titleAs="h2"
        actions={showHeaderActions ? (headerActions ?? undefined) : false}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-[18px] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#0B3B36] shadow-[0_10px_22px_-10px_rgba(11,59,54,.6)]">
          <LockIcon />
        </div>
        <p className="text-[16px] font-bold text-[#15201D]">회원만 이용할 수 있어요</p>
        <p className="mt-2 max-w-[280px] text-[13px] leading-[1.7] text-[#6E766F]">{body}</p>
        <Link
          href={`/signup?from=${encodeURIComponent(signupFrom)}`}
          className="mt-6 whitespace-nowrap rounded-[14px] bg-[#0B3B36] px-8 py-[15px] text-[14.5px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(11,59,54,.6)]"
        >
          30초 만에 가입하기
        </Link>
        <Link href="/" className="mt-[18px] text-[13px] hf-text-muted">
          ← 처음으로
        </Link>
      </div>
    </div>
  );
}
