'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/icons/NavIcon';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

/** 하단 네비 — 목업: 진녹 배경 + 연크림 아이콘/라벨 (노란색 아님) */
const NAV_TEXT_ACTIVE = 'text-[#f0ede6]';
const NAV_TEXT_INACTIVE = 'text-[#f0ede6]/50';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-app -translate-x-1/2 rounded-[1.125rem] bg-herfree-bg-dark px-1 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1 shadow-[0_4px_24px_rgba(9,42,42,0.35)] lg:hidden"
      aria-label="하단 메뉴"
    >
      <ul className="flex h-[3.75rem] items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className={cn(
                  'flex min-w-[2.75rem] flex-col items-center gap-1 px-0.5 py-1.5 text-[9px] transition-colors',
                  active ? cn('font-semibold', NAV_TEXT_ACTIVE) : cn('font-medium', NAV_TEXT_INACTIVE),
                )}
              >
                <NavIcon name={item.icon} className="h-[1.35rem] w-[1.35rem]" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
