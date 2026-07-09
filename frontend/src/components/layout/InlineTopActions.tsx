'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ShellMenuIcon, ShellSearchIcon, ShellUserIcon } from '@/components/layout/ShellTopIcons';
import { useAuth } from '@/hooks/useAuth';

const iconButtonClass =
  'flex h-8 w-8 items-center justify-center text-[#15201D]';

export function InlineTopActions({ className = '' }: { className?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  return (
    <>
      <div className={`flex shrink-0 items-center gap-[18px] text-[#15201D] ${className}`}>
        <Link href="/community/search" aria-label="통합 검색" title="통합 검색" className={iconButtonClass}>
          <ShellSearchIcon />
        </Link>
        {isLoggedIn ? (
          <Link href="/mypage" aria-label="마이페이지" title="마이페이지" className={iconButtonClass}>
            <ShellUserIcon />
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="로그인"
            title="로그인"
            className="text-[13px] font-semibold text-[#15201D]"
          >
            로그인
          </Link>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴"
          title="메뉴"
          className={iconButtonClass}
        >
          <ShellMenuIcon />
        </button>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
