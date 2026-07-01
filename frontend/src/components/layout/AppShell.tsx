'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageHeaderProvider } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { useBackNavigationGuard } from '@/hooks/useBackNavigationGuard';
import { shouldShowBottomNav, shouldShowShellHeader } from '@/lib/navigation';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  useBackNavigationGuard();
  const isAdminPage = pathname.startsWith('/admin');
  const showNav = shouldShowBottomNav(pathname);
  const showHeader = shouldShowShellHeader(pathname) && (pathname !== '/' || isLoggedIn);

  return (
    <PageHeaderProvider>
      <div className="app-canvas">
        {showHeader && <DesktopHeader />}
        <div className={cn('app-phone-shell', isAdminPage && 'admin-shell')}>
          {showHeader && <MobileHeader />}
          <main className={cn('min-h-screen bg-[#F3EDE3]', showNav && 'pb-[5.5rem]')}>{children}</main>
          {showHeader && <SiteFooter />}
        </div>
        {showNav && <BottomNav />}
      </div>
    </PageHeaderProvider>
  );
}
