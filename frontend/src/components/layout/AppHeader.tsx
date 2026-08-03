'use client';

import { usePathname } from 'next/navigation';
import { DesktopHeader } from '@/components/layout/DesktopHeader';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { TopBar } from '@/components/layout/TopBar';
import { usePageHeaderContext } from '@/contexts/PageHeaderContext';
import { cn } from '@/lib/cn';

type AppHeaderProps = {
  visible: boolean;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
  className?: string;
};

/**
 * The only shell-level header entry point. PageHeader is declarative; this
 * component decides whether the responsive root header or the subpage bar is
 * rendered, so a page cannot accidentally render two competing top bars.
 */
export function AppHeader({ visible, desktopOnly = false, mobileOnly = false, className }: AppHeaderProps) {
  const pathname = usePathname();
  const pageHeader = usePageHeaderContext()?.header;

  if (!visible) return null;

  const isAdmin = pathname.startsWith('/admin');
  const isSubpage = Boolean(pageHeader && pageHeader.desktopVisible !== false);

  if (mobileOnly) {
    return visible ? <MobileHeader /> : null;
  }

  if (desktopOnly) {
    return visible ? (
      <div className={cn('app-header', className)}>
        <DesktopHeader />
        {isSubpage ? (
          <TopBar
            title={pageHeader?.title ?? ''}
            showBack={pageHeader?.showBack}
            backHref={pageHeader?.backHref}
            rightSlot={pageHeader?.rightSlot}
            className="hidden lg:flex"
          />
        ) : null}
        {isAdmin ? <span className="sr-only">관리자 영역</span> : null}
      </div>
    ) : null;
  }

  return (
    <div className={cn('app-header', className)}>
      {isSubpage ? (
        <TopBar
          title={pageHeader?.title ?? ''}
          showBack={pageHeader?.showBack}
          backHref={pageHeader?.backHref}
          rightSlot={pageHeader?.rightSlot}
          className="hidden lg:flex"
        />
      ) : (
        <DesktopHeader />
      )}
      <MobileHeader />
      {isAdmin ? <span className="sr-only">관리자 영역</span> : null}
    </div>
  );
}
