'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/icons/NavIcon';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-wrtn-border bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] lg:hidden">
      <ul className="flex h-[4.25rem] items-center justify-around">
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
                  active ? 'font-semibold text-primary' : 'text-wrtn-muted',
                )}
              >
                <NavIcon name={item.icon} className="h-6 w-6" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
