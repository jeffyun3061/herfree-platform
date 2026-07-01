'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { BrandMark } from '@/components/brand/BrandMark';
import { usePageHeaderContext } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { getMobileTabRootTitle, isCommunityListRoute } from '@/lib/navigation';
import { cn } from '@/lib/cn';

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
      className="flex h-8 w-8 items-center justify-center text-base text-[#15201D]"
      aria-label={label}
    >
      {children}
    </Link>
  );
}

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { header } = usePageHeaderContext() ?? {};

  const communityList = isCommunityListRoute(pathname);
  const tabTitle = getMobileTabRootTitle(pathname);
  const title = header?.title ?? tabTitle;
  const showBack = header?.showBack ?? false;

  const handleBack = () => {
    if (header?.backHref) {
      router.push(header.backHref);
      return;
    }
    router.back();
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
                className="flex h-8 w-8 shrink-0 items-center justify-center text-xl text-[#5B6864]"
              >
                ‹
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
              <HeaderIconLink href="/community/search" label="검색">
                🔍
              </HeaderIconLink>
              {!communityList && isLoggedIn ? (
                <HeaderIconLink href="/mypage" label="마이페이지">
                  👤
                </HeaderIconLink>
              ) : null}
              {!communityList && !isLoggedIn ? (
                <Link
                  href="/login"
                  className={cn('text-[13px] font-medium text-[#15201D]')}
                >
                  로그인
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="flex h-8 w-8 items-center justify-center text-base text-[#15201D]"
                aria-label="메뉴"
              >
                ☰
              </button>
            </>
          ) : null}
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
