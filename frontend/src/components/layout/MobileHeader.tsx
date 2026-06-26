'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { usePageHeaderContext } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { getMobileTabRootTitle } from '@/lib/navigation';
import { cn } from '@/lib/cn';

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
    'flex h-9 w-9 items-center justify-center rounded-full text-[#0B3B36] transition-colors hover:bg-[#F6F1E8]';

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
  const { isLoggedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { header } = usePageHeaderContext() ?? {};

  const tabTitle = getMobileTabRootTitle(pathname);
  const homeJournalTitle = pathname === '/' && isLoggedIn ? '개인일지' : null;
  const title = header?.title ?? homeJournalTitle ?? tabTitle;
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
      <header className="sticky top-0 z-40 flex h-[54px] items-center justify-between gap-2 bg-[#F3EDE3]/92 px-4 backdrop-blur-md lg:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {showBack ? (
            <>
              <button
                type="button"
                aria-label="뒤로 가기"
                onClick={handleBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1E2621] transition-colors hover:bg-[#F6F1E8]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {title ? (
                <h1 className="min-w-0 truncate text-[15px] font-semibold text-[#1E2621]">{title}</h1>
              ) : null}
            </>
          ) : (
            <>
              <Link href="/" className="shrink-0" aria-label="홈">
                <BrandMark size="sm" showText={false} />
              </Link>
              <span className="truncate text-[13px] font-medium text-[#5C645A]">
                {title ?? '헤르프리'}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <HeaderIconButton href="/community?focus=search" label="커뮤니티 검색">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </HeaderIconButton>
          <HeaderIconButton href="/mypage" label="마이페이지">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
            </svg>
          </HeaderIconButton>
          {!isLoggedIn && (
            <Link
              href="/login"
              className={cn(
                'rounded-full px-2 py-1 text-[11px] font-semibold text-[#0B3B36]',
                'transition-colors hover:bg-[#F6F1E8]',
              )}
            >
              로그인
            </Link>
          )}
          <HeaderIconButton label="메뉴" onClick={() => setMenuOpen(true)}>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </HeaderIconButton>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
