'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { findBoardByType } from '@/domain/board/types';
import { cn } from '@/lib/cn';

const NAV_TEXT_ACTIVE = 'text-white';
const NAV_TEXT_INACTIVE = 'text-white/55';

export function BottomNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { boards } = useBoards();

  const questionHref = useMemo(() => {
    const board = findBoardByType(boards, 'QUESTION');
    return board ? `/community/${board.id}` : '/community';
  }, [boards]);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) =>
        item.href === '__question__' ? { ...item, href: questionHref } : item,
      ),
    [questionHref],
  );

  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-app -translate-x-1/2 rounded-2xl bg-[#1A1A1A] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden"
      aria-label="하단 메뉴"
    >
      <ul className="flex items-center justify-around">
        {navItems.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : item.label === 'Q&A'
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.label} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                className={cn(
                  'px-1 py-1 text-[11px] transition-colors',
                  active ? cn('font-semibold', NAV_TEXT_ACTIVE) : cn('font-medium', NAV_TEXT_INACTIVE),
                )}
              >
                {item.href === '/' ? (isLoggedIn ? '홈' : '홈') : item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
