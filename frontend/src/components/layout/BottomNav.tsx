'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/navigation';
import { cn } from '@/lib/cn';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="flex h-16 items-stretch justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                  active ? 'text-primary font-medium' : 'text-muted hover:text-cream-foreground',
                )}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
