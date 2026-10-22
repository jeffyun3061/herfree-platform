'use client';

import { usePathname } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { AppHeader } from '@/components/layout/AppHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageHeaderProvider } from '@/contexts/PageHeaderContext';
import { useAuth } from '@/hooks/useAuth';
import { useBackNavigationGuard } from '@/hooks/useBackNavigationGuard';
import { shouldShowBottomNav, shouldShowShellHeader } from '@/lib/navigation';
import { AppNoticeToast } from '@/components/ui/AppNoticeToast';
import { cn } from '@/lib/cn';
import { AdminMfaBoundary } from '@/components/admin/AdminMfaBoundary';
import { isStaff } from '@/domain/user/types';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  useBackNavigationGuard();
  const isAdminPage = pathname.startsWith('/admin');
  const showNav = shouldShowBottomNav(pathname);
  const showHeader = shouldShowShellHeader(pathname) && (pathname !== '/' || isLoggedIn);
  const operatorCommunity = isStaff(user?.role) && (pathname === '/' ||
    ['/community', '/inquiry', '/consult'].some((root) => pathname === root || pathname.startsWith(`${root}/`)));

  return (
    <PageHeaderProvider>
      <div className="app-canvas">
        <AppHeader visible={showHeader} desktopOnly />
        <div className={cn('app-phone-shell', isAdminPage && 'admin-shell')}>
          <AppHeader visible={showHeader} mobileOnly />
          <main
            className={cn(
              'min-h-[100dvh] bg-[#F3EDE3]',
              showNav && 'hf-main-with-bottom-nav',
            )}
          >
            {operatorCommunity ? <AdminMfaBoundary>{children}</AdminMfaBoundary> : children}
          </main>
          {showHeader && !showNav && <SiteFooter />}
        </div>
        {showNav && <BottomNav />}
        <AppNoticeToast />
      </div>
    </PageHeaderProvider>
  );
}
