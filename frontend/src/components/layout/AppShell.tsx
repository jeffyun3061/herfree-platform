'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { shouldShowBottomNav, shouldShowShellHeader } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showNav = shouldShowBottomNav(pathname);
  const showHeader = shouldShowShellHeader(pathname);

  return (
    <div className="min-h-screen w-full bg-wrtn-bg">
      {showHeader && <DesktopHeader />}
      <div className={cn('mx-auto w-full', 'max-w-app lg:max-w-none')}>
        {showHeader && <MobileHeader />}
        <main className={cn('min-h-screen', showNav && 'pb-[5.5rem] lg:pb-0')}>{children}</main>
        {showHeader && <SiteFooter />}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}
