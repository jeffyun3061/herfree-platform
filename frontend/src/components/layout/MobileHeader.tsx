'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ShellMenuIcon, ShellSearchIcon, ShellUserIcon } from '@/components/layout/ShellTopIcons';
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
      className="flex h-8 w-8 items-center justify-center text-[#3C443E]"
      aria-label={label}
      title={label}
    >
      {children}
    </Link>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, isReady } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { header } = usePageHeaderContext() ?? {};

  const isTabRoot = pathname === '/' || Boolean(getMobileTabRootTitle(pathname));
  const shouldShowBack = Boolean(header?.showBack) || !isTabRoot;
  const showHeaderActions = !header?.showBack;

  const handleBack = () => {
    navigateBack(router, { pathname, backHref: header?.backHref });
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-11 items-center justify-between gap-2 border-b border-[#E3E6E4]/80 bg-white px-[18px] lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {shouldShowBack ? (
            <button
              type="button"
              aria-label="뒤로 가기"
              onClick={handleBack}
              className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center text-[#3C443E]"
            >
              <BackIcon />
            </button>
          ) : null}
          <Link href="/" className="shrink-0" aria-label="홈">
            <BrandMark size="sm" showText={false} />
          </Link>
        </div>

        <div className="flex h-8 shrink-0 items-center gap-[18px]">
          {showHeaderActions ? (
            !isReady ? (
              <>
                <HeaderIconLink href="/community/search" label="통합 검색">
                  <ShellSearchIcon />
                </HeaderIconLink>
                <Link
                  href="/login"
                  className="text-[13px] font-medium text-[#3C443E]"
                  aria-label="로그인"
                  title="로그인"
                >
                  로그인
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-8 w-8 items-center justify-center text-[#3C443E]"
                  aria-label="메뉴"
                  title="메뉴"
                >
                  <ShellMenuIcon />
                </button>
              </>
            ) : (
              <>
                <HeaderIconLink href="/community/search" label="통합 검색">
                  <ShellSearchIcon />
                </HeaderIconLink>
                {isLoggedIn ? (
                  <HeaderIconLink href="/mypage" label="마이페이지">
                    <ShellUserIcon />
                  </HeaderIconLink>
                ) : (
                  <Link
                    href="/login"
                    className="text-[13px] font-medium text-[#3C443E]"
                    aria-label="로그인"
                    title="로그인"
                  >
                    로그인
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-8 w-8 items-center justify-center text-[#3C443E]"
                  aria-label="메뉴"
                  title="메뉴"
                >
                  <ShellMenuIcon />
                </button>
              </>
            )
          ) : null}
        </div>
      </header>
      {isReady ? <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} /> : null}
    </>
  );
}
