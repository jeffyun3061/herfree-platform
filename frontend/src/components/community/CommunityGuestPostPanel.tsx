'use client';

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

  const boardPhrase = boardLabel ? `${boardLabel}은` : '커뮤니티 글은';

  return (
    <section
      className={cn(
        'rounded-[20px] border border-[#E7DFD2] bg-[#FAF8F4] px-4 py-8 sm:px-6 sm:py-10',
        className,
      )}
      aria-labelledby="community-guest-post-lock-title"
    >
      <div className="mx-auto flex w-full max-w-[20rem] flex-col items-center text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
          <LockIcon />
        </div>

        <h2
          id="community-guest-post-lock-title"
          className="mt-4 text-[15px] font-bold leading-snug text-[#15201D] break-keep"
        >
          {boardPhrase} 로그인한 회원만 볼 수 있어요
        </h2>

        <div className="mt-3 space-y-1.5 break-keep text-[13px] leading-relaxed text-[#65706B]">
          <p>익명으로 안전하게 이야기를 나눌 수 있어요.</p>
          <p>로그인 후 게시판을 둘러보세요.</p>
        </div>

        <ButtonLink
          href={`/login?from=${loginFrom}`}
          fullWidth
          size="lg"
          className="mt-5 rounded-[14px]"
        >
          로그인하고 보기
        </ButtonLink>

      </div>
    </section>
  );
}
