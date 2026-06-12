'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { MobileMenu } from '@/components/layout/MobileMenu';

function HeaderIconButton({
  href,
  label,
  children,
  onClick,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const className =
    'flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas-dark hover:text-navy';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label={label}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href ?? '/'} className={className} aria-label={label}>
      {children}
    </Link>
  );
}

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[3.25rem] items-center justify-between bg-white px-4 lg:hidden">
        <Link href="/">
          <BrandMark size="sm" />
        </Link>
        <div className="flex items-center gap-1">
          <HeaderIconButton href="/mypage" label="마이페이지">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
            </svg>
          </HeaderIconButton>
          <HeaderIconButton href="/#store" label="스토어">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 7h15l-1.5 9H7.5L6 7Z" strokeLinejoin="round" />
              <path d="M6 7 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
          </HeaderIconButton>
          <HeaderIconButton label="메뉴" onClick={() => setMenuOpen(true)}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </HeaderIconButton>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
