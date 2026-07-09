'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

type CommunityFabProps = {
  href: string;
  className?: string;
  ariaLabel?: string;
};

export function CommunityFab({ href, className, ariaLabel = '커뮤니티 글쓰기' }: CommunityFabProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'fixed bottom-[88px] right-5 z-30 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#0B3B36] text-white shadow-[0_10px_24px_-8px_rgba(11,59,54,.6)] transition-transform hover:scale-105 active:scale-95 lg:hidden',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
