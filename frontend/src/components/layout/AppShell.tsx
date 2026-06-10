'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { shouldShowBottomNav } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showNav = shouldShowBottomNav(pathname);

  return (
    <div className="mx-auto min-h-screen w-full max-w-app bg-surface">
      <main className={cn('min-h-screen', showNav && 'pb-[5.5rem]')}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
