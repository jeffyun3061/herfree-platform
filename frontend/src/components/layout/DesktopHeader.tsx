'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
import { SearchIcon } from '@/components/ui/ShellIcons';
import { DESKTOP_NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (href.startsWith('/#')) return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopHeader() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-[#E5DDCF]/70 bg-[#F3EDE3]/90 backdrop-blur-md lg:block">
      <div className="mx-auto flex h-[4.25rem] max-w-content items-center justify-between gap-8 px-10">
        <Link href="/" className="shrink-0" aria-label="홈">
          <BrandMark size="md" />
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-8" aria-label="주요 메뉴">
          {DESKTOP_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'text-sm font-medium text-[#5C645A] transition-colors hover:text-[#0B3B36]',
                isNavActive(pathname, item.href) && 'font-semibold text-[#0B3B36]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/community?focus=search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#5C645A] transition-colors hover:bg-[#F6F1E8] hover:text-[#0B3B36]"
            aria-label="커뮤니티 검색"
            title="커뮤니티 검색"
          >
            <SearchIcon />
          </Link>
          {isLoggedIn ? (
            <Link href="/mypage" className="text-sm font-medium text-[#5C645A] hover:text-[#0B3B36]">
              {user?.nickname}님
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-2 text-sm font-medium text-[#5C645A] hover:text-[#0B3B36]">
                로그인
              </Link>
              <Link href="/signup">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
