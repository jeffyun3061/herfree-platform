'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/icons/NavIcon';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 rounded-t-[1.75rem] bg-navy px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(26,28,30,0.18)] lg:hidden">
      <ul className="flex h-[4.5rem] items-center justify-around">
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
                  'flex min-w-[3rem] flex-col items-center gap-1 px-1 py-2 text-[10px] transition-colors',
                  active ? 'text-white' : 'text-slate-500',
                )}
              >
                <NavIcon name={item.icon} className="h-[1.35rem] w-[1.35rem]" />
                <span className={cn('leading-none', active && 'font-medium')}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
