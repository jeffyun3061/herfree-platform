'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/icons/NavIcon';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-border/70 bg-surface/98 px-3 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(45,74,50,0.08)] backdrop-blur-lg">
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
                  'flex min-w-[3.25rem] flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[10px] transition-all',
                  active
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-muted hover:text-primary/80',
                )}
              >
                <NavIcon name={item.icon} className={cn('h-5 w-5', active && 'scale-105')} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
