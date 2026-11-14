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

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  useBackNavigationGuard();
  const isAdminPage = pathname.startsWith('/admin');
  const isCommunityReader = pathname === '/community/write' || pathname.startsWith('/community/write/') || pathname.startsWith('/community/posts/');
  const isCommunityPage = pathname === '/community' || pathname.startsWith('/community/');
  const usesReadingPalette = isCommunityPage || pathname.startsWith('/contents/');
  const showNav = shouldShowBottomNav(pathname);
  const showHeader = shouldShowShellHeader(pathname) && (pathname !== '/' || isLoggedIn);

  return (
    <PageHeaderProvider>
      <div className={cn('app-canvas', usesReadingPalette && 'reading-canvas')}>
        <AppHeader visible={showHeader} desktopOnly />
        <div className={cn('app-phone-shell', isAdminPage && 'admin-shell', isCommunityReader && 'community-reader-shell')}>
          <AppHeader visible={showHeader} mobileOnly />
          <main
            className={cn(
              'min-h-[100dvh]',
              usesReadingPalette ? 'bg-[#F8F5EF]' : 'bg-[#F3EDE3]',
              !isCommunityReader && 'lg:min-h-[min(844px,calc(100vh-4rem))]',
              showNav && 'hf-main-with-bottom-nav',
            )}
          >
            {children}
          </main>
          {showHeader && !showNav && <SiteFooter />}
        </div>
        {showNav && <BottomNav />}
        <AppNoticeToast />
      </div>
    </PageHeaderProvider>
  );
}
