'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MobileMenu } from '@/components/layout/MobileMenu';

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.4-3.4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function InlineTopActions({ className = '' }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className={`flex shrink-0 items-center gap-3 text-[#15201D] ${className}`}>
        <Link href="/community/search" aria-label="통합 검색" className="flex h-8 w-8 items-center justify-center">
          <SearchIcon />
        </Link>
        <Link href="/mypage" aria-label="마이페이지" className="flex h-8 w-8 items-center justify-center">
          <UserIcon />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴"
          className="flex h-8 w-8 items-center justify-center"
        >
          <MenuIcon />
        </button>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
