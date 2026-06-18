'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/Button';
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
    <header className="sticky top-0 z-50 hidden border-b border-border bg-white/95 shadow-sm backdrop-blur-md lg:block">
      <div className="mx-auto flex h-[4.5rem] max-w-content items-center justify-between gap-8 px-10">
        <Link href="/" className="shrink-0">
          <BrandMark size="md" />
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-10">
          {DESKTOP_NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'nav-link',
                isNavActive(pathname, item.href) && 'nav-link-active',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/community"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-canvas-dark hover:text-navy"
            aria-label="커뮤니티"
            title="커뮤니티"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </Link>
          {isLoggedIn ? (
            <Link href="/mypage" className="text-sm font-medium text-ink-soft hover:text-navy">
              {user?.nickname}님
            </Link>
          ) : (
            <>
              <Link href="/login" className="nav-link px-2">
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
