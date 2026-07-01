'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type GuestJournalPromoProps = {
  className?: string;
};

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function GuestJournalPromo({ className }: GuestJournalPromoProps) {
  return (
    <section className={cn('px-4 pt-4', className)} aria-labelledby="journal-guest-lock-title">
      <div className="overflow-hidden rounded-[24px] border border-[#E7DFD2] bg-white shadow-[0_18px_42px_-30px_rgba(24,34,28,.45)]">
        <div className="bg-[#07251F] px-5 pb-6 pt-7 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
            Private journal
          </p>
          <h1
            id="journal-guest-lock-title"
            className="hf-display mt-2 text-[26px] font-extrabold leading-[1.32]"
          >
            오늘의 몸상태를
            <br />
            기록해 보세요
          </h1>
          <p className="mt-3 text-[13px] leading-[1.7] text-white/72">
            수면, 영양제, 스트레스, 전조 증상을 한 흐름으로 남기고 나만의 패턴을 확인할 수 있어요.
          </p>
        </div>

        <div className="relative px-5 py-6">
          <div className="pointer-events-none select-none blur-[6px]" aria-hidden>
            <div className="grid grid-cols-3 gap-2 opacity-70">
              {[1, 2, 3].map((key) => (
                <div key={key} className="h-[72px] rounded-[16px] bg-[#ECE5D8]" />
              ))}
            </div>
            <div className="mt-3 h-24 rounded-[18px] bg-[#ECE5D8]" />
            <div className="mt-3 h-12 rounded-[14px] bg-[#E2D9CA]" />
          </div>

          <div
            className="absolute inset-0 flex items-center justify-center px-3 py-4"
            role="dialog"
            aria-modal="false"
            aria-labelledby="journal-guest-lock-dialog-title"
          >
            <div className="w-full max-w-[19rem] rounded-[20px] border border-[#E7DFD2] bg-white/95 px-5 py-5 text-center shadow-[0_20px_44px_-28px_rgba(20,30,25,.45)] backdrop-blur-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <LockIcon />
              </div>
              <p
                id="journal-guest-lock-dialog-title"
                className="mt-4 text-[15px] font-bold leading-snug text-[#15201D]"
              >
                회원만 이용할 수 있는 공간이에요
              </p>
              <p className="mt-2 text-[12.5px] leading-[1.65] text-[#65706B]">
                개인 일지는 로그인한 본인만 열람할 수 있어요.
                <br />
                가입 후 안전하게 기록을 시작해 보세요.
              </p>
              <ButtonLink
                href="/login?from=%2Fjournal"
                fullWidth
                size="lg"
                className="mt-5 rounded-[14px]"
              >
                로그인하고 시작하기
              </ButtonLink>
              <Link
                href="/signup?from=/journal"
                className="mt-3 block text-[12.5px] font-semibold text-primary"
              >
                아직 계정이 없다면 회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
