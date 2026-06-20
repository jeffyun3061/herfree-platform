'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

type CommunityFabProps = {
  href: string;
  className?: string;
  ariaLabel?: string;
};

export function CommunityFab({ href, className, ariaLabel = '글쓰기' }: CommunityFabProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        'fixed bottom-[5.5rem] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-fab transition-transform hover:scale-105 active:scale-95 lg:hidden',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </Link>
  );
}
