'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function CommunityWriteFab() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[5.75rem] z-30 mx-auto max-w-app">
      <Link
        href="/community/write"
        className="pointer-events-auto absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="글쓰기"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
