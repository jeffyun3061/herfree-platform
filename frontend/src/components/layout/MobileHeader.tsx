'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { BrandMark } from '@/components/brand/BrandMark';
import { usePageHeaderContext } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { navigateBack } from '@/lib/navigateBack';
import { getMobileTabRootTitle } from '@/lib/navigation';

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-8 w-8 items-center justify-center text-[#15201D]"
      aria-label={label}
      title={label}
    >
      {children}
    </Link>
  );
}

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

function BackIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { header } = usePageHeaderContext() ?? {};

  const tabTitle = getMobileTabRootTitle(pathname);
  const title = header?.title ?? tabTitle;
  const showBack = header?.showBack ?? false;

  const handleBack = () => {
    navigateBack(router, { pathname, backHref: header?.backHref });
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-11 items-center justify-between gap-2 border-b border-[#E3E6E4]/80 bg-white px-[18px] lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBack ? (
            <>
              <button
                type="button"
                aria-label="뒤로 가기"
                onClick={handleBack}
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[#5B6864]"
              >
                <BackIcon />
              </button>
              {title ? (
                <h1 className="min-w-0 truncate text-[14.5px] font-semibold text-[#15201D]">{title}</h1>
              ) : null}
            </>
          ) : (
            <Link href="/" className="shrink-0" aria-label="홈">
              <BrandMark size="sm" showText={false} />
            </Link>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {!showBack ? (
            <>
              <HeaderIconLink href="/community?focus=search" label="검색">
                <SearchIcon />
              </HeaderIconLink>
              {isLoggedIn ? (
                <HeaderIconLink href="/mypage" label="마이페이지">
                  <UserIcon />
                </HeaderIconLink>
              ) : (
                <Link href="/login" className="text-[13px] font-medium text-[#15201D]">
                  로그인
                </Link>
              )}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center text-[#15201D]"
                aria-label="메뉴"
              >
                <MenuIcon />
              </button>
            </>
          ) : null}
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
