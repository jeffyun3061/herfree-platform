'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

function NavIcon({ href }: { href: string }) {
  const common = 'h-[21px] w-[21px]';

  if (href === '/') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  }

  if (href.startsWith('/community')) {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    );
  }

  if (href.startsWith('/journal')) {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    );
  }

  if (href.startsWith('/mypage')) {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2 2-2 3.3" />
      <line x1="12" y1="17" x2="12" y2="17.01" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-2.75rem)] max-w-[374px] -translate-x-1/2 rounded-[20px] bg-[rgba(7,22,18,.9)] px-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_14px_30px_-18px_rgba(7,37,31,.62)] backdrop-blur-[14px]"
      aria-label="하단 메뉴"
    >
      <ul className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.label} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className={cn(
                  'flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 py-1 text-[9.5px] transition-colors',
                  active ? 'font-semibold text-white' : 'font-medium text-white/55',
                )}
              >
                <NavIcon href={item.href} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
