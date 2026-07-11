'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ShellMenuIcon, ShellSearchIcon, ShellUserIcon } from '@/components/layout/ShellTopIcons';
import { useAuth } from '@/hooks/useAuth';

const iconButtonBase = 'flex h-8 w-8 items-center justify-center';

export function InlineTopActions({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'onDark';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const inkClass = variant === 'onDark' ? 'text-white' : 'text-[#3C443E]';
  const iconButtonClass = `${iconButtonBase} ${inkClass}`;

  return (
    <>
      <div className={`flex shrink-0 items-center gap-[18px] ${inkClass} ${className}`}>
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
            className={`text-[13px] font-semibold ${inkClass}`}
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
