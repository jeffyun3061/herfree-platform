'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageHeaderProvider } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { shouldShowBottomNav, shouldShowShellHeader } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const publicNavPaths = ['/community', '/contents', '/videos', '/qna'];
  const showNav =
    shouldShowBottomNav(pathname) &&
    (isLoggedIn || publicNavPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)));
  const showHeader = shouldShowShellHeader(pathname) && (pathname !== '/' || isLoggedIn);

  return (
    <PageHeaderProvider>
      <div className="app-canvas">
        {showHeader && <DesktopHeader />}
        <div className="app-phone-shell">
          {showHeader && <MobileHeader />}
          <main className={cn('min-h-screen bg-[#F3EDE3]', showNav && 'pb-[5.5rem]')}>{children}</main>
          {showHeader && <SiteFooter />}
        </div>
        {showNav && <BottomNav />}
      </div>
    </PageHeaderProvider>
  );
}
