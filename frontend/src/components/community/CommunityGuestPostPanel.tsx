'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type CommunityGuestPostPanelProps = {
  boardLabel?: string;
  loginFrom?: string;
  className?: string;
};

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-primary"
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

export function CommunityGuestPostPanel({
  boardLabel,
  loginFrom: loginFromProp,
  className,
}: CommunityGuestPostPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginFrom =
    loginFromProp ??
    encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));

  return (
    <section
      className={cn('relative overflow-hidden rounded-[20px] border border-[#E7DFD2] bg-white', className)}
      aria-labelledby="community-guest-post-lock-title"
    >
      <div className="pointer-events-none select-none px-4 py-4 blur-[5px]" aria-hidden>
        <div className="space-y-2.5">
          {[1, 2, 3].map((key) => (
            <div key={key} className="rounded-[16px] border border-[#ECE5D8] bg-[#FAF8F4] px-4 py-3.5">
              <div className="h-5 w-16 rounded-full bg-[#E2D9CA]" />
              <div className="mt-2.5 h-4 w-3/4 rounded bg-[#ECE5D8]" />
              <div className="mt-2 h-3 w-28 rounded bg-[#E2D9CA]" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[18.5rem] rounded-[18px] border border-[#E7DFD2] bg-white/95 px-5 py-5 text-center shadow-[0_16px_40px_-28px_rgba(20,30,25,.42)] backdrop-blur-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <LockIcon />
          </div>
          <p
            id="community-guest-post-lock-title"
            className="mt-3.5 text-[14.5px] font-bold leading-snug text-[#15201D]"
          >
            {boardLabel ? `${boardLabel} 글은` : '커뮤니티 글은'}
            <br />
            로그인 후 볼 수 있어요
          </p>
          <p className="mt-2 text-[12px] leading-[1.65] text-[#65706B]">
            익명으로 안전하게 이야기를 나눌 수 있어요.
            <br />
            가입 후 게시판을 둘러보세요.
          </p>
          <ButtonLink
            href={`/login?from=${loginFrom}`}
            fullWidth
            size="lg"
            className="mt-4 rounded-[14px]"
          >
            로그인하고 보기
          </ButtonLink>
          <Link
            href={`/signup?from=${loginFrom}`}
            className="mt-2.5 block text-[12px] font-semibold text-primary"
          >
            아직 계정이 없다면 회원가입
          </Link>
        </div>
      </div>
    </section>
  );
}
